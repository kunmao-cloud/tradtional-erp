import { NextResponse, type NextRequest } from "next/server"

export function proxy(req: NextRequest) {
  if (req.cookies.get("erp_token")?.value) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = "/login"
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
}
