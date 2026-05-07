import { mapBatch, query } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const result = await query(`
    UPDATE po_batches
    SET status = 'Closed'
    WHERE id = $1
    RETURNING id, nama_batch, catatan, status, created_at
  `, [id])

  if (!result.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Batch tidak ditemukan.' })
  }

  const setting = await query(`SELECT value FROM app_settings WHERE key = 'active_batch_id'`)
  if (String(setting.rows[0]?.value || '') === String(id)) {
    await query(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('active_batch_id', 'null'::jsonb, CURRENT_TIMESTAMP),
             ('order_open', 'false'::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `)
  }

  return mapBatch(result.rows[0])
})
