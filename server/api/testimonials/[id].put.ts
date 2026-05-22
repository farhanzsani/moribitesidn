import { mapTestimonial, query } from '../../utils/db'
import { TestimonialSchema } from '../../utils/validation'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const resultValidation = TestimonialSchema.safeParse(body)

    if (!resultValidation.success) {
        throw createError({
            statusCode: 400,
            statusMessage: `Data tidak valid: ${resultValidation.error.issues.map(e => e.message).join(', ')}`
        })
    }

    const validated = resultValidation.data

    const result = await query(`
    UPDATE testimonials
    SET name = $1, text = $2, image_url = $3, is_active = $4
    WHERE id = $5
    RETURNING *
  `, [validated.name, validated.text, validated.image || '', validated.active !== false, id])

    if (result.rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Testimoni tidak ditemukan' })
    }

    return mapTestimonial(result.rows[0])
})
