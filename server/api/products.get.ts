import { mapProduct, query } from '../utils/db'

export default defineEventHandler(async () => {
  const result = await query(`
    SELECT id, nama_produk, kategori, deskripsi, harga, image_url, badge, is_active
    FROM produk
    ORDER BY id ASC
  `)

  return result.rows.map(mapProduct)
})
