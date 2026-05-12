import { mapOrder, query } from '../utils/db'

const maxProofLength = 3_000_000

function isValidPaymentProof(value: string) {
  return /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(value) && value.length <= maxProofLength
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const productId = body.produkId || null
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

  const result = await query(`
    INSERT INTO pesanan (produk_id, batch_id, nama_lengkap, no_wa, alamat, produk_nama, jumlah, total_harga, metode_pembayaran, bukti_pembayaran, catatan, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Pending')
    RETURNING id, produk_id, batch_id, nama_lengkap, no_wa, alamat, produk_nama, jumlah, total_harga, metode_pembayaran, bukti_pembayaran, catatan, status, created_at
  `, [
    productId,
    batchId,
    body.nama,
    body.wa,
    body.alamat,
    body.produk,
    Number(body.qty || 1),
    Number(body.total || 0),
    metodePembayaran,
    buktiPembayaran,
    body.catatan || ''
  ])

  const order = result.rows[0]
  const batch = await query('SELECT nama_batch FROM po_batches WHERE id = $1', [order.batch_id])
  return mapOrder({ ...order, nama_batch: batch.rows[0]?.nama_batch })
})
