import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function extractSubdomain(hostname: string): string | null {
  // Local dev: admin.localhost:3000 -> "admin"
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    const parts = hostname.split(".localhost")[0].split(".");
    if (
      parts.length > 0 &&
      parts[0] !== "localhost" &&
      parts[0] !== "127"
    ) {
      return parts[0];
    }
    return null;
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

  // No subdomain = root domain (public pages, student pages after login)
  if (!subdomain) {
    return NextResponse.next();
  }

  // Rewrite subdomain requests to internal route groups
  if (subdomain === "admin") {
    url.pathname = `/_admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (subdomain === "lecturer") {
    url.pathname = `/_lecturer${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Unknown subdomain -> 404
  return NextResponse.rewrite(new URL("/not-found", request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).+)",
  ],
};
