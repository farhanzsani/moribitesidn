import { mapBatch, query } from '../utils/db'

export default defineEventHandler(async () => {
  const result = await query(`
    SELECT id, nama_batch, catatan, status, created_at
    FROM po_batches
    ORDER BY id DESC
  `)

  return result.rows.map(mapBatch)
})
