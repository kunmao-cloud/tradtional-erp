"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { Field } from "@/components/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiParamLabel, labelsOf } from "@/lib/api-label"
import { fmtMoney, fmtNumber } from "@/lib/format"

export type HistoryLabelSchema = "CustDocDto" | "ItemDocDto"

export type HistoryRow = {
  docdate?: string | null
  docno?: string | null
  cfno?: string | null
  cfname1?: string | null
  payerno?: string | null
  itno?: string | null
  itname?: string | null
  qty?: number
  itunit?: string | null
  price?: number
  prs?: number
  mny?: number
  memo?: string | null
}

/** 客戶或產品的歷史交易，依 source 切換；標籤用對應 Document schema。 */
export function HistoryTable({
  sources,
  queryKey,
  fetcher,
  showParty,
  showItem = true,
  labelSchema = "CustDocDto",
}: {
  sources: { value: string; label: string }[]
  queryKey: unknown[]
  fetcher: (source: string) => Promise<HistoryRow[]>
  showParty?: boolean
  showItem?: boolean
  labelSchema?: HistoryLabelSchema
}) {
  const L = useMemo(() => labelsOf(labelSchema), [labelSchema])
  const [source, setSource] = useState(sources[0].value)
  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, "history", source],
    queryFn: () => fetcher(source),
  })

  const num = (key: keyof HistoryRow, money = false): ColumnDef<HistoryRow> => ({
    accessorKey: key,
    header: L(key),
    meta: { align: "right" },
    cell: ({ getValue }) => (money ? fmtMoney(getValue()) : fmtNumber(getValue())),
  })

  const columns: ColumnDef<HistoryRow>[] = [
    { accessorKey: "docdate", header: L("docdate") },
    { accessorKey: "docno", header: L("docno") },
    ...(showParty
      ? ([
          { accessorKey: "cfno", header: L("cfno") },
          { accessorKey: "cfname1", header: L("cfname1") },
        ] as ColumnDef<HistoryRow>[])
      : []),
    ...(showItem
      ? ([
          { accessorKey: "itno", header: L("itno") },
          { accessorKey: "itname", header: L("itname") },
        ] as ColumnDef<HistoryRow>[])
      : []),
    num("qty"),
    { accessorKey: "itunit", header: L("itunit") },
    num("price", true),
    num("prs"),
    num("mny", true),
    { accessorKey: "memo", header: L("memo") },
  ]

  return (
    <div className="grid gap-3">
      <Field label={apiParamLabel("source")} className="max-w-48">
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sources.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <DataTable columns={columns} data={data} isLoading={isLoading} />
    </div>
  )
}
