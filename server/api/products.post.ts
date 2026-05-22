import { mapProduct, query } from '../utils/db'
import { ProductSchema } from '../utils/validation'

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event)
  const resultValidation = ProductSchema.safeParse(rawBody)

  if (!resultValidation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Data tidak valid: ${resultValidation.error.errors.map(e => e.message).join(', ')}`
    })
  }

  const body = resultValidation.data

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
    body.active ?? true
  ])

  return mapProduct(result.rows[0])
})
