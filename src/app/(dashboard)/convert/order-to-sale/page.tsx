"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowRightLeftIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Field } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { SearchForm } from "@/components/search-form"
import { api, unwrap, unwrapResult, type Schemas } from "@/lib/api/client"
import { toApiDate, todayIso } from "@/lib/date"
import { toNumber } from "@/lib/format"
import { PickList, type PickGroup } from "@/features/convert/pick-list"

const SHIP_METHODS = [
  { value: "1", label: "貨運" },
  { value: "2", label: "自取" },
  { value: "3", label: "郵寄" },
]

const itemKey = (orno: string, i: number) => `${orno}#${i}`

export default function OrderToSalePage() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState({ esdate: todayIso(), seno: "1" })
  const [filters, setFilters] = useState(draft)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [qty, setQty] = useState<Record<string, string>>({})

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["convert", "order", filters],
    queryFn: () =>
      unwrap(
        api.GET("/v1/Order/CarOrderList", { params: { query: { EsDate: toApiDate(filters.esdate), SeNo: filters.seno } } }),
      ),
  })

  const [loadedData, setLoadedData] = useState(data)
  if (data !== loadedData) {
    const init: Record<string, string> = {}
    data?.forEach((o) =>
      o.items?.forEach((it, i) => {
        init[itemKey(o.orno ?? "", i)] = String(Math.max((it.qtyNotOut ?? 0) - (it.qtyPickUp ?? 0), 0))
      }),
    )
    setLoadedData(data)
    setQty(init)
    setSelected({})
  }

  const groups: PickGroup[] = useMemo(
    () =>
      (data ?? []).map((o) => ({
        key: o.orno ?? "",
        docno: o.orno ?? "",
        party: [o.cuno, o.cuname1].filter(Boolean).join(" "),
        items: (o.items ?? []).map((it, i) => ({
          key: itemKey(o.orno ?? "", i),
          itno: it.itno ?? "",
          itname: it.itname ?? "",
          itunit: it.itunit ?? "",
          remaining: it.qtyNotOut ?? 0,
          picked: it.qtyPickUp ?? 0,
        })),
      })),
    [data],
  )

  const convert = useMutation({
    mutationFn: () => {
      const orders: Schemas["OrderData"][] = (data ?? [])
        .filter((o) => selected[o.orno ?? ""])
        .map((o) => ({
          orNo: o.orno,
          cuNo: o.cuno,
          items: (o.items ?? [])
            .map((it, i) => ({
              itNo: it.itno,
              itName: it.itname,
              itUnit: it.itunit,
              itPkgQty: it.itpkgqty,
              ittrait: it.ittrait,
              bomId: it.bomid,
              qtyNotOut: it.qtyNotOut,
              qtyPickUp: toNumber(qty[itemKey(o.orno ?? "", i)]),
            }))
            .filter((it) => it.qtyPickUp > 0),
        }))
        .filter((o) => o.items.length)
      if (!orders.length) throw new Error("請勾選訂單並輸入本次數量")
      return unwrapResult(api.POST("/v1/Order/AddOrderToSale", { body: { orders } }))
    },
    onSuccess: async (res) => {
      toast.success(res.message || "已轉成銷貨單")
      await qc.invalidateQueries({ queryKey: ["convert", "order"] })
      await qc.invalidateQueries({ queryKey: ["doc", "sale"] })
    },
  })

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <>
      <PageHeader
        title="訂單轉銷貨"
        description="依交貨日期與送貨方式列出待出貨訂單，勾選後輸入本次出貨數量"
        actions={
          <Button onClick={() => convert.mutate()} disabled={!selectedCount || convert.isPending}>
            {convert.isPending ? <Loader2Icon className="animate-spin" /> : <ArrowRightLeftIcon />}
            轉銷貨（{selectedCount}）
          </Button>
        }
      />
      <SearchForm onSubmit={() => setFilters(draft)}>
        <Field label="交貨日期">
          <Input type="date" value={draft.esdate} onChange={(e) => setDraft((d) => ({ ...d, esdate: e.target.value }))} />
        </Field>
        <Field label="送貨方式" required>
          <Select value={draft.seno} onValueChange={(v) => setDraft((d) => ({ ...d, seno: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIP_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </SearchForm>
      {isLoading || isFetching ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <PickList
          groups={groups}
          selected={selected}
          onToggle={(k, v) => setSelected((s) => ({ ...s, [k]: v }))}
          quantities={qty}
          onQuantity={(k, v) => setQty((q) => ({ ...q, [k]: v }))}
          remainingLabel="未交量"
          showPicked
        />
      )}
    </>
  )
}
