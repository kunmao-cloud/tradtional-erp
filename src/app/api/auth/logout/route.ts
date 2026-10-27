import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { API_BASE, TOKEN_COOKIE, USER_COOKIE } from "@/lib/server/session"

export async function POST() {
  const store = await cookies()
  const token = store.get(TOKEN_COOKIE)?.value
  if (token) {
    await fetch(`${API_BASE}/v1/Login/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined)
  }
  const res = NextResponse.json({ success: true })
  res.cookies.delete(TOKEN_COOKIE)
  res.cookies.delete(USER_COOKIE)
  return res
}
