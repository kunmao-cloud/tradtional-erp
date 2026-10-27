import schemaLabels from "./swagger-schema-labels.json"
import paramDescriptions from "./swagger-param-descriptions.json"

type SchemaMap = Record<string, Record<string, string>>
type ParamMap = Record<string, string[]>

const schemas = schemaLabels as SchemaMap
const params = paramDescriptions as ParamMap

/** 字串標籤缺漏標記（由 Field／表頭等解碼後顯示「缺」）。 */
const GAP_RE = /^@@gap:([^@]*)@@([\s\S]*)$/

function strip(s: string) {
  return s.replace(/。$/u, "").trim()
}

function markGap(text: string, hint: string): string {
  return `@@gap:${encodeURIComponent(hint)}@@${text}`
}

/** 文件沒寫中文名的欄位：畫面顯示 key +「缺」。 */
export function swaggerGapLabel(key: string, hint?: string): string {
  return markGap(key, hint || `API 文件沒寫「${key}」是什麼意思`)
}

export type SwaggerLabelParts = {
  text: string
  missing: boolean
  /** hover 說明缺漏原因 */
  hint?: string
}

/** 把 apiLabel／apiParamLabel 產出的字串解成可渲染狀態。 */
export function parseSwaggerLabel(label: string): SwaggerLabelParts {
  const m = GAP_RE.exec(label)
  if (!m) return { text: label, missing: false }
  const hint = decodeURIComponent(m[1] || "")
  return { text: m[2], missing: true, hint: hint || undefined }
}

/** 表單錯誤訊息等需要純文字時使用。 */
export function plainLabel(label: string): string {
  return parseSwaggerLabel(label).text
}

export function apiLabelInfo(schema: string, key: string): SwaggerLabelParts {
  const raw = schemas[schema]?.[key]
  if (!raw) {
    return {
      text: key,
      missing: true,
      hint: `「${schema}」這份文件裡，欄位「${key}」沒寫中文說明`,
    }
  }
  const text = strip(raw)
  if (!text) {
    return {
      text: key,
      missing: true,
      hint: `「${schema}」裡的「${key}」有欄位但中文說明是空白`,
    }
  }
  return { text, missing: false }
}

/**
 * 依「指定 OpenAPI schema」的 property description 當畫面標籤。
 *
 * - 該 schema 有 description → 用原文（去掉句尾「。」）
 * - 該 schema 沒寫 → 回傳帶缺漏標記的 API key（畫面顯示「缺」）
 *
 * 不跨 schema 合併同名欄位。
 */
export function apiLabel(schema: string, key: string): string {
  const info = apiLabelInfo(schema, key)
  return info.missing ? markGap(info.text, info.hint || "") : info.text
}

/** 綁定 schema 後的短寫：`const L = labelsOf("AddFactRequest"); L("fano")` */
export function labelsOf(schema: string) {
  return (key: string) => apiLabel(schema, key)
}

export function apiParamLabelInfo(name: string): SwaggerLabelParts {
  const list = [...new Set((params[name] ?? []).map(strip).filter(Boolean))]
  if (list.length === 1) return { text: list[0], missing: false }
  if (list.length === 0) {
    return {
      text: name,
      missing: true,
      hint: `查詢條件「${name}」在文件裡沒寫中文說明`,
    }
  }
  return {
    text: name,
    missing: true,
    hint: `查詢條件「${name}」在文件裡有好幾種說法（${list.join("／")}），不知道該用哪一個`,
  }
}

/**
 * 查詢參數標籤：取 openapi parameter description。
 * - 只有一種 → 用原文
 * - 沒寫或有多種說法 → 帶缺漏標記，畫面顯示「缺」
 */
export function apiParamLabel(name: string): string {
  const info = apiParamLabelInfo(name)
  return info.missing ? markGap(info.text, info.hint || "") : info.text
}
