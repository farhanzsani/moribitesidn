import { mapProduct, query } from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const result = await query(`
    INSERT INTO produk (nama_produk, kategori, deskripsi, harga, image_url, badge, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, nama_produk, kategori, deskripsi, harga, image_url, badge, is_active
  `, [
    body.name,
    body.category,
    body.description || '',
    Number(body.price || 0),
    body.image || '',
    body.badge || null,
    Boolean(body.active)
  ])

  return mapProduct(result.rows[0])
})
