import { cn } from "@/lib/utils"
import { parseSwaggerLabel } from "@/lib/api-label"

/** 將 apiLabel／apiParamLabel 字串解碼；缺漏時標「缺」並用 title 說明原因。 */
export function SwaggerLabelView({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  if (typeof children !== "string") return children
  const { text, missing, hint } = parseSwaggerLabel(children)
  if (!missing) return text
  return (
    <span
      className={cn("inline-flex max-w-full items-center gap-1 align-middle", className)}
      title={hint || "API 文件缺說明"}
    >
      <span className="truncate font-mono text-[0.95em] text-amber-800 dark:text-amber-200">{text}</span>
      <span className="shrink-0 rounded bg-amber-500/20 px-1 py-px text-[10px] font-semibold text-amber-800 dark:text-amber-200">
        缺
      </span>
    </span>
  )
}

/** 側欄／頁面用的簡短圖例。 */
export function SwaggerGapLegend({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] leading-snug text-muted-foreground", className)}>
      看到{" "}
      <span className="rounded bg-amber-500/20 px-1 py-px font-semibold text-amber-800 dark:text-amber-200">缺</span>{" "}
      ＝ API 文件沒寫清楚這個欄位的中文名
    </p>
  )
}
