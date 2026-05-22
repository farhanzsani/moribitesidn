import { createClient } from '@supabase/supabase-js'

let supabase: any = null

export function useSupabase() {
    if (!supabase) {
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !key) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Supabase URL atau Service Role Key belum dikonfigurasi.'
            })
        }

        supabase = createClient(url, key)
    }
    return supabase
}

export async function uploadPaymentProof(base64Data: string, orderId: string) {
    const client = useSupabase()

    // Extract content and type
    const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches || matches.length < 3) throw new Error('Format Base64 tidak valid')

    const contentType = matches[1] as string
    const base64Content = matches[2] as string
    const buffer = Buffer.from(base64Content, 'base64')
    const extension = contentType.split('/')[1] || 'jpg'
    const filePath = `payment-proofs/${orderId}-${Date.now()}.${extension}`

    const { error } = await client.storage
        .from('moribites-assets')
        .upload(filePath, buffer, {
            contentType,
            upsert: true
        })

    if (error) throw error

    const { data: { publicUrl } } = client.storage
        .from('moribites-assets')
        .getPublicUrl(filePath)

    return publicUrl
}
