"use client"

import { useMemo } from "react"
import { notFound, useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DetailGrid } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { labelsOf } from "@/lib/api-label"
import { SwaggerLabelView } from "@/components/swagger-label"
import { fmtMoney, fmtNumber } from "@/lib/format"
import { safeDecode } from "@/lib/url"
import { getDocConfig, type DocConfig, type DocDetailLine } from "@/features/docs/config"
import { rateToPercent } from "@/features/docs/calc"
import { DocLinesView } from "@/features/docs/doc-lines-view"
import { PrintDialog } from "@/features/docs/print-dialog"
import { fmtDate } from "@/lib/date"

export default function DocDetailPage() {
  const { kind, docno } = useParams<{ kind: string; docno: string }>()
  const cfg = getDocConfig(kind)
  if (!cfg) notFound()
  return <DocDetailView cfg={cfg} docno={safeDecode(docno)} />
}

function DocDetailView({ cfg, docno }: { cfg: DocConfig; docno: string }) {
  const L = useMemo(() => labelsOf(cfg.labelSchemas.header), [cfg.labelSchemas.header])
  const { data: d, isLoading } = useQuery({
    queryKey: ["doc", cfg.kind, "detail", docno],
    queryFn: () => cfg.get(docno),
  })
  const partyLabel = cfg.party === "customer" ? "客戶" : "廠商"
  const lines = (d?.[cfg.detailsKey] as DocDetailLine[] | undefined) ?? []

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {cfg.title} {docno}
            {d?.fooverflag != null && d.fooverflag !== false && (
              <Badge variant="secondary">
                <SwaggerLabelView>{L("fooverflag")}</SwaggerLabelView>={String(d.fooverflag)}
              </Badge>
            )}
          </span>
        }
        backHref={`/docs/${cfg.kind}`}
        actions={<PrintDialog source={cfg.reportSource} docno={docno} cuno={d?.cfno} title={cfg.title} disabled={!d} />}
      />
      {isLoading || !d ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-4">
          <Card>
            <CardContent>
              <DetailGrid
                columns={4}
                items={[
                  { label: L("docno"), value: d.docno },
                  { label: L("docdate"), value: fmtDate(d.docdate) },
                  { label: partyLabel, value: [d.cfno, d.cfname1].filter(Boolean).join(" ") },
                  { label: L("cfper1"), value: d.cfper1 },
                  { label: L("cftel1"), value: d.cftel1 },
                  { label: L("emno"), value: d.emno },
                  { label: L("emname"), value: d.emname },
                  ...(cfg.warehouse
                    ? [
                        { label: L("stno"), value: d.stno },
                        { label: L("stname"), value: d.stname },
                      ]
                    : []),
                  { label: L("x3no"), value: d.x3no },
                  { label: L("rate"), value: d.rate != null ? `${fmtNumber(rateToPercent(d.rate))}%` : "" },
                  ...(d.ischeck != null ? [{ label: L("ischeck"), value: d.ischeck }] : []),
                  ...(d.qupayment ? [{ label: L("qupayment"), value: d.qupayment }] : []),
                  ...(d.fqpayment ? [{ label: L("fqpayment"), value: d.fqpayment }] : []),
                  { label: L("docmemo"), value: d.docmemo, span: 3 },
                  { label: L("docmemo1"), value: <span className="whitespace-pre-wrap">{d.docmemo1}</span>, span: 3 },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">明細（{lines.length} 筆）</CardTitle>
            </CardHeader>
            <CardContent>
              <DocLinesView
                lines={lines}
                bomsKey={cfg.bomsKey}
                labelSchema={cfg.labelSchemas.line}
                extraColumns={cfg.extraDetailColumns}
              />
              <div className="mt-4 ml-auto grid w-full max-w-xs gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <SwaggerLabelView>{L("taxmny")}</SwaggerLabelView>
                  </span>
                  <span className="tabular-nums">{fmtMoney(d.taxmny)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <SwaggerLabelView>{L("tax")}</SwaggerLabelView>
                  </span>
                  <span className="tabular-nums">{fmtMoney(d.tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-base font-semibold">
                  <span>
                    <SwaggerLabelView>{L("totmny")}</SwaggerLabelView>
                  </span>
                  <span className="tabular-nums">{fmtMoney(d.totmny)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
