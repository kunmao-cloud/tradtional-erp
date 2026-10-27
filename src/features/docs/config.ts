import { api, unwrap, unwrapResult, type Schemas } from "@/lib/api/client"
import { apiLabel } from "@/lib/api-label"

export type DocKind = "quote" | "order" | "sale" | "rsale" | "fquot" | "ford" | "shop" | "rshop"

/** 各單據對應的 OpenAPI schema 名稱（標籤用，勿跨 schema 混用）。 */
export type DocLabelSchemas = {
  /** 明細／GET 回傳表頭，如 SaleDto */
  header: string
  /** 新增 request，如 AddSaleRequest */
  add: string
  /** 明細列，如 SaleDetailDto */
  line: string
}

export type DocListQuery = { StartDate?: string; EndDate?: string; Cfno?: string; Emno?: string }

export type DocBom = Schemas["BaseDocBomDto"]

export type DocDetailLine = Schemas["BaseDocDetailRequest"] & {
  esdate?: string | null
  qtynotout?: number
  qtynotinstk?: number
  qtynotin?: number
  [bomsKey: string]: unknown
}

/** 各單據明細 DTO 的共同欄位。 */
export type DocDetail = {
  docno?: string | null
  docdate?: string | null
  cfno?: string | null
  cfname1?: string | null
  cftel1?: string | null
  cfper1?: string | null
  emno?: string | null
  emname?: string | null
  taxmny?: number
  totmny?: number
  x3no?: number
  rate?: number
  tax?: number
  docmemo?: string | null
  docmemo1?: string | null
  stno?: string | null
  stname?: string | null
  ischeck?: string | null
  qupayment?: string | null
  fqpayment?: string | null
  fooverflag?: boolean
  [key: string]: unknown
}

export type ExtraColumn = { key: string; label: string; type: "number" | "text" }

function extraCols(lineSchema: string, keys: { key: string; type: "number" | "text" }[]): ExtraColumn[] {
  return keys.map(({ key, type }) => ({ key, type, label: apiLabel(lineSchema, key) }))
}

export type DocConfig = {
  kind: DocKind
  title: string
  party: "customer" | "factory"
  permission: string[]
  detailsKey: string
  bomsKey: string
  labelSchemas: DocLabelSchemas
  /** 表頭是否有倉庫欄位，required 表示必填。 */
  warehouse?: "optional" | "required"
  /** 訂單：表頭與明細都有交貨日期。 */
  hasEsdate?: boolean
  /** 銷退：可填原銷貨單號。 */
  hasSano?: boolean
  /** 銷貨：送出時帶客戶地址。 */
  hasCuaddr?: boolean
  /** 新增時是否必須至少一筆明細。 */
  requireLines?: boolean
  /** /v1/Item/BaseItem 的 Kind 參數。 */
  itemKind: "sale" | "bshop"
  /** /v1/Report 的 Source 參數。 */
  reportSource: string
  extraDetailColumns?: ExtraColumn[]
  list: (q: DocListQuery) => Promise<Schemas["DocListDto"][]>
  get: (docno: string) => Promise<DocDetail>
  create: (body: Record<string, unknown>) => Promise<{ message: string; data: unknown }>
}

