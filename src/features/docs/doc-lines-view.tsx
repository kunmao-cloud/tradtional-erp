"use client"

import { Fragment, useMemo, useState } from "react"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { labelsOf } from "@/lib/api-label"
import { SwaggerLabelView } from "@/components/swagger-label"
import { fmtMoney, fmtNumber } from "@/lib/format"
import type { DocBom, DocDetailLine, ExtraColumn } from "./config"

export function DocLinesView({
  lines,
  bomsKey,
  labelSchema,
  extraColumns = [],
  showPrice = true,
}: {
  lines: DocDetailLine[]
  bomsKey: string
  /** 明細列 OpenAPI schema，如 SaleDetailDto */
  labelSchema: string
  extraColumns?: ExtraColumn[]
  showPrice?: boolean
}) {
  const L = useMemo(() => labelsOf(labelSchema), [labelSchema])
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const colCount = 6 + (showPrice ? 4 : 0) + extraColumns.length

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8" />
            <TableHead>#</TableHead>
            <TableHead>
              <SwaggerLabelView>{L("itno")}</SwaggerLabelView>
            </TableHead>
            <TableHead>
              <SwaggerLabelView>{L("itname")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="text-right">
              <SwaggerLabelView>{L("qty")}</SwaggerLabelView>
            </TableHead>
            <TableHead>
              <SwaggerLabelView>{L("itunit")}</SwaggerLabelView>
            </TableHead>
            {showPrice && (
              <>
                <TableHead className="text-right">
                  <SwaggerLabelView>{L("price")}</SwaggerLabelView>
                </TableHead>
                <TableHead className="text-right">
                  <SwaggerLabelView>{L("taxprice")}</SwaggerLabelView>
                </TableHead>
                <TableHead className="text-right">
                  <SwaggerLabelView>{L("prs")}</SwaggerLabelView>
                </TableHead>
                <TableHead className="text-right">
                  <SwaggerLabelView>{L("mny")}</SwaggerLabelView>
                </TableHead>
              </>
            )}
            {extraColumns.map((c) => (
              <TableHead key={c.key} className={c.type === "number" ? "text-right" : undefined}>
                <SwaggerLabelView>{c.label}</SwaggerLabelView>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.length === 0 && (
            <TableRow>
              <TableCell colSpan={colCount} className="h-16 text-center text-muted-foreground">
                沒有明細
              </TableCell>
            </TableRow>
          )}
          {lines.map((l, i) => {
            const boms = (l[bomsKey] as DocBom[] | undefined) ?? []
            const desps = Array.from({ length: 10 }, (_, k) => l[`itdesp${k + 1}` as keyof DocDetailLine])
              .filter(Boolean)
              .join("、")
            return (
              <Fragment key={i}>
                <TableRow>
                  <TableCell>
                    {boms.length > 0 && (
                      <Button variant="ghost" size="icon-xs" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                        {open[i] ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{l.itno}</TableCell>
                  <TableCell className="max-w-80">
                    <div className="truncate">{l.itname}</div>
                    {(desps || l.memo) && (
                      <div className="truncate text-xs text-muted-foreground">{[desps, l.memo].filter(Boolean).join("｜")}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmtNumber(l.qty)}</TableCell>
                  <TableCell>{l.itunit}</TableCell>
                  {showPrice && (
                    <>
                      <TableCell className="text-right tabular-nums">{fmtMoney(l.price)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMoney(l.taxprice)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(l.prs)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMoney(l.mny)}</TableCell>
                    </>
                  )}
                  {extraColumns.map((c) => (
                    <TableCell key={c.key} className={c.type === "number" ? "text-right tabular-nums" : undefined}>
                      {c.type === "number" ? fmtNumber(l[c.key]) : String(l[c.key] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
                {open[i] &&
                  boms.map((b, j) => (
                    <TableRow key={`${i}-${j}`} className="bg-muted/30 text-xs">
                      <TableCell />
                      <TableCell className="text-muted-foreground">└</TableCell>
                      <TableCell className="font-mono">{b.bomitno}</TableCell>
                      <TableCell>{b.bomitname}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtNumber(b.itqty)}</TableCell>
                      <TableCell>{b.bomitunit}</TableCell>
                      {showPrice && (
                        <>
                          <TableCell className="text-right tabular-nums">{fmtMoney(b.itprice)}</TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-right tabular-nums">{fmtMoney(b.itmny)}</TableCell>
                        </>
                      )}
                      {extraColumns.map((c) => (
                        <TableCell key={c.key} />
                      ))}
                    </TableRow>
                  ))}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
