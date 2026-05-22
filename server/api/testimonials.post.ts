import { mapTestimonial, query } from '../utils/db'
import { TestimonialSchema } from '../utils/validation'

export default defineEventHandler(async (event) => {
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
    INSERT INTO testimonials (name, text, image_url, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [validated.name, validated.text, validated.image || '', validated.active !== false])

    return mapTestimonial(result.rows[0])
})
