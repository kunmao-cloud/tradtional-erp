"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Field } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { CustomerPicker } from "@/components/pickers"
import { SearchForm } from "@/components/search-form"
import { api, unwrap } from "@/lib/api/client"
import { firstDayOfMonthIso, toApiDate, todayIso } from "@/lib/date"
import { ReceivableView } from "@/features/payments/receivable-view"

type Filters = { cuno: string; cuname: string; spno: string; spname: string; start: string; end: string }

export default function CustomerReceivablePage() {
  const [draft, setDraft] = useState<Filters>({ cuno: "", cuname: "", spno: "", spname: "", start: firstDayOfMonthIso(), end: todayIso() })
  const [filters, setFilters] = useState<Filters | null>(null)

  const { data, isFetching } = useQuery({
    queryKey: ["payment", "customers", filters],
    enabled: !!filters,
    queryFn: () =>
      unwrap(
        api.GET("/v1/Payment/Customers", {
          params: {
            query: {
              Cuno: filters!.cuno,
              Spno: filters!.spno || undefined,
              Spname: filters!.spname || undefined,
              StartDate: toApiDate(filters!.start) ?? "",
              EndDate: toApiDate(filters!.end) ?? "",
            },
          },
        }),
      ),
  })

  return (
    <>
      <PageHeader title="客戶別應收帳款" />
      <SearchForm
        onSubmit={() => (draft.cuno ? setFilters(draft) : toast.warning("請選擇客戶"))}
      >
        <Field label="客戶" required>
          <CustomerPicker
            value={draft.cuno}
            displayText={draft.cuno ? `${draft.cuno} ${draft.cuname}` : undefined}
            onSelect={(c) => setDraft((d) => ({ ...d, cuno: c?.cuno ?? "", cuname: c?.cuname1 ?? "" }))}
          />
        </Field>
        <Field label="起始日期" required>
          <Input type="date" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} />
        </Field>
        <Field label="終止日期" required>
          <Input type="date" value={draft.end} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} />
        </Field>
        <Field label="專案編號">
          <Input value={draft.spno} onChange={(e) => setDraft((d) => ({ ...d, spno: e.target.value }))} />
        </Field>
        <Field label="專案名稱">
          <Input value={draft.spname} onChange={(e) => setDraft((d) => ({ ...d, spname: e.target.value }))} />
        </Field>
      </SearchForm>
      {isFetching ? (
        <Skeleton className="h-64 w-full" />
      ) : data ? (
        <ReceivableView data={data} partyLabel="客戶" />
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">請選擇客戶與日期後查詢</p>
      )}
    </>
  )
}
