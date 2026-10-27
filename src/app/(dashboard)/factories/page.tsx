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
import { enc } from "@/lib/url"
import { usePermissions } from "@/hooks/use-permissions"
import { FACTORY_PERMISSION } from "@/features/factories/fields"

const L = labelsOf("FactListDto")

type Row = Schemas["FactListDto"]
type Filters = { SearchText: string; Fano: string; Faname1: string; Fatel1: string; Faper1: string }
const EMPTY: Filters = { SearchText: "", Fano: "", Faname1: "", Fatel1: "", Faper1: "" }

function clean<T extends Record<string, string>>(f: T): Partial<T> {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim())) as Partial<T>
}

function FactorySearch({ onSearch, onReset }: { onSearch: (f: Filters) => void; onReset: () => void }) {
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
      <Field label="廠商編號">
        <Input value={draft.Fano} onChange={set("Fano")} />
      </Field>
      <Field label="廠商簡稱">
        <Input value={draft.Faname1} onChange={set("Faname1")} />
      </Field>
      <Field label="電話">
        <Input value={draft.Fatel1} onChange={set("Fatel1")} />
      </Field>
      <Field label="聯絡人">
        <Input value={draft.Faper1} onChange={set("Faper1")} />
      </Field>
    </SearchForm>
  )
}

export default function FactoriesPage() {
  const router = useRouter()
  const { can } = usePermissions()
  const canModify = can(FACTORY_PERMISSION, "modify")
  const [filters, setFilters] = useState<Filters>(EMPTY)

  const { data, isLoading, error } = useQuery({
    queryKey: ["fact", "list", filters],
    queryFn: () => unwrap(api.GET("/v1/Fact", { params: { query: clean(filters) } })),
  })

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: "fano", header: L("fano") },
      { accessorKey: "faname1", header: L("faname1") },
      { accessorKey: "faper", header: L("faper") },
      { accessorKey: "faper1", header: L("faper1") },
      { accessorKey: "fatel1", header: L("fatel1") },
      { accessorKey: "faatel1", header: L("faatel1") },
      { accessorKey: "fauno", header: L("fauno") },
      {
        accessorKey: "faaddr1",
        header: L("faaddr1"),
        cell: ({ getValue }) => <span className="block max-w-64 truncate">{getValue<string>()}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          canModify ? (
            <Button variant="ghost" size="icon-sm" asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/factories/${enc(row.original.fano)}/edit`} title="編輯">
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
        title="廠商"
        description="廠商基本資料維護"
        actions={
          can(FACTORY_PERMISSION, "append") && (
            <Button asChild>
              <Link href="/factories/new">
                <PlusIcon />
                新增廠商
              </Link>
            </Button>
          )
        }
      />
      <FactorySearch onSearch={setFilters} onReset={() => setFilters(EMPTY)} />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        error={error instanceof Error ? error : null}
        onRowClick={(r) => router.push(`/factories/${enc(r.fano)}`)}
      />
    </>
  )
}
