"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { Field } from "@/components/field"
import { ApiBugBanner } from "@/components/api-bug-banner"
import { PageHeader } from "@/components/page-header"
import { SearchForm } from "@/components/search-form"
import { api, unwrap, type Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { fmtMoney, fmtNumber } from "@/lib/format"
import { enc } from "@/lib/url"

const L = labelsOf("ItemListDto")

type Row = Schemas["ItemListDto"]
type Filters = { SearchText: string; Itno: string; Itname: string; Itnoudf: string; Kino: string; Fano: string }
const EMPTY: Filters = { SearchText: "", Itno: "", Itname: "", Itnoudf: "", Kino: "", Fano: "" }

function clean<T extends Record<string, string>>(f: T): Partial<T> {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim())) as Partial<T>
}

function hasFilter(f: Filters) {
  return Object.values(f).some((v) => v.trim())
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "itno", header: L("itno") },
  { accessorKey: "itname", header: L("itname"), cell: ({ getValue }) => <span className="block max-w-72 truncate">{getValue<string>()}</span> },
  { accessorKey: "itnoudf", header: L("itnoudf") },
  { accessorKey: "kino", header: L("kino") },
  { accessorKey: "itunit", header: L("itunit") },
  { accessorKey: "itstockqty", header: L("itstockqty"), meta: { align: "right" }, cell: ({ getValue }) => fmtNumber(getValue()) },
  { accessorKey: "itsafeqty", header: L("itsafeqty"), meta: { align: "right" }, cell: ({ getValue }) => fmtNumber(getValue()) },
  { accessorKey: "itprice", header: L("itprice"), meta: { align: "right" }, cell: ({ getValue }) => fmtMoney(getValue()) },
  { accessorKey: "faname1", header: L("faname1") },
]

function ItemSearch({ onSearch, onReset }: { onSearch: (f: Filters) => void; onReset: () => void }) {
  const [draft, setDraft] = useState<Filters>(EMPTY)
  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  return (
    <SearchForm
      onSubmit={() => {
        if (!hasFilter(draft)) return
        onSearch(draft)
      }}
      onReset={() => {
        setDraft(EMPTY)
        onReset()
      }}
    >
      <Field label="關鍵字">
        <Input value={draft.SearchText} onChange={set("SearchText")} placeholder="編號、品名…" />
      </Field>
      <Field label="產品編號">
        <Input value={draft.Itno} onChange={set("Itno")} />
      </Field>
      <Field label="品名規格">
        <Input value={draft.Itname} onChange={set("Itname")} />
      </Field>
      <Field label="自訂編號">
        <Input value={draft.Itnoudf} onChange={set("Itnoudf")} />
      </Field>
      <Field label="產品類別">
        <Input value={draft.Kino} onChange={set("Kino")} />
      </Field>
      <Field label="供應商編號">
        <Input value={draft.Fano} onChange={set("Fano")} />
      </Field>
    </SearchForm>
  )
}

export default function ItemsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters | null>(null)
  const ready = !!filters && hasFilter(filters)

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["item", "list", filters],
    queryFn: () => unwrap(api.GET("/v1/Item", { params: { query: clean(filters!) } })),
    enabled: ready,
  })

  return (
    <>
      <PageHeader title="產品" description="請至少填一個條件再查，空白查詢後端會出錯。" />
      <ApiBugBanner id="Item" title="不帶條件去查，系統會炸掉">
        產品列表若完全不帶條件，後端會回錯誤（500）。文件也沒寫「一定要有條件」。所以這裡強制要先填再查。
      </ApiBugBanner>
      <ItemSearch onSearch={setFilters} onReset={() => setFilters(null)} />
      <DataTable
        columns={columns}
        data={data}
        isLoading={ready && (isLoading || isFetching)}
        error={error instanceof Error ? error : null}
        emptyText={ready ? "沒有資料" : "請先輸入條件並查詢"}
        onRowClick={(r) => router.push(`/items/${enc(r.itno)}`)}
      />
    </>
  )
}
