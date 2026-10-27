const numberFormatter = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 4 })
const moneyFormatter = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 })

export function fmtNumber(v: unknown): string {
  if (v === null || v === undefined || v === "") return ""
  const n = Number(v)
  return Number.isFinite(n) ? numberFormatter.format(n) : String(v)
}

export function fmtMoney(v: unknown): string {
  if (v === null || v === undefined || v === "") return ""
  const n = Number(v)
  return Number.isFinite(n) ? moneyFormatter.format(n) : String(v)
}

export function round(n: number, digits = 2): number {
  const f = 10 ** digits
  return Math.round((n + Number.EPSILON) * f) / f
}

export function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function isTruthyFlag(v: unknown): boolean {
  if (typeof v === "boolean") return v
  if (v === null || v === undefined) return false
  return ["y", "1", "true", "v", "t"].includes(String(v).trim().toLowerCase())
}
