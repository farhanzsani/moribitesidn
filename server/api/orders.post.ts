import { mapOrder, query } from '../utils/db'
import { OrderSchema } from '../utils/validation'
import { uploadPaymentProof } from '../utils/supabase'

// Simple in-memory rate limit (limited per instance, but better than nothing)
const recentIPs = new Map<string, { count: number, lastSeen: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5

export default defineEventHandler(async (event) => {
  // 1. Rate Limiting
  const clientIP = getRequestHeader(event, 'x-forwarded-for') || 'anonymous'
  const now = Date.now()
  const ipData = recentIPs.get(clientIP) || { count: 0, lastSeen: now }

  if (now - ipData.lastSeen > RATE_LIMIT_WINDOW) {
    ipData.count = 0
    ipData.lastSeen = now
  }

  ipData.count++
  recentIPs.set(clientIP, ipData)

  if (ipData.count > MAX_REQUESTS_PER_WINDOW) {
    throw createError({ statusCode: 429, statusMessage: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' })
  }

  // 2. Validate Body
  const rawBody = await readBody(event)

  // Honeypot check (field that should be empty)
  if (rawBody.important_field) {
    console.warn(`Honeypot triggered by IP: ${clientIP}`)
    return { success: true } // Silently fail for bots
  }

  const resultValidation = OrderSchema.safeParse(rawBody)
  if (!resultValidation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Data tidak valid: ${resultValidation.error.issues.map((e: any) => e.message).join(', ')}`
    })
  }

  const body = resultValidation.data
  let batchId = body.batchId || null

  if (!batchId) {
    const setting = await query(`
      SELECT value
      FROM app_settings
      WHERE key = 'active_batch_id'
    `)
    batchId = setting.rows[0]?.value || null
  }

  if (!batchId) {
    throw createError({ statusCode: 400, statusMessage: 'Belum ada batch PO yang aktif.' })
  }

  const metodePembayaran = body.metodePembayaran
  let buktiPembayaran = body.buktiPembayaran || ''

  if (metodePembayaran === 'qris' && !buktiPembayaran) {
    throw createError({ statusCode: 400, statusMessage: 'Bukti pembayaran wajib diupload untuk QRIS.' })
  }

  // 3. Upload bukti ke Supabase jika dikonfigurasi; jika tidak, simpan base64 di database
  if (buktiPembayaran.startsWith('data:image')) {
    const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    if (hasSupabase) {
      try {
        const tempId = Math.random().toString(36).substring(7)
        buktiPembayaran = await uploadPaymentProof(buktiPembayaran, tempId)
      } catch (err) {
        console.error('Gagal upload ke Supabase Storage, menyimpan base64:', err)
      }
    }
  }

  const rawItems = body.produkItems
  const productIds = rawItems.map((item: any) => String(item.id || item.produkId || '')).filter(Boolean)

  if (!productIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Pilih minimal satu produk.' })
  }

  const invalidProductIds = productIds.filter((id) => !/^\d+$/.test(id))
  if (invalidProductIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data produk tidak valid. Muat ulang halaman lalu pilih produk lagi.'
    })
  }

  const productResult = await query(`
    SELECT id, nama_produk, harga
    FROM produk
    WHERE id = ANY($1::bigint[]) AND is_active = TRUE
  `, [productIds])

  const productsById = new Map(productResult.rows.map((product: any) => [String(product.id), product]))
  const productItems = productIds.map((id: string) => {
    const product: any = productsById.get(id)
    if (!product) return null
    return {
      id: String(product.id),
      name: product.nama_produk,
      price: Number(product.harga || 0)
    }
  })

  if (productItems.some((item) => !item)) {
    throw createError({ statusCode: 400, statusMessage: 'Ada produk yang tidak valid atau sedang nonaktif.' })
  }

  const summary = new Map<string, { name: string, qty: number }>()
  productItems.forEach((item) => {
    if (!item) return
    const current = summary.get(item.id) || { name: item.name, qty: 0 }
    current.qty += 1
    summary.set(item.id, current)
  })

  const produkNama = Array.from(summary.values()).map((item) => `${item.name} (${item.qty})`).join(', ')
  const totalHarga = productItems.reduce((sum, item) => sum + Number(item?.price || 0), 0)
  const singleProductId = summary.size === 1 ? productItems[0]?.id : null

  const insertResult = await query(`
    INSERT INTO pesanan (produk_id, batch_id, nama_lengkap, no_wa, alamat, produk_nama, produk_items, jumlah, total_harga, metode_pembayaran, bukti_pembayaran, catatan, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, 'Pending')
    RETURNING id, produk_id, batch_id, nama_lengkap, no_wa, alamat, produk_nama, produk_items, jumlah, total_harga, metode_pembayaran, bukti_pembayaran, catatan, status, created_at
  `, [
    singleProductId,
    batchId,
    body.nama,
    body.wa,
    body.alamat,
    produkNama,
    JSON.stringify(productItems),
    productItems.length,
    totalHarga,
    metodePembayaran,
    buktiPembayaran,
    body.catatan || ''
  ])

  const order = insertResult.rows[0]
  const batchResult = await query('SELECT nama_batch FROM po_batches WHERE id = $1', [order.batch_id])
  const mappedOrder = mapOrder({ ...order, nama_batch: batchResult.rows[0]?.nama_batch })

  // 4. Sync to Google Sheet (Server-side)
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK
  if (webhookUrl) {
    // We use fire and forget or await depending on preference, 
    // usually better to not wait for external API if not critical.
    $fetch(webhookUrl, {
      method: 'POST',
      body: {
        nama: mappedOrder.nama,
        wa: mappedOrder.wa,
        alamat: mappedOrder.alamat,
        produk: mappedOrder.produk,
        qty: mappedOrder.qty,
        total: mappedOrder.total,
        metodePembayaran: mappedOrder.metodePembayaran === 'qris' ? 'QRIS' : 'Cash',
        catatan: mappedOrder.catatan,
        waktu: new Date(mappedOrder.waktu).toLocaleString('id-ID')
      }
    }).catch(err => console.error('Gagal sinkron Google Sheet:', err))
  }

  return mappedOrder
})
