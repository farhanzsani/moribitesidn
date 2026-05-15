import { mapBatch, mapProduct, query } from '../utils/db'

export default defineEventHandler(async () => {
  const [productResult, settingResult, openBatchResult] = await Promise.all([
    query(`
      SELECT id, nama_produk, kategori, deskripsi, harga, image_url, badge, is_active
      FROM produk
      WHERE is_active = TRUE
      ORDER BY id ASC
    `),
    query(`
      SELECT key, value
      FROM app_settings
      WHERE key IN ('order_open', 'active_batch_id')
    `),
    query(`
      SELECT id, nama_batch, catatan, status, created_at
      FROM po_batches
      WHERE status = 'Open'
      ORDER BY id DESC
      LIMIT 1
    `)
  ])

  const settings = Object.fromEntries(settingResult.rows.map((row) => [row.key, row.value]))
  const activeBatch = openBatchResult.rows[0] ? mapBatch(openBatchResult.rows[0]) : null
  const activeBatchId = settings.active_batch_id ? String(settings.active_batch_id) : activeBatch?.id || ''

  return {
    products: productResult.rows.map(mapProduct),
    activeBatch,
    settings: {
      orderOpen: settings.order_open !== false && Boolean(activeBatchId),
      activeBatchId
    }
  }
})
