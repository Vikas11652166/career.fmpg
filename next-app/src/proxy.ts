import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/contract"];
const ADMIN_PREFIXES = ["/admin"];
const AUTH_ROUTES = ["/login", "/register", "/verify-email", "/forgot-password"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const tokenCookie = req.cookies.get("token")?.value;

  let user: { role?: string } | null = null;
  if (tokenCookie) {
    user = await verifyJWT(tokenCookie);
  }

  const isAuthenticated = !!user;

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (user) {
      const redirectUrl = user.role === "admin" || user.role === "super-admin" || user.role === "employee"
        ? new URL("/admin/dashboard", req.url)
        : new URL("/dashboard", req.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin = ["admin", "super-admin", "employee"].includes(user.role || "");
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|logo.png).*)",
  ],
};
