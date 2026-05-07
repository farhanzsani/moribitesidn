import { mapProduct, query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const result = await query(`
    UPDATE produk
    SET nama_produk = $1,
        kategori = $2,
        deskripsi = $3,
        harga = $4,
        image_url = $5,
        badge = $6,
        is_active = $7
    WHERE id = $8
    RETURNING id, nama_produk, kategori, deskripsi, harga, image_url, badge, is_active
  `, [
    body.name,
    body.category,
    body.description || '',
    Number(body.price || 0),
    body.image || '',
    body.badge || null,
    Boolean(body.active),
    id
  ])

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
  }

  return mapProduct(result.rows[0])
})
