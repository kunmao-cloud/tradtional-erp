"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { DetailGrid } from "@/components/field"
import { HistoryTable } from "@/components/history-table"
import { PageHeader } from "@/components/page-header"
import { api, unwrap, type Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { fmtMoney, fmtNumber } from "@/lib/format"
import { safeDecode } from "@/lib/url"

const L = labelsOf("ItemDetailDto")
const stockL = labelsOf("StockBean")

/** Item/Document source 無 swagger 中文說明；含 Cust 文件未列的 bshop／ford。 */
const SOURCES = ["sale", "quote", "order", "finish", "bshop", "ford"].map((value) => ({ value, label: value }))

const stockColumns: ColumnDef<Schemas["StockBean"]>[] = [
  { accessorKey: "stno", header: stockL("stno") },
  { accessorKey: "stname", header: stockL("stname") },
  { accessorKey: "itqytf", header: stockL("itqytf"), meta: { align: "right" }, cell: ({ getValue }) => fmtNumber(getValue()) },
  { accessorKey: "itqyt", header: stockL("itqyt"), meta: { align: "right" }, cell: ({ getValue }) => fmtNumber(getValue()) },
]

export default function ItemDetailPage() {
  const { itno: raw } = useParams<{ itno: string }>()
  const itno = safeDecode(raw)
  const { data: it, isLoading } = useQuery({
    queryKey: ["item", "detail", itno],
    queryFn: () => unwrap(api.GET("/v1/Item/{itno}", { params: { path: { itno } } })),
  })

  const desps = it
    ? (Array.from({ length: 10 }, (_, i) => {
        const key = `itdesp${i + 1}`
        return { label: L(key), value: it[key as keyof typeof it] as string | null | undefined }
      })).filter((d) => d.value)
    : []

  return (
    <>
      <PageHeader title={it ? `${it.itno} ${it.itname ?? ""}` : itno} backHref="/items" />
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">基本資料</TabsTrigger>
          <TabsTrigger value="stock">庫存</TabsTrigger>
          <TabsTrigger value="history">歷史交易</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="grid gap-4">
          {isLoading || !it ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <Card>
                <CardContent className="flex flex-col gap-6 md:flex-row">
                  {it.pic && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:image/*;base64,${it.pic}`}
                      alt={it.itname ?? ""}
                      className="size-40 shrink-0 rounded-md border object-contain"
                    />
                  )}
                  <div className="flex-1">
                    <DetailGrid
                      items={[
                        { label: L("itno"), value: it.itno },
                        { label: L("itnoudf"), value: it.itnoudf },
                        { label: L("itname"), value: it.itname },
                        { label: L("kino"), value: it.kino },
                        { label: L("kiname"), value: it.kiname },
                        { label: L("scno"), value: it.scno },
                        { label: L("scname"), value: it.scname },
                        { label: L("fano"), value: it.fano },
                        { label: L("faname"), value: it.faname },
                        { label: L("itunit"), value: it.itunit },
                        { label: L("itpkgqty"), value: fmtNumber(it.itpkgqty) },
                        { label: L("kitax"), value: it.kitax },
                        { label: L("itstockqty"), value: fmtNumber(it.itstockqty) },
                        { label: L("itsafeqty"), value: fmtNumber(it.itsafeqty) },
                        { label: L("itbuydate"), value: it.itbuydate },
                        { label: L("itsaldate"), value: it.itsaldate },
                        ...desps,
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">價格與成本</CardTitle>
                </CardHeader>
                <CardContent>
                  <DetailGrid
                    columns={4}
                    items={[
                      { label: L("itprice"), value: fmtMoney(it.itprice) },
                      { label: L("itprice1"), value: fmtMoney(it.itprice1) },
                      { label: L("itprice2"), value: fmtMoney(it.itprice2) },
                      { label: L("itprice3"), value: fmtMoney(it.itprice3) },
                      { label: L("itprice4"), value: fmtMoney(it.itprice4) },
                      { label: L("itprice5"), value: fmtMoney(it.itprice5) },
                      { label: L("itpricep"), value: fmtMoney(it.itpricep) },
                      { label: L("itbuypri"), value: fmtMoney(it.itbuypri) },
                      { label: L("itbuyprip"), value: fmtMoney(it.itbuyprip) },
                      { label: L("itcost"), value: fmtMoney(it.itcost) },
                      { label: L("itcostp"), value: fmtMoney(it.itcostp) },
                      { label: L("itfircost"), value: fmtMoney(it.itfircost) },
                    ]}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        <TabsContent value="stock">
          <DataTable columns={stockColumns} data={it?.stocks ?? undefined} isLoading={isLoading} showFilter={false} pageSize={0} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTable
            sources={SOURCES}
            labelSchema="ItemDocDto"
            queryKey={["item", itno]}
            showParty
            showItem={false}
            fetcher={(source) =>
              unwrap(api.GET("/v1/Item/Document/{itno}", { params: { path: { itno }, query: { source } } }))
            }
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
