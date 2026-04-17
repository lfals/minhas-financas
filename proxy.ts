import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/configuracoes(.*)",
  "/lancamentos(.*)",
  "/investimentos(.*)",
  "/api/accounts(.*)",
])

export default clerkMiddleware(
  async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect()
    }
  },
  { debug: process.env.NODE_ENV === "development" }
)

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
