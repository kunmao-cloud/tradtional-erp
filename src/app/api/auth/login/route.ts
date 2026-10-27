import { NextResponse } from "next/server"
import { API_BASE, TOKEN_COOKIE, USER_COOKIE, cookieOptions, type SessionUser } from "@/lib/server/session"

type LoginBody = {
  companyaccount?: string
  companypassword?: string
  webid?: string
  webpassword?: string
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LoginBody
  if (!body.companyaccount || !body.webid) {
    return NextResponse.json({ success: false, message: "請輸入公司帳號與登入帳號" }, { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${API_BASE}/v1/Login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ success: false, message: "無法連線到 API 伺服器" }, { status: 502 })
  }

  const json = await upstream.json().catch(() => null)
  const token: string | undefined = json?.data?.token
  if (!upstream.ok || !json?.success || !token) {
    return NextResponse.json(
      { success: false, message: json?.message || json?.title || `登入失敗（${upstream.status}）` },
      { status: upstream.status === 200 ? 401 : upstream.status },
    )
  }

  const user: SessionUser = {
    employeid: json.data.employeid ?? "",
    employename: json.data.employename ?? "",
    companyaccount: body.companyaccount,
  }
  const res = NextResponse.json({ success: true, message: json.message ?? "", data: user })
  res.cookies.set(TOKEN_COOKIE, token, cookieOptions)
  res.cookies.set(USER_COOKIE, JSON.stringify(user), cookieOptions)
  return res
}
