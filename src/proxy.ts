import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk Middleware — 全局身份驗證保護
 *
 * 公開路由：首頁、登入、登出頁面
 * 其餘所有路由（包含 API）都需要登入
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)", // Clerk webhooks 不需要 JWT
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // 跳過 Next.js 內部路由和靜態資源
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // 永遠執行 API 和 tRPC 路由
    "/(api|trpc)(.*)",
  ],
};
