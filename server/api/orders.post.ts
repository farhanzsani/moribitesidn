import { mapOrder, query } from '../utils/db'

const maxProofLength = 3_000_000

function isValidPaymentProof(value: string) {
  return /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(value) && value.length <= maxProofLength
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
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

  const metodePembayaran = body.metodePembayaran === 'qris' ? 'qris' : 'cash'
  const buktiPembayaran = body.buktiPembayaran || ''

  if (metodePembayaran === 'qris' && !buktiPembayaran) {
    throw createError({ statusCode: 400, statusMessage: 'Bukti pembayaran wajib diupload untuk QRIS.' })
  }

  if (buktiPembayaran && !isValidPaymentProof(buktiPembayaran)) {
    throw createError({ statusCode: 400, statusMessage: 'Format bukti pembayaran tidak valid atau terlalu besar.' })
  }

  const rawItems = Array.isArray(body.produkItems) && body.produkItems.length
    ? body.produkItems
    : [{ id: body.produkId }]

  const productIds = rawItems.map((item: any) => String(item.id || item.produkId || '')).filter(Boolean)

  if (!productIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Pilih minimal satu produk.' })
  }

  const productResult = await query(`
    SELECT id, nama_produk, harga
    FROM produk
    WHERE id = ANY($1::bigint[]) AND is_active = TRUE
  `, [productIds])

  const productsById = new Map(productResult.rows.map((product: any) => [String(product.id), product]))
  const productItems = productIds.map((id: string) => {
    const product = productsById.get(id)
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

  const result = await query(`
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

  const order = result.rows[0]
  const batch = await query('SELECT nama_batch FROM po_batches WHERE id = $1', [order.batch_id])
  return mapOrder({ ...order, nama_batch: batch.rows[0]?.nama_batch })
})
