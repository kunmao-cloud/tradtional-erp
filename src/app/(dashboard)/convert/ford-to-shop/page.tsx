"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowRightLeftIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Field } from "@/components/field"
import { PageHeader } from "@/components/page-header"
import { SearchForm } from "@/components/search-form"
import { api, unwrap, unwrapResult, type Schemas } from "@/lib/api/client"
import { toApiDate } from "@/lib/date"
import { toNumber } from "@/lib/format"
import { PickList, type PickGroup } from "@/features/convert/pick-list"

const itemKey = (fono: string, i: number) => `${fono}#${i}`

export default function FordToShopPage() {
  const qc = useQueryClient()
  const [draft, setDraft] = useState({ fodate: "", fono: "" })
  const [filters, setFilters] = useState(draft)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [qty, setQty] = useState<Record<string, string>>({})

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["convert", "ford", filters],
    queryFn: () =>
      unwrap(
        api.GET("/v1/Ford/Car/CarFordList", {
          params: { query: { FoDate: toApiDate(filters.fodate), FoNo: filters.fono || undefined } },
        }),
      ),
  })

  const [loadedData, setLoadedData] = useState(data)
  if (data !== loadedData) {
    const init: Record<string, string> = {}
    data?.forEach((f) => f.items?.forEach((it, i) => (init[itemKey(f.fono ?? "", i)] = String(it.qtyNotIn ?? 0))))
    setLoadedData(data)
    setQty(init)
    setSelected({})
  }

  const groups: PickGroup[] = useMemo(
    () =>
      (data ?? []).map((f) => ({
        key: f.fono ?? "",
        docno: f.fono ?? "",
        party: [f.fano, f.faname1].filter(Boolean).join(" "),
        items: (f.items ?? []).map((it, i) => ({
          key: itemKey(f.fono ?? "", i),
          itno: it.itno ?? "",
          itname: it.itname ?? "",
          itunit: it.itunit ?? "",
          remaining: it.qtyNotIn ?? 0,
        })),
      })),
    [data],
  )

  const convert = useMutation({
    mutationFn: () => {
      const fords: Schemas["FordData"][] = (data ?? [])
        .filter((f) => selected[f.fono ?? ""])
        .map((f) => ({
          fono: f.fono,
          items: (f.items ?? [])
            .map((it, i) => ({ bomid: it.bomid, qtyPickUp: toNumber(qty[itemKey(f.fono ?? "", i)]) }))
            .filter((it) => it.qtyPickUp > 0),
        }))
        .filter((f) => f.items.length)
      if (!fords.length) throw new Error("請勾選採購單並輸入本次數量")
      return unwrapResult(api.POST("/v1/Ford/Car/AddOrderToBShop", { body: { fords } }))
    },
    onSuccess: async (res) => {
      toast.success(res.message || "已轉成進貨單")
      await qc.invalidateQueries({ queryKey: ["convert", "ford"] })
      await qc.invalidateQueries({ queryKey: ["doc", "shop"] })
    },
  })

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <>
      <PageHeader
        title="採購轉進貨"
        description="列出尚未入庫的採購單，勾選後輸入本次進貨數量"
        actions={
          <Button onClick={() => convert.mutate()} disabled={!selectedCount || convert.isPending}>
            {convert.isPending ? <Loader2Icon className="animate-spin" /> : <ArrowRightLeftIcon />}
            轉進貨（{selectedCount}）
          </Button>
        }
      />
      <SearchForm onSubmit={() => setFilters(draft)} onReset={() => (setDraft({ fodate: "", fono: "" }), setFilters({ fodate: "", fono: "" }))}>
        <Field label="採購日期">
          <Input type="date" value={draft.fodate} onChange={(e) => setDraft((d) => ({ ...d, fodate: e.target.value }))} />
        </Field>
        <Field label="採購單號">
          <Input value={draft.fono} onChange={(e) => setDraft((d) => ({ ...d, fono: e.target.value }))} />
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
          remainingLabel="未入庫量"
        />
      )}
    </>
  )
}
