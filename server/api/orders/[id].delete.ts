import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  await query('DELETE FROM pesanan WHERE id = $1', [id])
  return { ok: true }
})
