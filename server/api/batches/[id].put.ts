import { mapBatch, query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const result = await query(`
    UPDATE po_batches
    SET nama_batch = $1,
        catatan = $2
    WHERE id = $3
    RETURNING id, nama_batch, catatan, status, created_at
  `, [body.name, body.note || '', id])

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Batch tidak ditemukan.' })
  }

  return mapBatch(result.rows[0])
})
