import { TriangleAlertIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** 標註已複核的 API／Swagger 行為問題（非欄位 description 缺漏）。 */
export function ApiBugBanner({
  id,
  title,
  children,
  className,
}: {
  /** 對應 docs/swagger-observations.md 編號，如 B4 */
  id?: string
  title: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100",
        className,
      )}
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
      <div className="min-w-0 grid gap-0.5">
        <div className="font-medium">
          {id && <span className="mr-1.5 font-mono text-xs text-amber-800/80 dark:text-amber-200/80">{id}</span>}
          {title}
        </div>
        {children && <div className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">{children}</div>}
      </div>
    </div>
  )
}
