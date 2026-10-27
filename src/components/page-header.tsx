import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PageHeader({
  title,
  description,
  backHref,
  actions,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  backHref?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {backHref && (
          <Button variant="ghost" size="icon-sm" asChild className="mt-0.5">
            <Link href={backHref}>
              <ChevronLeftIcon />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
