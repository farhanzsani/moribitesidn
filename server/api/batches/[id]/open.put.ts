import { mapBatch, query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  await query(`UPDATE po_batches SET status = 'Closed'`)
  const result = await query(`
    UPDATE po_batches
    SET status = 'Open'
    WHERE id = $1
    RETURNING id, nama_batch, catatan, status, created_at
  `, [id])

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Batch tidak ditemukan.' })
  }

  await query(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('active_batch_id', $1::jsonb, CURRENT_TIMESTAMP),
           ('order_open', 'true'::jsonb, CURRENT_TIMESTAMP)
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
  `, [JSON.stringify(String(id))])

  return mapBatch(result.rows[0])
})
