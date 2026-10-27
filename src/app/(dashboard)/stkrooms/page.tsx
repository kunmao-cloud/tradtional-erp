"use client"

import { DataTable, type ColumnDef } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { useStkrooms } from "@/components/pickers"
import type { Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"

const L = labelsOf("GetStkroomListDto")

const columns: ColumnDef<Schemas["GetStkroomListDto"]>[] = [
  { accessorKey: "stNo", header: L("stNo") },
  { accessorKey: "stName", header: L("stName") },
  { accessorKey: "sttrait", header: L("sttrait") },
]

export default function StkroomsPage() {
  const { data, isLoading, error } = useStkrooms()
  return (
    <>
      <PageHeader title="倉庫" description="倉庫清單（API 僅提供查詢）" />
      <DataTable columns={columns} data={data} isLoading={isLoading} error={error instanceof Error ? error : null} />
    </>
  )
}
