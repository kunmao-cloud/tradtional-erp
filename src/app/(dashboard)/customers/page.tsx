"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PencilIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { Field } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { SearchForm } from "@/components/search-form"
import { api, unwrap, type Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { usePermissions } from "@/hooks/use-permissions"
import { CUSTOMER_PERMISSION } from "@/features/customers/fields"

const L = labelsOf("CustListDto")

type Row = Schemas["CustListDto"]
type Filters = { SearchText: string; Cuno: string; Cuname1: string; Cutel1: string; Cuuno: string }
const EMPTY: Filters = { SearchText: "", Cuno: "", Cuname1: "", Cutel1: "", Cuuno: "" }

function clean<T extends Record<string, string>>(f: T): Partial<T> {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim())) as Partial<T>
}

/** 獨立元件：打字只重繪表單，不重繪下方表格。 */
function CustomerSearch({
  onSearch,
  onReset,
}: {
  onSearch: (f: Filters) => void
  onReset: () => void
}) {
  const [draft, setDraft] = useState<Filters>(EMPTY)
  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  return (
    <SearchForm
      onSubmit={() => onSearch(draft)}
      onReset={() => {
        setDraft(EMPTY)
        onReset()
      }}
    >
      <Field label="關鍵字">
        <Input value={draft.SearchText} onChange={set("SearchText")} placeholder="編號、名稱、電話…" />
      </Field>
      <Field label="客戶編號">
        <Input value={draft.Cuno} onChange={set("Cuno")} />
      </Field>
      <Field label="客戶簡稱">
        <Input value={draft.Cuname1} onChange={set("Cuname1")} />
      </Field>
      <Field label="電話">
        <Input value={draft.Cutel1} onChange={set("Cutel1")} />
      </Field>
      <Field label="統一編號">
        <Input value={draft.Cuuno} onChange={set("Cuuno")} />
      </Field>
    </SearchForm>
  )
}

export default function CustomersPage() {
  const router = useRouter()
  const { can } = usePermissions()
  const canModify = can(CUSTOMER_PERMISSION, "modify")
  const [filters, setFilters] = useState<Filters>(EMPTY)

  const { data, isLoading, error } = useQuery({
    queryKey: ["cust", "list", filters],
    queryFn: () => unwrap(api.GET("/v1/Cust", { params: { query: clean(filters) } })),
  })

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: "cuno", header: L("cuno") },
      { accessorKey: "cuname1", header: L("cuname1") },
      { accessorKey: "cuper1", header: L("cuper1") },
      { accessorKey: "cutel1", header: L("cutel1") },
      { accessorKey: "cuatel1", header: L("cuatel1") },
      { accessorKey: "cuuno", header: L("cuuno") },
      { accessorKey: "cuemname", header: L("cuemname") },
      {
        accessorKey: "cuaddr1",
        header: L("cuaddr1"),
        cell: ({ getValue }) => <span className="block max-w-64 truncate">{getValue<string>()}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          canModify ? (
            <Button variant="ghost" size="icon-sm" asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/customers/${encodeURIComponent(row.original.cuno ?? "")}/edit`} title="編輯">
                <PencilIcon />
              </Link>
            </Button>
          ) : null,
      },
    ],
    [canModify],
  )

  return (
    <>
      <PageHeader
        title="客戶"
        description="客戶基本資料維護"
        actions={
          can(CUSTOMER_PERMISSION, "append") && (
            <Button asChild>
              <Link href="/customers/new">
                <PlusIcon />
                新增客戶
              </Link>
            </Button>
          )
        }
      />
      <CustomerSearch onSearch={setFilters} onReset={() => setFilters(EMPTY)} />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        error={error instanceof Error ? error : null}
        onRowClick={(r) => router.push(`/customers/${encodeURIComponent(r.cuno ?? "")}`)}
      />
    </>
  )
}
