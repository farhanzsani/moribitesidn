import { mapBatch, query } from '../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.openNow) {
    await query(`UPDATE po_batches SET status = 'Closed'`)
  }

  const result = await query(`
    INSERT INTO po_batches (nama_batch, catatan, status)
    VALUES ($1, $2, $3)
    RETURNING id, nama_batch, catatan, status, created_at
  `, [
    body.name,
    body.note || '',
    body.openNow ? 'Open' : 'Closed'
  ])

  if (body.openNow) {
    await query(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('active_batch_id', $1::jsonb, CURRENT_TIMESTAMP),
             ('order_open', 'true'::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(String(result.rows[0].id))])
  }

  return mapBatch(result.rows[0])
})
