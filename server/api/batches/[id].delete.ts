import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const orders = await query<{ count: string }>(`
    SELECT COUNT(*)::text AS count
    FROM pesanan
    WHERE batch_id = $1
  `, [id])

  if (Number(orders.rows[0]?.count || 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Batch tidak bisa dihapus karena masih memiliki pesanan.'
    })
  }

  await query(`
    DELETE FROM po_batches
    WHERE id = $1
  `, [id])

  return { ok: true }
})
