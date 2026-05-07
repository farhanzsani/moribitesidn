import { query } from '../../utils/db'

export default defineEventHandler(async () => {
  const result = await query(`
    SELECT key, value
    FROM app_settings
    WHERE key IN ('order_open', 'active_batch_id')
  `)

  const settings = Object.fromEntries(result.rows.map((row) => [row.key, row.value]))

  return {
    orderOpen: settings.order_open !== false,
    activeBatchId: settings.active_batch_id ? String(settings.active_batch_id) : ''
  }
})
