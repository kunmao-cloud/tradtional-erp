import { toast } from "sonner"
import { extractMessage, redirectToLogin } from "@/lib/api/client"

export type PrintOptions = { header: string; footer: string; bomprint: boolean }

const storageKey = (source: string) => `erp_print_${source}`

export function loadPrintOptions(source: string, defaultHeader: string): PrintOptions {
  // Footer 必填但 swagger 未給預設文案；留空由使用者填，勿自行編造頁尾。
  const fallback = { header: defaultHeader, footer: "", bomprint: false }
  if (typeof window === "undefined") return fallback
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(storageKey(source)) ?? "{}") }
  } catch {
    return fallback
  }
}

/**
 * 呼叫 /v1/Report 取得單據 PDF。後端要求 Header、Footer 必填且不可空白，Cuno 也需帶入。
 * 先開新視窗再載入內容，避免被瀏覽器的彈出視窗阻擋。
 */
export async function printDocument(
  params: { source: string; docno: string; cuno?: string | null },
  opts: PrintOptions,
) {
  localStorage.setItem(storageKey(params.source), JSON.stringify(opts))
  const win = window.open("", "_blank")
  const qs = new URLSearchParams({
    Source: params.source,
    Docno: params.docno,
    Cuno: params.cuno ?? "",
    Header: opts.header,
    Footer: opts.footer,
    Bomprint: String(opts.bomprint),
  })

  try {
    const res = await fetch(`/api/proxy/v1/Report?${qs}`)
    if (res.status === 401) {
      win?.close()
      return redirectToLogin()
    }
    const type = res.headers.get("content-type") ?? ""
    if (res.ok && (type.includes("pdf") || type.includes("octet-stream"))) {
      const url = URL.createObjectURL(new Blob([await res.arrayBuffer()], { type: "application/pdf" }))
      if (win) win.location.href = url
      else window.open(url, "_blank")
      return
    }
    const json = await res.json().catch(() => null)
    throw new Error(extractMessage(json, `報表產生失敗（${res.status}）`))
  } catch (e) {
    win?.close()
    toast.error(e instanceof Error ? e.message : "報表產生失敗")
  }
}
