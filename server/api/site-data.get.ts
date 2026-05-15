import { mapBatch, mapProduct, query } from '../utils/db'

export default defineEventHandler(async () => {
  const [productResult, batchResult, settingResult] = await Promise.all([
    query(`
      SELECT id, nama_produk, kategori, deskripsi, harga, image_url, badge, is_active
      FROM produk
      ORDER BY id ASC
    `),
    query(`
      SELECT id, nama_batch, catatan, status, created_at
      FROM po_batches
      ORDER BY id DESC
    `),
    query(`
      SELECT key, value
      FROM app_settings
      WHERE key IN ('order_open', 'active_batch_id')
    `)
  ])

  const settings = Object.fromEntries(settingResult.rows.map((row) => [row.key, row.value]))
  const openBatch = batchResult.rows.find((batch) => batch.status === 'Open')
  const openBatchId = openBatch?.id ? String(openBatch.id) : ''
  const activeBatchId = settings.active_batch_id ? String(settings.active_batch_id) : openBatchId

  return {
    products: productResult.rows.map(mapProduct),
    batches: batchResult.rows.map(mapBatch),
    settings: {
      orderOpen: settings.order_open !== false && Boolean(activeBatchId),
      activeBatchId
    }
  }
})
