import { NextResponse, type NextRequest } from "next/server"
import { API_BASE, TOKEN_COOKIE } from "@/lib/server/session"

type Ctx = { params: Promise<{ path: string[] }> }

async function forward(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params
  const target = `${API_BASE}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`

  const headers = new Headers({ Accept: req.headers.get("accept") || "application/json" })
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)
  const token = req.cookies.get(TOKEN_COOKIE)?.value
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const hasBody = !["GET", "HEAD"].includes(req.method)
  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ success: false, message: "無法連線到 API 伺服器" }, { status: 502 })
  }

  const resHeaders = new Headers()
  for (const h of ["content-type", "content-disposition"]) {
    const v = upstream.headers.get(h)
    if (v) resHeaders.set(h, v)
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders })
}

export const GET = forward
export const POST = forward
export const PUT = forward
export const PATCH = forward
export const DELETE = forward
