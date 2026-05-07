import { mapOrder, query } from '../utils/db'

export default defineEventHandler(async () => {
  const result = await query(`
    SELECT p.id, p.produk_id, p.batch_id, b.nama_batch, p.nama_lengkap, p.no_wa, p.alamat, p.produk_nama,
           p.jumlah, p.total_harga, p.catatan, p.status, p.created_at
    FROM pesanan p
    LEFT JOIN po_batches b ON b.id = p.batch_id
    ORDER BY p.created_at DESC, p.id DESC
  `)

  return result.rows.map(mapOrder)
})
