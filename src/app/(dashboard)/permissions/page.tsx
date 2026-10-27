"use client"

import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import type { Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { isTruthyFlag } from "@/lib/format"
import { usePermissionList } from "@/hooks/use-permissions"

const L = labelsOf("PermissionDto")

const flag = (key: "search" | "append" | "modify"): ColumnDef<Schemas["PermissionDto"]> => ({
  accessorKey: key,
  header: L(key),
  cell: ({ getValue }) => {
    const v = getValue<string | null>()
    return (
      <Badge variant={isTruthyFlag(v) ? "default" : "outline"} title={`原始值：${v ?? ""}`}>
        {String(v ?? "")}
      </Badge>
    )
  },
})

const columns: ColumnDef<Schemas["PermissionDto"]>[] = [
  { accessorKey: "taname", header: L("taname") },
  flag("search"),
  flag("append"),
  flag("modify"),
]

export default function PermissionsPage() {
  const { data, isLoading, error } = usePermissionList()
  return (
    <>
      <PageHeader title="我的權限" description="由 /v1/User/GetPermissionList 取得；選單與按鈕依此顯示" />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        error={error instanceof Error ? error : null}
        pageSize={50}
      />
    </>
  )
}
