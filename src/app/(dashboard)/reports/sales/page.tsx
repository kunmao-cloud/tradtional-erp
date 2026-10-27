"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ApiBugBanner } from "@/components/api-bug-banner"
import { AutoData } from "@/components/auto-data"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Field } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { SearchForm } from "@/components/search-form"
import { SwaggerLabelView } from "@/components/swagger-label"
import { api, unwrap } from "@/lib/api/client"
import { apiParamLabel } from "@/lib/api-label"
import { firstDayOfMonthIso, toApiDate, todayIso } from "@/lib/date"

/** 選項文字來自 swagger 參數 description（Type／CalculateCost）。 */
const REPORT_TYPES = [
  { value: "0", label: "0:客戶銷售報表" },
  { value: "1", label: "1:業務銷售報表" },
  { value: "2", label: "2:產品銷售報表" },
]

const COST_METHODS = [
  { value: "0", label: "0:月平均成本" },
  { value: "1", label: "1:最近一次進貨成本" },
  { value: "2", label: "2:標準成本" },
  { value: "3", label: "3:建檔成本" },
]

type Filters = {
  start: string
  end: string
  type: string
  cost: string
  includeSale: boolean
  includeRSale: boolean
  includeFinish: boolean
  startitno: string
  enditno: string
  startcuno: string
  endcuno: string
  startemno: string
  endemno: string
}

const INITIAL: Filters = {
  start: firstDayOfMonthIso(),
  end: todayIso(),
  type: "0",
  cost: "0",
  includeSale: true,
  includeRSale: true,
  includeFinish: false,
  startitno: "",
  enditno: "",
  startcuno: "",
  endcuno: "",
  startemno: "",
  endemno: "",
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export default function SalesReportPage() {
  const [draft, setDraft] = useState<Filters>(INITIAL)
  const [filters, setFilters] = useState<Filters | null>(null)
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const text = (k: keyof Filters) => ({
    value: draft[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value as never),
  })

  const { data, isFetching } = useQuery({
    queryKey: ["report", "sales", filters],
    enabled: !!filters,
    queryFn: () => {
      const f = filters!
      return unwrap(
        api.GET("/v1/SaleReport", {
          params: {
            query: {
              Startdate: toApiDate(f.start) ?? "",
              Enddate: toApiDate(f.end) ?? "",
              Type: Number(f.type),
              CalculateCost: Number(f.cost),
              IncludeSale: f.includeSale ? 1 : 0,
              IncludeRSale: f.includeRSale ? 1 : 0,
              IncludeFinish: f.includeFinish ? 1 : 0,
              Startitno: f.startitno || undefined,
              Enditno: f.enditno || undefined,
              Startcuno: f.startcuno || undefined,
              Endcuno: f.endcuno || undefined,
              Startemno: f.startemno || undefined,
              Endemno: f.endemno || undefined,
            },
          },
        }),
      )
    },
  })

  return (
    <>
      <PageHeader title="銷售報表" />
      <ApiBugBanner id="B8" title="報表結果的欄位，文件都沒寫中文名">
        銷售報表查得出數字，但 API 文件沒說明每個欄位是什麼意思。所以下面會用英文欄位名，並標「缺」提醒。
      </ApiBugBanner>
      <SearchForm onSubmit={() => setFilters(draft)} onReset={() => (setDraft(INITIAL), setFilters(null))}>
        <SelectField label={apiParamLabel("Type")} value={draft.type} options={REPORT_TYPES} onChange={(v) => set("type", v)} />
        <Field label={apiParamLabel("Startdate")} required>
          <Input type="date" {...text("start")} />
        </Field>
        <Field label={apiParamLabel("Enddate")} required>
          <Input type="date" {...text("end")} />
        </Field>
        <SelectField
          label={apiParamLabel("CalculateCost")}
          value={draft.cost}
          options={COST_METHODS}
          onChange={(v) => set("cost", v)}
        />
        <Field label={apiParamLabel("Startcuno")}>
          <Input {...text("startcuno")} />
        </Field>
        <Field label={apiParamLabel("Endcuno")}>
          <Input {...text("endcuno")} />
        </Field>
        <Field label={apiParamLabel("Startitno")}>
          <Input {...text("startitno")} />
        </Field>
        <Field label={apiParamLabel("Enditno")}>
          <Input {...text("enditno")} />
        </Field>
        <Field label={apiParamLabel("Startemno")}>
          <Input {...text("startemno")} />
        </Field>
        <Field label={apiParamLabel("Endemno")}>
          <Input {...text("endemno")} />
        </Field>
        <div className="flex flex-wrap items-center gap-4 pb-2 sm:col-span-2 lg:col-span-4">
          {(
            [
              ["includeSale", "IncludeSale"],
              ["includeRSale", "IncludeRSale"],
              ["includeFinish", "IncludeFinish"],
            ] as const
          ).map(([k, param]) => (
            <Label key={k} className="flex max-w-full items-center gap-2 font-normal">
              <Checkbox checked={draft[k]} onCheckedChange={(v) => set(k, v === true)} />
              <span className="text-xs text-muted-foreground">
                <SwaggerLabelView>{apiParamLabel(param)}</SwaggerLabelView>
              </span>
            </Label>
          ))}
        </div>
      </SearchForm>
      {isFetching ? (
        <Skeleton className="h-64 w-full" />
      ) : filters ? (
        <AutoData data={data} gapHint="銷售報表回傳欄位，API 文件沒寫中文名" />
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">設定條件後查詢</p>
      )}
    </>
  )
}
