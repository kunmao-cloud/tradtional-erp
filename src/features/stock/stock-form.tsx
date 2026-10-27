"use client"

import { useState } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/field"
import { ItemPicker, StkroomSelect } from "@/components/pickers"
import { api, unwrap, unwrapResult, type Schemas } from "@/lib/api/client"
import { toApiDate, todayIso } from "@/lib/date"
import { fmtMoney, fmtNumber, round, toNumber } from "@/lib/format"
import { useSession } from "@/hooks/use-session"
import { despsToFields, emptyLine, fetchLineFromItem, type LineForm } from "@/features/docs/lines"

export type StockKind = "inventory" | "draw" | "garner"

export const STOCK_TITLES: Record<StockKind, string> = {
  inventory: "盤點",
  draw: "領料",
  garner: "入庫",
}

type StockLine = LineForm & { stkqty: number; cost: number }

type StockFormValues = {
  docdate: string
  stnoo: string
  stnameo: string
  stnoi: string
  stnamei: string
  orno: string
  emno: string
  emname: string
  docmemo: string
  docmemo1: string
  lines: StockLine[]
}

const emptyStockLine = (): StockLine => ({ ...emptyLine(), qty: "", stkqty: 0, cost: 0 })

export function StockForm({ kind }: { kind: StockKind }) {
  const user = useSession()
  const [loadingRow, setLoadingRow] = useState<number | null>(null)
  const isInventory = kind === "inventory"
  // 盤點用 stnoo 欄位存放盤點倉庫
  const mainWarehouse: "stnoo" | "stnoi" = kind === "garner" ? "stnoi" : "stnoo"

  const defaults: StockFormValues = {
    docdate: todayIso(),
    stnoo: "",
    stnameo: "",
    stnoi: "",
    stnamei: "",
    orno: "",
    emno: user?.employeid ?? "",
    emname: user?.employename ?? "",
    docmemo: "",
    docmemo1: "",
    lines: [emptyStockLine()],
  }
  const { control, register, handleSubmit, setValue, getValues, reset, formState } = useForm<StockFormValues>({
    defaultValues: defaults,
  })
  const lineArray = useFieldArray({ control, name: "lines" })
  const [lines, mainStno] = useWatch({ control, name: ["lines", mainWarehouse] })

  const computed = (lines ?? []).map((l) => {
    const qty = toNumber(l.qty)
    const invqty = round(qty - l.stkqty, 4)
    return { qty, invqty, mny: round(invqty * l.cost, 2) }
  })
  const sum = round(computed.reduce((s, c) => s + c.mny, 0), 2)

  async function pickItem(i: number, itno: string | null) {
    if (!itno) return lineArray.update(i, emptyStockLine())
    setLoadingRow(i)
    try {
      const current = getValues(`lines.${i}`)
      if (isInventory) {
        const it = await unwrap(api.GET("/v1/Item/{itno}", { params: { path: { itno } } }))
        const stno = getValues("stnoo")
        const stock = it.stocks?.find((s: Schemas["StockBean"]) => s.stno === stno)
        lineArray.update(i, {
          ...current,
          itno: it.itno ?? itno,
          itname: it.itname ?? "",
          itunit: it.itunit ?? "",
          ittrait: it.ittrait ?? 0,
          detailBomrec: it.detailBomrec ?? 0,
          desps: Array.from({ length: 10 }, (_, k) => (it[`itdesp${k + 1}` as keyof typeof it] as string) ?? ""),
          stkqty: stock?.itqyt ?? 0,
          cost: it.itcost ?? 0,
        })
      } else {
        const line = await fetchLineFromItem(itno, {}, current)
        lineArray.update(i, { ...current, ...line, qty: current.qty || "1" })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "讀取產品失敗")
    } finally {
      setLoadingRow(null)
    }
  }

  async function onSubmit(v: StockFormValues) {
    const valid = v.lines.filter((l) => l.itno)
    if (!valid.length) return toast.error("請至少輸入一筆明細")
    const main = v[mainWarehouse]
    if (!main) return toast.error("請選擇倉庫")

    let request: Promise<{ message: string }>
    if (isInventory) {
      const details = valid.map((l) => {
        const qty = toNumber(l.qty)
        const invqty = round(qty - l.stkqty, 4)
        return {
          itno: l.itno,
          itname: l.itname,
          ittrait: l.ittrait,
          itunit: l.itunit,
          stkqty: l.stkqty,
          qty,
          invqty,
          price: l.cost,
          mny: round(invqty * l.cost, 2),
          memo: l.memo || undefined,
          detailBomrec: l.detailBomrec,
          ...despsToFields(l.desps),
        }
      })
      request = unwrapResult(
        api.POST("/v1/AddInventory", {
          body: {
            ivdate: toApiDate(v.docdate) ?? "",
            stno: v.stnoo,
            stname: v.stnameo,
            emno: v.emno || undefined,
            emname: v.emname || undefined,
            memo: v.docmemo || undefined,
            sum: round(details.reduce((s, d) => s + d.mny, 0), 2),
            inventoryDetailList: details,
          },
        }),
      )
    } else {
      const bomsKey = kind === "draw" ? "drawboms" : "garnerboms"
      const details = valid.map((l) => ({
        itno: l.itno,
        itname: l.itname,
        ittrait: l.ittrait,
        itunit: l.itunit,
        qty: toNumber(l.qty),
        itpkgqty: l.itpkgqty,
        memo: l.memo || undefined,
        detailBomrec: l.detailBomrec,
        ...despsToFields(l.desps),
        [bomsKey]: l.boms,
      }))
      const header = {
        docdate: toApiDate(v.docdate),
        emno: v.emno || undefined,
        emname: v.emname || undefined,
        docmemo: v.docmemo || undefined,
        docmemo1: v.docmemo1 || undefined,
        stnoo: v.stnoo || undefined,
        stnameo: v.stnameo || undefined,
        stnoi: v.stnoi || undefined,
        stnamei: v.stnamei || undefined,
      }
      request =
        kind === "draw"
          ? unwrapResult(
              api.POST("/v1/Draw", {
                body: { ...header, stnoo: v.stnoo, drawdetails: details } as Schemas["AddDrawRequest"],
              }),
            )
          : unwrapResult(
              api.POST("/v1/Garner", {
                body: {
                  ...header,
                  stnoi: v.stnoi,
                  orno: v.orno || undefined,
                  garnerdetails: details,
                } as Schemas["AddGarnerRequest"],
              }),
            )
    }

    const res = await request.catch((e) => {
      toast.error(e.message)
      return null
    })
    if (!res) return
    toast.success(res.message || `${STOCK_TITLES[kind]}單已新增`)
    reset(defaults)
  }

  const warehouseField = (name: "stnoo" | "stnoi", label: string, required: boolean) => (
    <Field label={label} required={required}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <StkroomSelect
            value={field.value}
            allowEmpty={!required}
            onChange={(stno, stname) => {
              field.onChange(stno)
              setValue(name === "stnoo" ? "stnameo" : "stnamei", stname)
            }}
          />
        )}
      />
    </Field>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">表頭</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={`${STOCK_TITLES[kind]}日期`} required>
            <Input type="date" {...register("docdate", { required: true })} />
          </Field>
          {kind === "inventory" && warehouseField("stnoo", "盤點倉庫", true)}
          {kind === "draw" && (
            <>
              {warehouseField("stnoo", "發料倉庫", true)}
              {warehouseField("stnoi", "入料倉庫", false)}
            </>
          )}
          {kind === "garner" && (
            <>
              {warehouseField("stnoi", "入料倉庫", true)}
              {warehouseField("stnoo", "發料倉庫", false)}
              <Field label="訂單編號">
                <Input {...register("orno")} />
              </Field>
            </>
          )}
          <Field label="員工編號">
            <Input {...register("emno")} />
          </Field>
          <Field label="員工名稱">
            <Input {...register("emname")} />
          </Field>
          <Field label="備註" className="sm:col-span-2 lg:col-span-4">
            <Input {...register("docmemo")} />
          </Field>
          {!isInventory && (
            <Field label="詳細備註" className="sm:col-span-2 lg:col-span-4">
              <Textarea rows={2} {...register("docmemo1")} />
            </Field>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">明細</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => lineArray.append(emptyStockLine())}>
            <PlusIcon />
            新增一列
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead className="min-w-56">產品</TableHead>
                  <TableHead className="min-w-48">品名規格</TableHead>
                  <TableHead className="w-20">單位</TableHead>
                  {isInventory && <TableHead className="w-24 text-right">帳上庫存</TableHead>}
                  <TableHead className="w-28 text-right">{isInventory ? "盤點數量" : "數量"}</TableHead>
                  {isInventory && (
                    <>
                      <TableHead className="w-24 text-right">盤盈虧</TableHead>
                      <TableHead className="w-24 text-right">平均成本</TableHead>
                      <TableHead className="w-28 text-right">金額</TableHead>
                    </>
                  )}
                  <TableHead className="min-w-40">說明</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineArray.fields.map((f, i) => (
                  <TableRow key={f.id} className="align-top">
                    <TableCell className="pt-3 text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`lines.${i}.itno`}
                        render={({ field }) => (
                          <div className="flex items-center gap-1">
                            <ItemPicker
                              value={field.value}
                              className="flex-1"
                              disabled={(isInventory && !mainStno) || loadingRow === i}
                              onSelect={(it) => pickItem(i, it?.itno ?? null)}
                            />
                            {loadingRow === i && <Loader2Icon className="size-4 animate-spin" />}
                          </div>
                        )}
                      />
                      {(lines?.[i]?.boms.length ?? 0) > 0 && (
                        <Badge variant="secondary" className="mt-1">
                          含 {lines[i].boms.length} 個子件
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input {...register(`lines.${i}.itname`)} />
                    </TableCell>
                    <TableCell>
                      <Input {...register(`lines.${i}.itunit`)} />
                    </TableCell>
                    {isInventory && (
                      <TableCell className="pt-3 text-right tabular-nums">{fmtNumber(lines?.[i]?.stkqty)}</TableCell>
                    )}
                    <TableCell>
                      <Input type="number" step="any" className="text-right" {...register(`lines.${i}.qty`)} />
                    </TableCell>
                    {isInventory && (
                      <>
                        <TableCell className="pt-3 text-right tabular-nums">{fmtNumber(computed[i]?.invqty)}</TableCell>
                        <TableCell className="pt-3 text-right tabular-nums">{fmtMoney(lines?.[i]?.cost)}</TableCell>
                        <TableCell className="pt-3 text-right tabular-nums">{fmtMoney(computed[i]?.mny)}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <Input {...register(`lines.${i}.memo`)} />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="移除此列"
                        onClick={() =>
                          lineArray.fields.length > 1 ? lineArray.remove(i) : lineArray.update(0, emptyStockLine())
                        }
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {isInventory && !mainStno && <p className="mt-2 text-xs text-muted-foreground">請先選擇盤點倉庫，才能帶出帳上庫存。</p>}
          {isInventory && (
            <div className="mt-4 ml-auto flex max-w-xs justify-between text-base font-semibold">
              <span>盤盈虧金額合計</span>
              <span className="tabular-nums">{fmtMoney(sum)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          新增{STOCK_TITLES[kind]}單
        </Button>
      </div>
    </form>
  )
}