export const DOC_CONFIGS: Record<DocKind, DocConfig> = {
  quote: {
    kind: "quote",
    title: "報價單",
    party: "customer",
    permission: ["客戶報價管理作業"],
    detailsKey: "quotedetails",
    bomsKey: "quoteboms",
    labelSchemas: { header: "QuoteDto", add: "AddQuoteRequest", line: "QuoteDetailDto" },
    itemKind: "sale",
    reportSource: "quote",
    list: (q) => unwrap(api.GET("/v1/Quote", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/Quote/{quno}", { params: { path: { quno: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/Quote", { body: b as Schemas["AddQuoteRequest"] })),
  },
  order: {
    kind: "order",
    title: "訂單",
    party: "customer",
    permission: ["客戶訂單管理作業"],
    detailsKey: "orderdetails",
    bomsKey: "orderboms",
    labelSchemas: { header: "OrderDto", add: "AddOrderRequest", line: "OrderDetailDto" },
    hasEsdate: true,
    requireLines: true,
    itemKind: "sale",
    reportSource: "order",
    extraDetailColumns: extraCols("OrderDetailDto", [
      { key: "esdate", type: "text" },
      { key: "qtynotout", type: "number" },
      { key: "qtynotinstk", type: "number" },
    ]),
    list: (q) => unwrap(api.GET("/v1/Order", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/Order/{orno}", { params: { path: { orno: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/Order", { body: b as Schemas["AddOrderRequest"] })),
  },
  sale: {
    kind: "sale",
    title: "銷貨單",
    party: "customer",
    permission: ["銷貨作業系統"],
    detailsKey: "saledetails",
    bomsKey: "saleboms",
    labelSchemas: { header: "SaleDto", add: "AddSaleRequest", line: "SaleDetailDto" },
    warehouse: "optional",
    hasCuaddr: true,
    requireLines: true,
    itemKind: "sale",
    reportSource: "sale",
    list: (q) => unwrap(api.GET("/v1/Sale", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/Sale/{sano}", { params: { path: { sano: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/Sale", { body: b as Schemas["AddSaleRequest"] })),
  },
  rsale: {
    kind: "rsale",
    title: "銷退單",
    party: "customer",
    permission: ["銷貨退回作業"],
    detailsKey: "rSaledetails",
    bomsKey: "rSaleboms",
    labelSchemas: { header: "RSaleDto", add: "AddRSaleRequest", line: "RSaleDetailDto" },
    warehouse: "required",
    hasSano: true,
    itemKind: "sale",
    reportSource: "rsale",
    list: (q) => unwrap(api.GET("/v1/RSale", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/RSale/{sano}", { params: { path: { sano: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/RSale", { body: b as Schemas["AddRSaleRequest"] })),
  },
  fquot: {
    kind: "fquot",
    title: "詢價單",
    party: "factory",
    permission: ["廠商詢價管理作業"],
    detailsKey: "fquotdetails",
    bomsKey: "fquotboms",
    labelSchemas: { header: "FquotDto", add: "AddFquotRequest", line: "FquotDetailDto" },
    itemKind: "bshop",
    reportSource: "fquot",
    list: (q) => unwrap(api.GET("/v1/Fquot", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/Fquot/{fqno}", { params: { path: { fqno: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/Fquot", { body: b as Schemas["AddFquotRequest"] })),
  },
  ford: {
    kind: "ford",
    title: "採購單",
    party: "factory",
    permission: ["廠商採購管理作業"],
    detailsKey: "forddetails",
    bomsKey: "fordboms",
    labelSchemas: { header: "FordDto", add: "AddFordRequest", line: "FordDetailDto" },
    requireLines: true,
    itemKind: "bshop",
    reportSource: "ford",
    extraDetailColumns: extraCols("FordDetailDto", [
      { key: "esdate", type: "text" },
      { key: "qtynotin", type: "number" },
    ]),
    list: (q) => unwrap(api.GET("/v1/Ford", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/Ford/{fono}", { params: { path: { fono: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/Ford", { body: b as Schemas["AddFordRequest"] })),
  },
  shop: {
    kind: "shop",
    title: "進貨單",
    party: "factory",
    permission: ["進貨作業系統"],
    detailsKey: "bshopdetails",
    bomsKey: "bshopboms",
    labelSchemas: { header: "BshopDto", add: "AddBshopRequest", line: "BshopDetailDto" },
    warehouse: "optional",
    itemKind: "bshop",
    reportSource: "bshop",
    list: (q) => unwrap(api.GET("/v1/Shop", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/Shop/{bsno}", { params: { path: { bsno: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/Shop", { body: b as Schemas["AddBshopRequest"] })),
  },
  rshop: {
    kind: "rshop",
    title: "進退單",
    party: "factory",
    permission: ["進貨退出作業"],
    detailsKey: "rshopdetails",
    bomsKey: "rshopboms",
    labelSchemas: { header: "RShopDto", add: "AddRShopRequest", line: "RShopDetailDto" },
    warehouse: "optional",
    itemKind: "bshop",
    reportSource: "rshop",
    list: (q) => unwrap(api.GET("/v1/RShop", { params: { query: q } })),
    get: (no) => unwrap(api.GET("/v1/RShop/{bsno}", { params: { path: { bsno: no } } })) as Promise<DocDetail>,
    create: (b) => unwrapResult(api.POST("/v1/RShop", { body: b as Schemas["AddRShopRequest"] })),
  },
}

export function getDocConfig(kind: string): DocConfig | undefined {
  return (DOC_CONFIGS as Record<string, DocConfig>)[kind]
}
