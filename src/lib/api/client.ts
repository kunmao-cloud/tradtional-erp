import createClient from "openapi-fetch"
import type { components, paths } from "./schema"

export type Schemas = components["schemas"]

export const api = createClient<paths>({ baseUrl: "/api/proxy" })

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type ApiEnvelope<T> = { success?: boolean; message?: string | null; data?: T | null }

type FetchResult<T> = {
  data?: ApiEnvelope<T>
  error?: unknown
  response: Response
}

/** 後端有時把錯誤 JSON 字串包在 message 裡，例如 {"code":"E_001","message":"…","data":"…"}。 */
function unwrapNestedMessage(msg: string): string {
  if (!msg.startsWith("{")) return msg
  try {
    const inner = JSON.parse(msg) as { message?: string; data?: unknown }
    return [inner.message, typeof inner.data === "string" ? inner.data : ""].filter(Boolean).join("：") || msg
  } catch {
    return msg
  }
}

export function extractMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return typeof body === "string" && body ? body : fallback
  const b = body as Record<string, unknown>
  if (typeof b.message === "string" && b.message) return unwrapNestedMessage(b.message)
  if (b.errors && typeof b.errors === "object") {
    const msgs = Object.values(b.errors as Record<string, unknown>).flat().filter(Boolean)
    if (msgs.length) return msgs.join("；")
  }
  if (typeof b.title === "string" && b.title) return b.title
  return fallback
}

export function redirectToLogin() {
  if (typeof window === "undefined") return
  const next = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?next=${next}`
}

/** 解開 ApiResponse 外殼；success=false 或 HTTP 錯誤時丟出 ApiError。 */
export async function unwrap<T>(promise: Promise<FetchResult<T>>): Promise<T> {
  const { data, error, response } = await promise
  if (response.status === 401) {
    redirectToLogin()
    throw new ApiError("登入已逾時，請重新登入", 401)
  }
  if (!response.ok) {
    throw new ApiError(extractMessage(error ?? data, `伺服器錯誤（${response.status}）`), response.status)
  }
  if (!data || data.success === false) {
    throw new ApiError(extractMessage(data, "操作失敗"), response.status)
  }
  return data.data as T
}

/** 給回傳 ApiResponse（data 型別未定義）的寫入 API 使用，回傳整個外殼以便顯示 message。 */
export async function unwrapResult<T = unknown>(promise: Promise<FetchResult<T>>) {
  const { data, error, response } = await promise
  if (response.status === 401) {
    redirectToLogin()
    throw new ApiError("登入已逾時，請重新登入", 401)
  }
  if (!response.ok || !data || data.success === false) {
    throw new ApiError(extractMessage(error ?? data, `操作失敗（${response.status}）`), response.status)
  }
  return { message: data.message ?? "", data: data.data as T }
}
