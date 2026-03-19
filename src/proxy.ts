import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;
  
  const session = await auth();
  if (!session.userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
