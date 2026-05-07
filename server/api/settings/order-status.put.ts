import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const orderOpen = Boolean(body.orderOpen)

  await query(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('order_open', $1::jsonb, CURRENT_TIMESTAMP)
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
  `, [JSON.stringify(orderOpen)])

  if (!orderOpen) {
    await query(`
      UPDATE po_batches
      SET status = 'Closed'
      WHERE status = 'Open';

      INSERT INTO app_settings (key, value, updated_at)
      VALUES ('active_batch_id', 'null'::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `)
  }

  return { orderOpen }
})
