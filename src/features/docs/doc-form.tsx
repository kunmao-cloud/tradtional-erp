"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormRegister } from "react-hook-form"
import { toast } from "sonner"
import { CalculatorIcon, Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Field } from "@/components/field"
import { CustomerPicker, FactoryPicker, ItemPicker, StkroomSelect } from "@/components/pickers"
import { api, unwrap } from "@/lib/api/client"
import { labelsOf } from "@/lib/api-label"
import { SwaggerLabelView } from "@/components/swagger-label"
import { toApiDate, todayIso } from "@/lib/date"
import { fmtMoney, toNumber } from "@/lib/format"
import { enc } from "@/lib/url"
import { useSession } from "@/hooks/use-session"
import type { DocConfig } from "./config"
import { TAX_TYPES, calcLine, calcTotals, percentToRate } from "./calc"
import { despsToFields, emptyLine, fetchLineFromItem, lineToRequest, type LineForm } from "./lines"

export type DocFormValues = {
  docdate: string
  cfno: string
  cfname1: string
  cfname2: string
  cftel1: string
  cfper1: string
  cuaddr: string
  emno: string
  emname: string
  x3no: string
  rate: string
  stno: string
  stname: string
  esdate: string
  sano: string
  docmemo: string
  docmemo1: string
  lines: LineForm[]
}

type GrossProfitResult = {
  gP_CanSave?: boolean
  gP_Requires?: boolean
  gP_Message?: string | null
  lP_CanSave?: boolean
  lP_Requires?: boolean
  lP_Message?: string | null
}

