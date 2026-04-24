import { NextResponse, type NextRequest } from "next/server";

function getForwardedProto(request: NextRequest) {
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
}

function buildHttpsUrl(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  return url;
}

export function middleware(request: NextRequest) {
  if (getForwardedProto(request) === "http") {
    return NextResponse.redirect(buildHttpsUrl(request), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*"
};
