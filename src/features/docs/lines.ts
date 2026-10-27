import { api, unwrap, type Schemas } from "@/lib/api/client"
import { fromApiDate, toApiDate } from "@/lib/date"
import { toNumber } from "@/lib/format"

export type BomForm = {
  bomrec: string
  bomitno: string
  bomitname: string
  bomitunit: string
  itqty: number
  itpareprs: number
  bomitpkgqty: number
  itrec: number
  itprice: number
  itmny: number
  itnote: string
}

export type LineForm = {
  itno: string
  itname: string
  ittrait: number
  itunit: string
  qty: string
  itpkgqty: number
  price: string
  prs: string
  kitax: string
  memo: string
  detailBomrec: number
  desps: string[]
  /** YYYY-MM-DD，訂單用 */
  esdate: string
  boms: BomForm[]
}

export function emptyLine(): LineForm {
  return {
    itno: "",
    itname: "",
    ittrait: 0,
    itunit: "",
    qty: "1",
    itpkgqty: 0,
    price: "0",
    prs: "1",
    kitax: "",
    memo: "",
    detailBomrec: 0,
    desps: Array(10).fill(""),
    esdate: "",
    boms: [],
  }
}

function mapBom(b: Schemas["BaseDocBomDto"]): BomForm {
  return {
    bomrec: String(b.bomrec ?? ""),
    bomitno: b.bomitno ?? "",
    bomitname: b.bomitname ?? "",
    bomitunit: b.bomitunit ?? "",
    itqty: b.itqty ?? 0,
    itpareprs: b.itpareprs ?? 0,
    bomitpkgqty: b.bomitpkgqty ?? 0,
    itrec: b.itrec ?? 0,
    itprice: b.itprice ?? 0,
    itmny: b.itmny ?? 0,
    itnote: b.itnote ?? "",
  }
}

/** 以 /v1/Item/BaseItem 取得單據用的產品資料（含客戶/廠商價格與子件）。 */
export async function fetchLineFromItem(
  itno: string,
  opts: { cfno?: string; kind?: "sale" | "bshop" },
  base: LineForm = emptyLine(),
): Promise<LineForm> {
  const bean = await unwrap(
    api.GET("/v1/Item/BaseItem/{itno}", {
      params: { path: { itno }, query: { Cfno: opts.cfno || undefined, Kind: opts.kind } },
    }),
  )
  const price = bean.price || bean.itprice || 0
  return {
    ...base,
    itno: bean.itno ?? itno,
    itname: bean.itname ?? "",
    ittrait: bean.ittrait ?? 0,
    itunit: bean.itunit ?? "",
    itpkgqty: bean.itpkgqty ?? 0,
    price: String(price),
    prs: String(bean.prs || 1),
    kitax: bean.kitax ?? "",
    detailBomrec: bean.detailBomrec ?? 0,
    desps: Array.from({ length: 10 }, (_, i) => (bean[`itdesp${i + 1}` as keyof typeof bean] as string) ?? ""),
    esdate: fromApiDate(bean.esdate) ?? base.esdate,
    boms: (bean.bomlist ?? []).map(mapBom),
  }
}

export function despsToFields(desps: string[]) {
  return Object.fromEntries(desps.map((d, i) => [`itdesp${i + 1}`, d || undefined]))
}

/** 轉成各單據 Add*DetailRequest 共用的欄位。 */
export function lineToRequest(
  l: LineForm,
  computed: { taxprice: number; mny: number },
  bomsKey: string,
  opts: { esdate?: boolean } = {},
) {
  return {
    itno: l.itno,
    itname: l.itname,
    ittrait: l.ittrait,
    itunit: l.itunit,
    qty: toNumber(l.qty),
    itpkgqty: l.itpkgqty,
    price: toNumber(l.price),
    taxprice: computed.taxprice,
    mny: computed.mny,
    prs: toNumber(l.prs, 1) || 1,
    kitax: l.kitax || undefined,
    memo: l.memo || undefined,
    detailBomrec: l.detailBomrec,
    ...despsToFields(l.desps),
    ...(opts.esdate ? { esdate: toApiDate(l.esdate) } : {}),
    [bomsKey]: l.boms,
  }
}
