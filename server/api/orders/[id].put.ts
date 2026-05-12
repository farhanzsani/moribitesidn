import { mapOrder, query } from '../../utils/db'

const allowedStatuses = ['Pending', 'Diproses', 'Selesai', 'Dibatalkan']

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!allowedStatuses.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status pesanan tidak valid.' })
  }

  const result = await query(`
    UPDATE pesanan
    SET status = $1
    WHERE id = $2
    RETURNING id, produk_id, batch_id, nama_lengkap, no_wa, alamat, produk_nama, jumlah, total_harga, metode_pembayaran, bukti_pembayaran, catatan, status, created_at
  `, [body.status, id])

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan.' })
  }

  const order = result.rows[0]
  const batch = await query('SELECT nama_batch FROM po_batches WHERE id = $1', [order.batch_id])
  return mapOrder({ ...order, nama_batch: batch.rows[0]?.nama_batch })
})
