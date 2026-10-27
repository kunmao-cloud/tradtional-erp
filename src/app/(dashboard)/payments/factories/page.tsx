"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Field } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { FactoryPicker } from "@/components/pickers"
import { SearchForm } from "@/components/search-form"
import { api, unwrap } from "@/lib/api/client"
import { firstDayOfMonthIso, toApiDate, todayIso } from "@/lib/date"
import { ReceivableView } from "@/features/payments/receivable-view"

type Filters = { fano: string; faname: string; spno: string; spname: string; start: string; end: string }

export default function FactoryPayablePage() {
  const [draft, setDraft] = useState<Filters>({ fano: "", faname: "", spno: "", spname: "", start: firstDayOfMonthIso(), end: todayIso() })
  const [filters, setFilters] = useState<Filters | null>(null)

  const { data, isFetching } = useQuery({
    queryKey: ["payment", "factories", filters],
    enabled: !!filters,
    queryFn: () =>
      unwrap(
        api.GET("/v1/Payment/Factory", {
          params: {
            query: {
              Fano: filters!.fano,
              Faname: filters!.faname || undefined,
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
      <PageHeader title="廠商別應付帳款" />
      <SearchForm onSubmit={() => (draft.fano ? setFilters(draft) : toast.warning("請選擇廠商"))}>
        <Field label="廠商" required>
          <FactoryPicker
            value={draft.fano}
            displayText={draft.fano ? `${draft.fano} ${draft.faname}` : undefined}
            onSelect={(f) => setDraft((d) => ({ ...d, fano: f?.fano ?? "", faname: f?.faname1 ?? "" }))}
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
        <ReceivableView data={data} partyLabel="廠商" />
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">請選擇廠商與日期後查詢</p>
      )}
    </>
  )
}
