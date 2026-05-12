import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "dv_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "dhanveer-dev-secret-32chars-min!!"
);

const PUBLIC = ["/login", "/access-denied", "/api/auth/login", "/api/health", "/_next", "/favicon.ico"];

// Routes that require admin-level role
const ADMIN_ONLY_ROUTES = ["/admin/users", "/api/admin/users"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const { payload } = await jwtVerify(token, secret);
    const session = payload as { id: string; role: string; status: string };

    // Block suspended/pending users
    if (session.status === "SUSPENDED" || session.status === "PENDING") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Admin-only route guard
    if (ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
      if (!["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
        return NextResponse.redirect(new URL("/access-denied", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
