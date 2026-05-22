import { mapBatch, query } from '../utils/db'
import { BatchSchema } from '../utils/validation'

export default defineEventHandler(async (event) => {
  const rawBody = await readBody(event)
  const resultValidation = BatchSchema.safeParse(rawBody)

  if (!resultValidation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Data tidak valid: ${resultValidation.error.issues.map((e: any) => e.message).join(', ')}`
    })
  }

  const body = resultValidation.data

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
