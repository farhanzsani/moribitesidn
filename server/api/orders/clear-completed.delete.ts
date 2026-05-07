import { query } from '../../utils/db'

export default defineEventHandler(async () => {
  const result = await query(`
    DELETE FROM pesanan
    WHERE status IN ('Selesai', 'Dibatalkan')
  `)

  return { ok: true, deleted: result.rowCount || 0 }
})
