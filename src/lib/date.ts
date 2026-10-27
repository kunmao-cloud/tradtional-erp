/**
 * API 日期格式，可用 NEXT_PUBLIC_API_DATE_FORMAT 設定：
 * - ymd：西元 YYYYMMDD（預設，NEW_JS_API 實際使用的格式）
 * - roc：民國 YYYMMDD
 * - roc-slash：民國 YYY/MM/DD
 * - iso：西元 YYYY-MM-DD
 */
export type ApiDateFormat = "ymd" | "roc" | "roc-slash" | "iso"

export const API_DATE_FORMAT: ApiDateFormat =
  (process.env.NEXT_PUBLIC_API_DATE_FORMAT as ApiDateFormat) || "ymd"

const pad = (n: number, len = 2) => String(n).padStart(len, "0")

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function firstDayOfMonthIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

/** 今天往前推 N 天的 YYYY-MM-DD（含今天）。 */
export function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 將 <input type="date"> 的 YYYY-MM-DD 轉成 API 需要的格式。 */
export function toApiDate(iso?: string | null): string | undefined {
  if (!iso) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const [, y, mo, d] = m
  const roc = pad(Number(y) - 1911, 3)
  switch (API_DATE_FORMAT) {
    case "roc":
      return `${roc}${mo}${d}`
    case "roc-slash":
      return `${roc}/${mo}/${d}`
    case "iso":
      return iso
    default:
      return `${y}${mo}${d}`
  }
}

/** 將 API 回傳的各種日期字串轉回 YYYY-MM-DD，無法辨識時回傳 undefined。 */
export function fromApiDate(value?: string | null): string | undefined {
  if (!value) return undefined
  const s = value.trim()
  let m = /^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/.exec(s)
  if (m && Number(m[1]) > 1911) return `${m[1]}-${m[2]}-${m[3]}`
  m = /^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/.exec(s)
  if (m) return `${Number(m[1]) + 1911}-${pad(Number(m[2]))}-${pad(Number(m[3]))}`
  m = /^(\d{3})(\d{2})(\d{2})$/.exec(s)
  if (m) return `${Number(m[1]) + 1911}-${m[2]}-${m[3]}`
  return undefined
}

/** 顯示用：西元 YYYYMMDD 或民國 YYYMMDD 轉成 YYYY/MM/DD，其他格式原樣回傳。 */
export function fmtDate(value?: string | null): string {
  if (!value) return ""
  const iso = fromApiDate(value)
  if (iso) {
    const [y, mo, d] = iso.split("-")
    return `${y}/${mo}/${d}`
  }
  return value
}