export function DocForm({ cfg }: { cfg: DocConfig }) {
  const L = useMemo(() => labelsOf(cfg.labelSchemas.add), [cfg.labelSchemas.add])
  const router = useRouter()
  const qc = useQueryClient()
  const user = useSession()
  const [itemLoading, setItemLoading] = useState<number | null>(null)

  const form = useForm<DocFormValues>({
    defaultValues: {
      docdate: todayIso(),
      cfno: "",
      cfname1: "",
      cfname2: "",
      cftel1: "",
      cfper1: "",
      cuaddr: "",
      emno: user?.employeid ?? "",
      emname: user?.employename ?? "",
      x3no: "1",
      rate: "5",
      stno: "",
      stname: "",
      esdate: "",
      sano: "",
      docmemo: "",
      docmemo1: "",
      lines: [emptyLine()],
    },
  })
  const { control, register, handleSubmit, setValue, getValues, formState } = form
  const lineArray = useFieldArray({ control, name: "lines" })

  const [x3no, rate, cfno, lines] = useWatch({ control, name: ["x3no", "rate", "cfno", "lines"] })
  const totals = calcTotals(lines ?? [], Number(x3no), percentToRate(toNumber(rate)))

  const { data: plugins } = useQuery({
    queryKey: ["plugins"],
    queryFn: () => unwrap(api.GET("/v1/Plugin")),
    enabled: cfg.party === "customer",
    staleTime: 10 * 60_000,
  })
  const grossProfitEnabled = !!plugins?.some((p) => p.plname?.includes("毛利"))

  async function pickItem(index: number, itno: string | null) {
    if (!itno) {
      lineArray.update(index, emptyLine())
      return
    }
    setItemLoading(index)
    try {
      const current = getValues(`lines.${index}`)
      const line = await fetchLineFromItem(itno, { cfno: getValues("cfno"), kind: cfg.itemKind }, { ...current, qty: current.qty || "1" })
      lineArray.update(index, line)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "讀取產品失敗")
    } finally {
      setItemLoading(null)
    }
  }

  async function checkGrossProfit(values: DocFormValues, silentWhenPass: boolean): Promise<boolean> {
    const valid = values.lines.filter((l) => l.itno)
    const res = await unwrap(
      api.POST("/v1/Plugin/GrossProfit", {
        body: {
          date: toApiDate(values.docdate),
          cuno: values.cfno,
          docdetails: valid.map((l) => {
            const c = calcLine(l, Number(values.x3no), percentToRate(toNumber(values.rate)))
            return {
              itno: l.itno,
              itname: l.itname,
              ittrait: l.ittrait,
              itunit: l.itunit,
              qty: toNumber(l.qty),
              itpkgqty: l.itpkgqty,
              price: toNumber(l.price),
              taxprice: c.taxprice,
              mny: c.mny,
              prs: toNumber(l.prs, 1) || 1,
              kitax: l.kitax,
              memo: l.memo,
              detailBomrec: l.detailBomrec,
              ...despsToFields(l.desps),
            }
          }),
          docboms: valid.flatMap((l) => l.boms),
        },
      }),
    ).catch((e) => {
      toast.error(`毛利率檢查失敗：${e.message}`)
      return null
    })
    if (!res) return false
    const r = res as GrossProfitResult
    const msgs = [r.gP_Message, r.lP_Message].filter(Boolean).join("\n")
    if (r.gP_CanSave === false || r.lP_CanSave === false) {
      toast.error(msgs || "未通過毛利率／最低售價檢查，無法儲存")
      return false
    }
    if (r.gP_Requires || r.lP_Requires) {
      return window.confirm(`${msgs}\n\n仍要繼續儲存嗎？`)
    }
    if (!silentWhenPass) toast.success(msgs || "通過毛利率與最低售價檢查")
    return true
  }

  async function onSubmit(values: DocFormValues) {
    const valid = values.lines.filter((l) => l.itno)
    if (cfg.requireLines && valid.length === 0) {
      toast.error("請至少輸入一筆明細")
      return
    }
    if (cfg.warehouse === "required" && !values.stno) {
      toast.error("請選擇倉庫")
      return
    }
    if (cfg.hasEsdate && !values.esdate) {
      toast.error("請輸入交貨日期")
      return
    }
    if (grossProfitEnabled && valid.length && !(await checkGrossProfit(values, true))) return

    const x3 = Number(values.x3no)
    const rateValue = percentToRate(toNumber(values.rate))
    const t = calcTotals(valid, x3, rateValue)
    const body: Record<string, unknown> = {
      docdate: toApiDate(values.docdate),
      cfno: values.cfno,
      cfname1: values.cfname1 || undefined,
      cfname2: values.cfname2 || undefined,
      cftel1: values.cftel1 || undefined,
      cfper1: values.cfper1 || undefined,
      emno: values.emno || undefined,
      emname: values.emname || undefined,
      x3no: x3,
      rate: rateValue,
      taxmny: t.taxmny,
      tax: t.tax,
      totmny: t.totmny,
      docmemo: values.docmemo || undefined,
      docmemo1: values.docmemo1 || undefined,
      ...(cfg.warehouse ? { stno: values.stno || undefined, stname: values.stname || undefined } : {}),
      ...(cfg.hasEsdate ? { esdate: toApiDate(values.esdate) } : {}),
      ...(cfg.hasSano ? { sano: values.sano || undefined } : {}),
      ...(cfg.hasCuaddr ? { cuaddr: values.cuaddr || undefined } : {}),
      [cfg.detailsKey]: valid.map((l, i) =>
        lineToRequest({ ...l, esdate: l.esdate || values.esdate }, t.lines[i], cfg.bomsKey, { esdate: cfg.hasEsdate }),
      ),
    }

    const res = await cfg.create(body).catch((e) => {
      toast.error(e.message)
      return null
    })
    if (!res) return
    toast.success(res.message || `${cfg.title}已新增`)
    await qc.invalidateQueries({ queryKey: ["doc", cfg.kind] })
    const newNo = typeof res.data === "string" ? res.data : (res.data as { docno?: string } | null)?.docno
    router.push(newNo ? `/docs/${cfg.kind}/${enc(newNo)}` : `/docs/${cfg.kind}`)
  }

  const partyLabel = cfg.party === "customer" ? "客戶" : "廠商"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">表頭</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={L("docdate")} required>
            <Input type="date" {...register("docdate", { required: true })} />
          </Field>
          <Field label={partyLabel} required error={formState.errors.cfno && `請選擇${partyLabel}`} className="lg:col-span-2">
            <Controller
              control={control}
              name="cfno"
              rules={{ required: true }}
              render={({ field }) => {
                const display = field.value ? `${field.value} ${getValues("cfname1")}` : undefined
                return cfg.party === "customer" ? (
                  <CustomerPicker
                    value={field.value}
                    displayText={display}
                    onSelect={(c) => {
                      field.onChange(c?.cuno ?? "")
                      setValue("cfname1", c?.cuname1 ?? "")
                      setValue("cfname2", c?.cuname2 ?? "")
                      setValue("cftel1", c?.cutel1 ?? "")
                      setValue("cfper1", c?.cuper1 ?? "")
                      setValue("cuaddr", c?.cuaddr1 ?? "")
                      if (c?.cuemno1) {
                        setValue("emno", c.cuemno1)
                        setValue("emname", c.cuemname ?? "")
                      }
                    }}
                  />
                ) : (
                  <FactoryPicker
                    value={field.value}
                    displayText={display}
                    onSelect={(f) => {
                      field.onChange(f?.fano ?? "")
                      setValue("cfname1", f?.faname1 ?? "")
                      setValue("cfname2", f?.faname2 ?? "")
                      setValue("cftel1", f?.fatel1 ?? "")
                      setValue("cfper1", f?.faper1 ?? "")
                    }}
                  />
                )
              }}
            />
          </Field>
          <Field label={L("cfper1")}>
            <Input {...register("cfper1")} />
          </Field>
          <Field label={L("cftel1")}>
            <Input {...register("cftel1")} />
          </Field>
          <Field label={L("emno")}>
            <Input {...register("emno")} />
          </Field>
          <Field label={L("emname")}>
            <Input {...register("emname")} />
          </Field>
          {cfg.warehouse && (
            <Field label={L("stno")} required={cfg.warehouse === "required"}>
              <Controller
                control={control}
                name="stno"
                render={({ field }) => (
                  <StkroomSelect
                    value={field.value}
                    allowEmpty={cfg.warehouse !== "required"}
                    onChange={(stno, stname) => {
                      field.onChange(stno)
                      setValue("stname", stname)
                    }}
                  />
                )}
              />
            </Field>
          )}
          <Field label={L("x3no")}>
            <Controller
              control={control}
              name="x3no"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_TYPES.map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field
            label={
              <span className="inline-flex items-center gap-1">
                <SwaggerLabelView>{L("rate")}</SwaggerLabelView>
                <span>(%)</span>
              </span>
            }
          >
            <Input type="number" step="any" {...register("rate")} />
          </Field>
          {cfg.hasEsdate && (
            <Field label={L("esdate")} required>
              <Input type="date" {...register("esdate")} />
            </Field>
          )}
          {cfg.hasSano && (
            <Field label={L("sano")}>
              <Input {...register("sano")} />
            </Field>
          )}
          {cfg.hasCuaddr && (
            <Field label={L("cuaddr")} className="lg:col-span-2">
              <Input {...register("cuaddr")} />
            </Field>
          )}
          <Field label={L("docmemo")} className="sm:col-span-2 lg:col-span-4">
            <Input {...register("docmemo")} />
          </Field>
          <Field label={L("docmemo1")} className="sm:col-span-2 lg:col-span-4">
            <Textarea rows={2} {...register("docmemo1")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">明細</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => lineArray.append(emptyLine())}>
            <PlusIcon />
            新增一列
          </Button>
        </CardHeader>
        <CardContent>
          <LinesEditor
            control={control}
            register={register}
            fields={lineArray.fields}
            computed={totals.lines}
            hasEsdate={!!cfg.hasEsdate}
            labelSchema={cfg.labelSchemas.line}
            itemLoading={itemLoading}
            disabledPick={!cfno}
            onPick={pickItem}
            onRemove={(i) => (lineArray.fields.length > 1 ? lineArray.remove(i) : lineArray.update(0, emptyLine()))}
          />
          {!cfno && <p className="mt-2 text-xs text-muted-foreground">請先選擇{partyLabel}，系統才能帶出對應價格。</p>}

          <div className="mt-4 flex flex-col-reverse items-end justify-between gap-4 sm:flex-row sm:items-start">
            {cfg.party === "customer" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!cfno}
                onClick={() => checkGrossProfit(getValues(), false)}
              >
                <CalculatorIcon />
                毛利率檢查
              </Button>
            ) : (
              <span />
            )}
            <div className="grid w-full max-w-xs gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <SwaggerLabelView>{L("taxmny")}</SwaggerLabelView>
                </span>
                <span className="tabular-nums">{fmtMoney(totals.taxmny)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <SwaggerLabelView>{L("tax")}</SwaggerLabelView>
                </span>
                <span className="tabular-nums">{fmtMoney(totals.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 text-base font-semibold">
                <span>
                  <SwaggerLabelView>{L("totmny")}</SwaggerLabelView>
                </span>
                <span className="tabular-nums">{fmtMoney(totals.totmny)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
          新增{cfg.title}
        </Button>
      </div>
    </form>
  )
}

function LinesEditor({
  control,
  register,
  fields,
  computed,
  hasEsdate,
  labelSchema,
  itemLoading,
  disabledPick,
  onPick,
  onRemove,
}: {
  control: Control<DocFormValues>
  register: UseFormRegister<DocFormValues>
  fields: { id: string }[]
  computed: { mny: number }[]
  hasEsdate: boolean
  labelSchema: string
  itemLoading: number | null
  disabledPick: boolean
  onPick: (index: number, itno: string | null) => void
  onRemove: (index: number) => void
}) {
  const lineL = useMemo(() => labelsOf(labelSchema), [labelSchema])
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8">#</TableHead>
            <TableHead className="min-w-56">
              <SwaggerLabelView>{lineL("itno")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="min-w-48">
              <SwaggerLabelView>{lineL("itname")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="w-20">
              <SwaggerLabelView>{lineL("itunit")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="w-24 text-right">
              <SwaggerLabelView>{lineL("qty")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="w-28 text-right">
              <SwaggerLabelView>{lineL("price")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="w-20 text-right">
              <SwaggerLabelView>{lineL("prs")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="w-28 text-right">
              <SwaggerLabelView>{lineL("mny")}</SwaggerLabelView>
            </TableHead>
            {hasEsdate && (
              <TableHead className="w-40">
                <SwaggerLabelView>{lineL("esdate")}</SwaggerLabelView>
              </TableHead>
            )}
            <TableHead className="min-w-40">
              <SwaggerLabelView>{lineL("memo")}</SwaggerLabelView>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((f, i) => (
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
                        disabled={disabledPick || itemLoading === i}
                        className="flex-1"
                        onSelect={(it) => onPick(i, it?.itno ?? null)}
                      />
                      {itemLoading === i && <Loader2Icon className="size-4 animate-spin" />}
                    </div>
                  )}
                />
                <ExemptBadge control={control} index={i} />
                <BomBadge control={control} index={i} />
              </TableCell>
              <TableCell>
                <Input {...register(`lines.${i}.itname`)} />
              </TableCell>
              <TableCell>
                <Input {...register(`lines.${i}.itunit`)} />
              </TableCell>
              <TableCell>
                <Input type="number" step="any" className="text-right" {...register(`lines.${i}.qty`)} />
              </TableCell>
              <TableCell>
                <Input type="number" step="any" className="text-right" {...register(`lines.${i}.price`)} />
              </TableCell>
              <TableCell>
                <Input type="number" step="any" className="text-right" {...register(`lines.${i}.prs`)} />
              </TableCell>
              <TableCell className="pt-3 text-right tabular-nums">{fmtMoney(computed[i]?.mny ?? 0)}</TableCell>
              {hasEsdate && (
                <TableCell>
                  <Input type="date" {...register(`lines.${i}.esdate`)} />
                </TableCell>
              )}
              <TableCell>
                <Input {...register(`lines.${i}.memo`)} />
              </TableCell>
              <TableCell>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => onRemove(i)} title="移除此列">
                  <Trash2Icon />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ExemptBadge({ control, index }: { control: Control<DocFormValues>; index: number }) {
  const kitax = useWatch({ control, name: `lines.${index}.kitax` })
  if (kitax == null || kitax === "") return null
  return (
    <Badge variant="outline" className="mt-1 mr-1">
      kitax={String(kitax)}
    </Badge>
  )
}

function BomBadge({ control, index }: { control: Control<DocFormValues>; index: number }) {
  const boms = useWatch({ control, name: `lines.${index}.boms` })
  if (!boms?.length) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="mt-1 cursor-default">
          含 {boms.length} 個子件
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {boms.map((b) => (
          <div key={`${b.bomrec}-${b.bomitno}`}>
            {b.bomitno} {b.bomitname} × {b.itqty} {b.bomitunit}
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}
