import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id

    const result = await query('DELETE FROM testimonials WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Testimoni tidak ditemukan' })
    }

    return { success: true, id }
})
