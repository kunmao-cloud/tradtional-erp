import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { SwaggerLabelView } from "@/components/swagger-label"
import { plainLabel } from "@/lib/api-label"

export function Field({
  label,
  htmlFor,
  required,
  error,
  className,
  children,
}: {
  label: React.ReactNode
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        <SwaggerLabelView>{label}</SwaggerLabelView>
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** 唯讀欄位清單，用於明細頁。 */
export function DetailGrid({
  items,
  columns = 3,
}: {
  items: { label: React.ReactNode; value: React.ReactNode; span?: number }[]
  columns?: 2 | 3 | 4
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-4",
      )}
    >
      {items.map((it, i) => (
        <div
          key={typeof it.label === "string" ? plainLabel(it.label) : i}
          className={cn("min-w-0", it.span === 2 && "sm:col-span-2", it.span === 3 && "sm:col-span-2 lg:col-span-3")}
        >
          <dt className="text-xs text-muted-foreground">
            <SwaggerLabelView>{it.label}</SwaggerLabelView>
          </dt>
          <dd className="break-words text-sm">{it.value === "" || it.value == null ? "—" : it.value}</dd>
        </div>
      ))}
    </dl>
  )
}
