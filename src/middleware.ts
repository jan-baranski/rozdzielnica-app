import { NextResponse, type NextRequest } from "next/server";

function getForwardedProto(request: NextRequest) {
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
}

function buildHttpsUrl(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  return url;
}

function isLocalRequest(request: NextRequest) {
  const rawHost = request.headers.get("host")?.toLowerCase() ?? "";
  const host = rawHost.startsWith("[::1]") ? "::1" : rawHost.split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function middleware(request: NextRequest) {
  if (getForwardedProto(request) === "http" && process.env.NODE_ENV !== "development" && !isLocalRequest(request)) {
    return NextResponse.redirect(buildHttpsUrl(request), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*"
};
