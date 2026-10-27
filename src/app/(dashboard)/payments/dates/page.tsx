"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type ColumnDef } from "@/components/data-table"
import { DetailGrid, Field } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { SearchForm } from "@/components/search-form"
import { api, unwrap, type Schemas } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { firstDayOfMonthIso, toApiDate, todayIso } from "@/lib/date"
import { fmtMoney, fmtNumber } from "@/lib/format"

const rowL = labelsOf("CustReceive")
const sumL = labelsOf("GetDatePaymentDto")

type Row = Schemas["CustReceive"]
const money = (key: keyof Row): ColumnDef<Row> => ({
  accessorKey: key,
  header: rowL(String(key)),
  meta: { align: "right" },
  cell: ({ getValue }) => fmtMoney(getValue()),
})

const columns: ColumnDef<Row>[] = [
  { accessorKey: "date", header: rowL("date") },
  { accessorKey: "reno", header: rowL("reno") },
  { accessorKey: "cuno", header: rowL("cuno") },
  { accessorKey: "cuname1", header: rowL("cuname1") },
  money("cashMoney"),
  money("cardMoney"),
  money("checkMoney"),
  money("remitMoney"),
  money("ticketMoney"),
  money("otherMoney"),
  money("discountMoney"),
  money("getPreAccount"),
  money("addPreAcc"),
  money("writeOffMoney"),
  money("useMoney"),
]

type Filters = { spno: string; start: string; end: string }

export default function DatePaymentPage() {
  const [draft, setDraft] = useState<Filters>({ spno: "", start: firstDayOfMonthIso(), end: todayIso() })
  const [filters, setFilters] = useState<Filters | null>(null)

  const { data, isFetching } = useQuery({
    queryKey: ["payment", "dates", filters],
    enabled: !!filters,
    queryFn: () =>
      unwrap(
        api.GET("/v1/Payment/Date", {
          params: {
            query: {
              Spno: filters!.spno || undefined,
              StartDate: toApiDate(filters!.start) ?? "",
              EndDate: toApiDate(filters!.end) ?? "",
            },
          },
        }),
      ),
  })

  return (
    <>
      <PageHeader title="日期別已收帳款" />
      <SearchForm onSubmit={() => setFilters(draft)}>
        <Field label="起始日期" required>
          <Input type="date" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} />
        </Field>
        <Field label="終止日期" required>
          <Input type="date" value={draft.end} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} />
        </Field>
        <Field label="專案編號">
          <Input value={draft.spno} onChange={(e) => setDraft((d) => ({ ...d, spno: e.target.value }))} />
        </Field>
      </SearchForm>
      {isFetching ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <div className="grid gap-4">
          <Card>
            <CardContent>
              <DetailGrid
                columns={4}
                items={[
                  { label: sumL("writeOffTotalNumber"), value: fmtNumber(data.writeOffTotalNumber) },
                  { label: sumL("cashTotalMoney"), value: fmtMoney(data.cashTotalMoney) },
                  { label: sumL("cardTotalMoney"), value: fmtMoney(data.cardTotalMoney) },
                  { label: sumL("checkTotalMoney"), value: fmtMoney(data.checkTotalMoney) },
                  { label: sumL("remitTotalMoney"), value: fmtMoney(data.remitTotalMoney) },
                  { label: sumL("ticketTotalMoney"), value: fmtMoney(data.ticketTotalMoney) },
                  { label: sumL("otherTotalMoney"), value: fmtMoney(data.otherTotalMoney) },
                  { label: sumL("discountTotalMoney"), value: fmtMoney(data.discountTotalMoney) },
                  { label: sumL("getPreAccTotal"), value: fmtMoney(data.getPreAccTotal) },
                  { label: sumL("addPreAccTotal"), value: fmtMoney(data.addPreAccTotal) },
                  { label: sumL("useTotalMoney"), value: fmtMoney(data.useTotalMoney) },
                  {
                    label: sumL("writeOffTotalMoney"),
                    value: <span className="text-lg font-semibold">{fmtMoney(data.writeOffTotalMoney)}</span>,
                  },
                ]}
              />
            </CardContent>
          </Card>
          <DataTable columns={columns} data={data.custReceiveList ?? []} />
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">請選擇日期後查詢</p>
      )}
    </>
  )
}
