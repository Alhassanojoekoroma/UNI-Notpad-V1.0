import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function extractSubdomain(hostname: string): string | null {
  // Strip port
  const host = hostname.split(":")[0];

  // Local dev: admin.localhost -> "admin"; bare localhost / 127.0.0.1 -> null
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    return sub || null;
  }

  // Production: admin.lunsl.org -> "admin"
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const rootParts = rootDomain.split(".").length;
  const hostParts = hostname.split(".");
  if (hostParts.length > rootParts) {
    return hostParts[0];
  }
  return null;
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();
  const subdomain = extractSubdomain(hostname);

  // Forward the original (pre-rewrite) pathname so server layouts can decide
  // whether to enforce auth (e.g. skip /login on subdomains).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  // No subdomain = root domain (public pages, student pages after login).
  // Block direct access to admin/lecturer paths so those areas are only
  // reachable via their subdomains.
  if (!subdomain) {
    if (
      url.pathname.startsWith("/admin") ||
      url.pathname.startsWith("/lecturer")
    ) {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Rewrite subdomain requests to internal route segments
  if (subdomain === "admin") {
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  if (subdomain === "lecturer") {
    url.pathname = `/lecturer${url.pathname}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // Unknown subdomain -> 404
  return NextResponse.rewrite(new URL("/not-found", request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).+)",
  ],
};
