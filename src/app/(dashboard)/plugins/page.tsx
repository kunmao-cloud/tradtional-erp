"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { PageHeader } from "@/components/page-header"
import { api, unwrap, type Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"

const L = labelsOf("PluginDto")

const columns: ColumnDef<Schemas["PluginDto"]>[] = [{ accessorKey: "plname", header: L("plname") }]

export default function PluginsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["plugins"],
    queryFn: () => unwrap(api.GET("/v1/Plugin")),
  })
  return (
    <>
      <PageHeader title="外掛" description="目前公司啟用的外掛" />
      <div className="grid gap-4">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          error={error instanceof Error ? error : null}
          showFilter={false}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">毛利率外掛</CardTitle>
            <CardDescription>
              swagger 有 GrossProfit API；何時自動檢查未定義。前端暫以 plname 含「毛利」觸發（見 swagger-observations.md）。
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </>
  )
}
