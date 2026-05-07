import { mapOrder, query } from '../utils/db'

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

  const result = await query(`
    INSERT INTO pesanan (produk_id, batch_id, nama_lengkap, no_wa, alamat, produk_nama, jumlah, total_harga, catatan, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
    RETURNING id, produk_id, batch_id, nama_lengkap, no_wa, alamat, produk_nama, jumlah, total_harga, catatan, status, created_at
  `, [
    productId,
    batchId,
    body.nama,
    body.wa,
    body.alamat,
    body.produk,
    Number(body.qty || 1),
    Number(body.total || 0),
    body.catatan || ''
  ])

  const order = result.rows[0]
  const batch = await query('SELECT nama_batch FROM po_batches WHERE id = $1', [order.batch_id])
  return mapOrder({ ...order, nama_batch: batch.rows[0]?.nama_batch })
})
