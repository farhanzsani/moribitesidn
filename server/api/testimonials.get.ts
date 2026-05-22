import { mapTestimonial, query } from '../utils/db'

export default defineEventHandler(async (event) => {
    const adminOnly = getQuery(event).admin === 'true'

    let sql = 'SELECT * FROM testimonials'
    if (!adminOnly) {
        sql += ' WHERE is_active = TRUE'
    }
    sql += ' ORDER BY created_at DESC'

    const result = await query(sql)
    return result.rows.map(mapTestimonial)
})
