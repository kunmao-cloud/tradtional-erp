"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
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
import { useSession } from "@/hooks/use-session"

const rowL = labelsOf("CustPayment")
const sumL = labelsOf("GetEmplPaymentDto")

type Row = Schemas["CustPayment"]
const money = (key: keyof Row): ColumnDef<Row> => ({
  accessorKey: key,
  header: rowL(String(key)),
  meta: { align: "right" },
  cell: ({ getValue }) => fmtMoney(getValue()),
})

const columns: ColumnDef<Row>[] = [
  { accessorKey: "cuno", header: rowL("cuno") },
  { accessorKey: "cuname1", header: rowL("cuname1") },
  {
    accessorKey: "transactionNumber",
    header: rowL("transactionNumber"),
    meta: { align: "right" },
    cell: ({ getValue }) => fmtNumber(getValue()),
  },
  money("cuSpareRcv"),
  money("taxmny"),
  money("tax"),
  money("totmny"),
  money("discount"),
  money("receivedandadvance"),
  money("acctmny"),
]

type Filters = { emno: string; emname: string; start: string; end: string }

export default function EmployeeReceivablePage() {
  const user = useSession()
  const [draft, setDraft] = useState<Filters>({ emno: user?.employeid ?? "", emname: "", start: firstDayOfMonthIso(), end: todayIso() })
  const [filters, setFilters] = useState<Filters | null>(null)

  const { data, isFetching } = useQuery({
    queryKey: ["payment", "employees", filters],
    enabled: !!filters,
    queryFn: () =>
      unwrap(
        api.GET("/v1/Payment/Employee", {
          params: {
            query: {
              Emno: filters!.emno,
              Emname: filters!.emname || undefined,
              StartDate: toApiDate(filters!.start) ?? "",
              EndDate: toApiDate(filters!.end) ?? "",
            },
          },
        }),
      ),
  })

  return (
    <>
      <PageHeader title="業務別應收帳款" />
      <SearchForm onSubmit={() => (draft.emno ? setFilters(draft) : toast.warning("請輸入業務編號"))}>
        <Field label={sumL("emno")} required>
          <Input value={draft.emno} onChange={(e) => setDraft((d) => ({ ...d, emno: e.target.value }))} />
        </Field>
        <Field label={sumL("emname")}>
          <Input value={draft.emname} onChange={(e) => setDraft((d) => ({ ...d, emname: e.target.value }))} />
        </Field>
        <Field label="起始日期" required>
          <Input type="date" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} />
        </Field>
        <Field label="終止日期" required>
          <Input type="date" value={draft.end} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} />
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
                  { label: sumL("emno"), value: data.emno },
                  { label: sumL("emname"), value: data.emname },
                  { label: sumL("transactionNumberAll"), value: fmtNumber(data.transactionNumberAll) },
                  { label: rowL("taxmny"), value: fmtMoney(data.taxmny) },
                  { label: rowL("tax"), value: fmtMoney(data.tax) },
                  { label: rowL("totmny"), value: fmtMoney(data.totmny) },
                  { label: rowL("discount"), value: fmtMoney(data.discount) },
                  { label: rowL("receivedandadvance"), value: fmtMoney(data.receivedandadvance) },
                  {
                    label: rowL("acctmny"),
                    value: <span className="text-lg font-semibold">{fmtMoney(data.acctmny)}</span>,
                  },
                ]}
              />
            </CardContent>
          </Card>
          <DataTable columns={columns} data={data.custPayments ?? []} />
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">請輸入業務編號與日期後查詢</p>
      )}
    </>
  )
}
