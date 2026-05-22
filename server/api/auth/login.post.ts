export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { username, password } = body

    const adminPassword = process.env.ADMIN_PASSWORD || 'morichansukakelor'

    if (username === 'admin' && password === adminPassword) {
        // Set a session cookie
        setCookie(event, 'admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 1 day
        })

        return { success: true }
    }

    throw createError({
        statusCode: 401,
        statusMessage: 'Username atau password salah.'
    })
})
