export default defineEventHandler((event) => {
    const path = event.path

    // Define protected paths
    const isProtectedPath = path.startsWith('/api/products') ||
        path.startsWith('/api/batches') ||
        path.startsWith('/api/settings') ||
        path.startsWith('/api/testimonials') ||
        path.startsWith('/api/orders/export') ||
        path.startsWith('/api/orders/clear-completed') ||
        (path.startsWith('/api/orders') && event.method !== 'POST')

    // Publicly allowed GET paths
    const isPublicGet = (path === '/api/products' ||
        path === '/api/batches' ||
        path === '/api/testimonials' ||
        path === '/api/settings/order-status' ||
        path.startsWith('/api/site-')) && event.method === 'GET'

    const isMutation = ['POST', 'PUT', 'DELETE'].includes(event.method)
    const isPublicMutation = path === '/api/orders' && event.method === 'POST'

    if (isProtectedPath && !isPublicGet && !isPublicMutation) {
        const session = getCookie(event, 'admin_session')
        if (session !== 'authenticated') {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized: Admin session required'
            })
        }
    }
})
