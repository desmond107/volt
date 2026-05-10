import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Routes that do NOT require authentication
const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/verify-email",
  "/api/webhooks/moralis",
  "/flowchart",
  "/",
]);

function getSecret() {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(raw);
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Static assets and Next.js internals
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Only enforce on /api/* and /dashboard/* routes
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("volt_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
