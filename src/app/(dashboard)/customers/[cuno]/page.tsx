"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DetailGrid } from "@/components/field"
import { HistoryTable } from "@/components/history-table"
import { PageHeader } from "@/components/page-header"
import { safeDecode } from "@/lib/url"
import { api, unwrap } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { fmtMoney } from "@/lib/format"
import { usePermissions } from "@/hooks/use-permissions"
import { CUSTOMER_PERMISSION } from "@/features/customers/fields"

const L = labelsOf("CustDetailDto")

/** swagger：Cust/Document source 可使用 sale、quote、order、finish（無中文名）。 */
const SOURCES = ["sale", "quote", "order", "finish"].map((value) => ({ value, label: value }))

export default function CustomerDetailPage() {
  const { cuno: raw } = useParams<{ cuno: string }>()
  const cuno = safeDecode(raw)
  const { can } = usePermissions()
  const { data: c, isLoading } = useQuery({
    queryKey: ["cust", "detail", cuno],
    queryFn: () => unwrap(api.GET("/v1/Cust/{cuno}", { params: { path: { cuno } } })),
  })

  return (
    <>
      <PageHeader
        title={c ? `${c.cuno} ${c.cuname1 ?? ""}` : cuno}
        description={c?.cuname2 ?? undefined}
        backHref="/customers"
        actions={
          can(CUSTOMER_PERMISSION, "modify") && (
            <Button asChild variant="outline">
              <Link href={`/customers/${encodeURIComponent(cuno)}/edit`}>
                <PencilIcon />
                編輯
              </Link>
            </Button>
          )
        }
      />
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本資料</TabsTrigger>
          <TabsTrigger value="history">歷史交易</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardContent>
              {isLoading || !c ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <DetailGrid
                  items={[
                    { label: L("cuno"), value: c.cuno },
                    { label: L("cuname1"), value: c.cuname1 },
                    { label: L("cuname2"), value: c.cuname2 },
                    { label: L("cuuno"), value: c.cuuno },
                    { label: L("cuime"), value: c.cuime },
                    { label: L("cux1no"), value: c.cux1no },
                    { label: L("cuper"), value: c.cuper },
                    { label: L("cuper1"), value: c.cuper1 },
                    { label: L("cuper2"), value: c.cuper2 },
                    { label: L("cutel1"), value: c.cutel1 },
                    { label: L("cutel2"), value: c.cutel2 },
                    { label: L("cuatel1"), value: c.cuatel1 },
                    { label: L("cufax1"), value: c.cufax1 },
                    { label: L("cuemail"), value: c.cuemail },
                    { label: L("cuemno1"), value: c.cuemno1 },
                    { label: L("cuemname"), value: c.cuemname },
                    { label: L("cur1"), value: c.cur1 },
                    { label: L("cuaddr1"), value: c.cuaddr1, span: 2 },
                    { label: L("cur2"), value: c.cur2 },
                    { label: L("cuaddr2"), value: c.cuaddr2, span: 2 },
                    { label: L("cur3"), value: c.cur3 },
                    { label: L("cuaddr3"), value: c.cuaddr3, span: 2 },
                    { label: L("cuinvoname"), value: c.cuinvoname },
                    { label: L("cuinvuno"), value: c.cuinvuno },
                    { label: L("cuxa1no"), value: c.cuxa1no },
                    { label: L("cucredit"), value: fmtMoney(c.cucredit) },
                    { label: L("cureceiv"), value: fmtMoney(c.cureceiv) },
                    { label: L("cuadvamt"), value: fmtMoney(c.cuadvamt) },
                    { label: L("cumemo1"), value: c.cumemo1, span: 3 },
                    { label: L("detailmemo"), value: <span className="whitespace-pre-wrap">{c.detailmemo}</span>, span: 3 },
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <HistoryTable
            sources={SOURCES}
            labelSchema="CustDocDto"
            queryKey={["cust", cuno]}
            fetcher={(source) =>
              unwrap(api.GET("/v1/Cust/Document/{cuno}", { params: { path: { cuno }, query: { source } } }))
            }
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
