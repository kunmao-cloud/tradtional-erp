import { round, toNumber } from "@/lib/format"

/**
 * x3no 可選值。Swagger 只寫「稅別編號」，未定義各代碼中文名稱／算法；
 * UI 只顯示原始數字。計算邏輯見 docs/swagger-observations.md（x3no=1 verified；其餘 guess）。
 */
export const TAX_TYPES = [1, 2, 3, 4] as const

/**
 * 明細 kitax：swagger 只寫「應稅/免稅」，未列 enum。
 * 實測 `"2"` 不計入營業稅（verified）；UI 不翻譯名稱。
 */
export const KITAX_EXEMPT = "2"

export type CalcLine = { qty?: number | string; price?: number | string; prs?: number | string; kitax?: string | null }

export function effectivePrs(prs: unknown): number {
  const n = toNumber(prs, 1)
  return n > 0 ? n : 1
}

/** API 的 rate 是小數（0.05 = 5%），畫面上以百分比輸入。 */
export const rateToPercent = (rate: number | null | undefined) => round((rate ?? 0) * 100, 4)
export const percentToRate = (pct: number) => round(pct / 100, 6)

const isTaxable = (l: CalcLine, x3no: number) => (x3no === 1 || x3no === 2) && l.kitax !== KITAX_EXEMPT

/**
 * 依稅別計算單行稅前單價與稅前金額。
 * x3no=1（verified）：單價即稅前價。
 * x3no=2（guess 內含）：應計稅品項稅前價 = 單價 / (1 + 稅率)。
 * 其餘／kitax=KITAX_EXEMPT：不計稅。
 */
export function calcLine(line: CalcLine, x3no: number, rate: number) {
  const qty = toNumber(line.qty)
  const price = toNumber(line.price)
  const prs = effectivePrs(line.prs)
  const inclusive = x3no === 2 && isTaxable(line, x3no)
  const taxprice = inclusive ? round(price / (1 + rate), 4) : price
  return { taxprice, mny: round(qty * taxprice * prs, 2), gross: round(qty * price * prs, 2) }
}

/** rate 為小數（0.05）。 */
export function calcTotals(lines: CalcLine[], x3no: number, rate: number) {
  const computed = lines.map((l) => calcLine(l, x3no, rate))
  if (x3no === 2) {
    const totmny = round(computed.reduce((s, l) => s + l.gross, 0), 0)
    const taxableGross = computed.reduce((s, l, i) => s + (isTaxable(lines[i], x3no) ? l.gross : 0), 0)
    const tax = round(taxableGross - taxableGross / (1 + rate), 0)
    return { lines: computed, taxmny: totmny - tax, tax, totmny }
  }
  const taxmny = round(computed.reduce((s, l) => s + l.mny, 0), 2)
  const taxableMny = computed.reduce((s, l, i) => s + (isTaxable(lines[i], x3no) ? l.mny : 0), 0)
  const tax = round(taxableMny * rate, 0)
  return { lines: computed, taxmny, tax, totmny: round(taxmny + tax, 2) }
}
