"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { DetailGrid } from "@/components/field"
import { SwaggerLabelView } from "@/components/swagger-label"
import { swaggerGapLabel } from "@/lib/api-label"
import { fmtNumber } from "@/lib/format"

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v)

function labelOf(key: string, labels: Record<string, string>, gapHint: string) {
  return labels[key] ?? swaggerGapLabel(key, gapHint)
}

function columnsFor(rows: Obj[], labels: Record<string, string>, gapHint: string): ColumnDef<Obj>[] {
  const keys = Array.from(new Set(rows.slice(0, 50).flatMap((r) => Object.keys(r)))).filter(
    (k) => !rows.some((r) => Array.isArray(r[k]) || isObj(r[k])),
  )
  return keys.map((k) => {
    const numeric = rows.every((r) => r[k] == null || typeof r[k] === "number")
    return {
      accessorKey: k,
      header: labelOf(k, labels, gapHint),
      meta: numeric ? { align: "right" } : undefined,
      cell: ({ getValue }) => (numeric ? fmtNumber(getValue()) : String(getValue() ?? "")),
    }
  })
}

/**
 * 回傳格式未在 swagger 定義的 API，依資料形狀自動呈現。
 * 未傳 labels 的 key 會標「缺」（露出 swagger 缺 schema／description）。
 */
export function AutoData({
  data,
  labels = {},
  gapHint = "API 文件沒寫這個回傳欄位的中文名",
}: {
  data: unknown
  labels?: Record<string, string>
  gapHint?: string
}) {
  if (data == null || data === "") return <p className="py-10 text-center text-sm text-muted-foreground">沒有資料</p>

  if (Array.isArray(data)) {
    if (data.every(isObj)) return <DataTable columns={columnsFor(data, labels, gapHint)} data={data} />
    return <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">{JSON.stringify(data, null, 2)}</pre>
  }

  if (isObj(data)) {
    const scalars = Object.entries(data).filter(([, v]) => !Array.isArray(v) && !isObj(v))
    const nested = Object.entries(data).filter(([, v]) => Array.isArray(v) || isObj(v))
    return (
      <div className="grid gap-4">
        {scalars.length > 0 && (
          <Card>
            <CardContent>
              <DetailGrid
                columns={4}
                items={scalars.map(([k, v]) => ({
                  label: labelOf(k, labels, gapHint),
                  value: typeof v === "number" ? fmtNumber(v) : String(v ?? ""),
                }))}
              />
            </CardContent>
          </Card>
        )}
        {nested.map(([k, v]) => (
          <Card key={k}>
            <CardHeader>
              <CardTitle className="text-base">
                <SwaggerLabelView>{labelOf(k, labels, gapHint)}</SwaggerLabelView>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AutoData data={v} labels={labels} gapHint={gapHint} />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 text-sm">{String(data)}</pre>
}
