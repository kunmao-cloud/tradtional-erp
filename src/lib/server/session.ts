import "server-only"
import { cookies } from "next/headers"

export const API_BASE = (
  process.env.ERP_API_BASE || "https://jsappv2-api-154189537428.asia-east1.run.app"
).replace(/\/+$/, "")

export const TOKEN_COOKIE = "erp_token"
export const USER_COOKIE = "erp_user"

export type SessionUser = {
  employeid: string
  employename: string
  companyaccount: string
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  if (!store.get(TOKEN_COOKIE)?.value) return null
  const raw = store.get(USER_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}
