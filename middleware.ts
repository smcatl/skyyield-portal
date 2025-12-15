import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/blog(.*)',
  '/store',
  '/investment',
  '/work-with-us',
  '/about',
  '/contact',
  '/api/blog/articles',
  '/api/products(.*)',
  '/api/checkout(.*)',
  '/api/webhook(.*)',
  '/api/crypto-prices(.*)',
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/blog(.*)',
  '/store',
  '/investment',
  '/work-with-us',
  '/about',
  '/contact',
  '/api/blog/articles',
  '/api/products(.*)',
  '/api/checkout(.*)',
  '/api/webhook(.*)',
  '/api/webhooks(.*)',        // <-- ADD THIS for DocuSeal webhooks
  '/api/crypto-prices(.*)',
  '/api/pipeline/docuseal(.*)', // <-- ADD THIS for DocuSeal API
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}