import { query } from '../../utils/db'

export default defineEventHandler(async () => {
  const [settingResult, openBatchResult] = await Promise.all([
    query(`
    SELECT key, value
    FROM app_settings
    WHERE key IN ('order_open', 'active_batch_id')
    `),
    query(`
      SELECT id
      FROM po_batches
      WHERE status = 'Open'
      ORDER BY id DESC
      LIMIT 1
    `)
  ])

  const settings = Object.fromEntries(settingResult.rows.map((row) => [row.key, row.value]))
  const openBatchId = openBatchResult.rows[0]?.id ? String(openBatchResult.rows[0].id) : ''
  const activeBatchId = settings.active_batch_id ? String(settings.active_batch_id) : openBatchId

  return {
    orderOpen: settings.order_open !== false && Boolean(activeBatchId),
    activeBatchId
  }
})
