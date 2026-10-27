"use client"

import { useState } from "react"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell, TableFooter, TableRow } from "@/components/ui/table"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { Field } from "@/components/field"
import { ApiBugBanner } from "@/components/api-bug-banner"
import { PageHeader } from "@/components/page-header"
import { CustomerPicker, FactoryPicker } from "@/components/pickers"
import { SearchForm } from "@/components/search-form"
import type { Schemas } from "@/lib/api/client"
import { apiParamLabel, labelsOf } from "@/lib/api-label"
import { daysAgoIso, fmtDate, toApiDate, todayIso } from "@/lib/date"
import { fmtMoney } from "@/lib/format"
import { enc } from "@/lib/url"
import { usePermissions } from "@/hooks/use-permissions"
import { getDocConfig, type DocConfig } from "@/features/docs/config"

const L = labelsOf("DocListDto")

type Row = Schemas["DocListDto"]
type Filters = { start: string; end: string; cfno: string; cfname: string; emno: string }

export default function DocListPage() {
  const { kind } = useParams<{ kind: string }>()
  const cfg = getDocConfig(kind)
  if (!cfg) notFound()
  return <DocList key={cfg.kind} cfg={cfg} />
}

function DocList({ cfg }: { cfg: DocConfig }) {
  const router = useRouter()
  const { can } = usePermissions()
  // 預設近 90 天：測試資料多在上月，只查本月常會是空的。
  const initial: Filters = { start: daysAgoIso(90), end: todayIso(), cfno: "", cfname: "", emno: "" }
  const [draft, setDraft] = useState<Filters>(initial)
  const [filters, setFilters] = useState<Filters>(initial)

  const { data, isLoading, error } = useQuery({
    queryKey: ["doc", cfg.kind, "list", filters],
    queryFn: () =>
      cfg.list({
        StartDate: toApiDate(filters.start),
        EndDate: toApiDate(filters.end),
        Cfno: filters.cfno || undefined,
        Emno: filters.emno || undefined,
      }),
  })

  const partyLabel = cfg.party === "customer" ? "客戶" : "廠商"
  const columns: ColumnDef<Row>[] = [
    { accessorKey: "docno", header: L("docno") },
    { accessorKey: "docdate", header: L("docdate"), cell: ({ getValue }) => fmtDate(getValue<string>()) },
    { accessorKey: "cfno", header: L("cfno") },
    { accessorKey: "cfname1", header: L("cfname1") },
    { accessorKey: "totmny", header: L("totmny"), meta: { align: "right" }, cell: ({ getValue }) => fmtMoney(getValue()) },
  ]
  const total = (data ?? []).reduce((s, r) => s + (r.totmny ?? 0), 0)

  const Picker = cfg.party === "customer" ? CustomerPicker : FactoryPicker

  return (
    <>
      <PageHeader
        title={cfg.title}
        actions={
          can(cfg.permission, "append") && (
            <Button asChild>
              <Link href={`/docs/${cfg.kind}/new`}>
                <PlusIcon />
                新增{cfg.title}
              </Link>
            </Button>
          )
        }
      />
      {cfg.kind === "fquot" && (
        <ApiBugBanner id="B4" title="詢價單列表目前查不到（後端錯誤）">
          打詢價單列表 API 會直接失敗（500），連正常的錯誤訊息都沒有。這是後端問題，不是你條件填錯。
        </ApiBugBanner>
      )}
      <SearchForm onSubmit={() => setFilters(draft)} onReset={() => (setDraft(initial), setFilters(initial))}>
        <Field label="起始日期">
          <Input type="date" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} />
        </Field>
        <Field label="終止日期">
          <Input type="date" value={draft.end} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} />
        </Field>
        <Field label={partyLabel}>
          <Picker
            value={draft.cfno}
            displayText={draft.cfno ? `${draft.cfno} ${draft.cfname}` : undefined}
            placeholder={`全部${partyLabel}`}
            onSelect={(p) => {
              const item = p as { cuno?: string | null; cuname1?: string | null; fano?: string | null; faname1?: string | null } | null
              setDraft((d) => ({
                ...d,
                cfno: item?.cuno ?? item?.fano ?? "",
                cfname: item?.cuname1 ?? item?.faname1 ?? "",
              }))
            }}
          />
        </Field>
        <Field label={apiParamLabel("Emno")}>
          <Input value={draft.emno} onChange={(e) => setDraft((d) => ({ ...d, emno: e.target.value }))} />
        </Field>
      </SearchForm>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        error={error instanceof Error ? error : null}
        onRowClick={(r) => router.push(`/docs/${cfg.kind}/${enc(r.docno)}`)}
        footer={
          data?.length ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right">
                  合計
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtMoney(total)}</TableCell>
              </TableRow>
            </TableFooter>
          ) : null
        }
      />
    </>
  )
}
