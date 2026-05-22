export default defineEventHandler((event) => {
    const session = getCookie(event, 'admin_session')
    return { isAdmin: session === 'authenticated' }
})
