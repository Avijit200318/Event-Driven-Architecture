import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
// here since we need full user info included meta data. we need to use clerkClient

const publicRoutes = [
  "/",
  "/api/webhooks/register",
  "/sign-up",
  "/sign-in"
];

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const currentUrl = new URL(req.url);
  const client = await clerkClient();

  // handle user who is access to protecting routes
  if (!userId && !publicRoutes.includes(currentUrl.pathname)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // if user is loggedin
  if (userId) {
    try {
      const user = await client.users.getUser(userId);
      const role = user.publicMetadata.role as string | undefined;
  
      // admin role redirection
      if (role === "admin" && currentUrl.pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
  
      // prevent non admin user form admin routes
      if (role !== "admin" && currentUrl.pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
  
      // redirect auth user who is trying to access the public routes
      if (userId && publicRoutes.includes(currentUrl.pathname)) {
        return NextResponse.redirect(
          new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", req.url)
        );
      }
    } catch (error) {
      console.error("Error fetching user data from Clerk:", error);
      return NextResponse.redirect(new URL("/error", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};