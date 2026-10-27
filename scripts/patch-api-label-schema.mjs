import fs from "fs"

function insertAfterImports(src, linesToInsert) {
  const lines = src.split("\n")
  let lastImport = 0
  for (let i = 0; i < lines.length; i++) {
    if (/^import /.test(lines[i])) lastImport = i
  }
  lines.splice(lastImport + 1, 0, "", ...linesToInsert)
  return lines.join("\n")
}

function switchImport(src) {
  return src.replace(
    /import \{ apiLabel \} from "@\/lib\/api-label"/,
    'import { labelsOf } from "@/lib/api-label"',
  )
}

function replaceCalls(src, fn = "L") {
  return src.replace(/apiLabel\((['"])([^'"]+)\1\)/g, `${fn}($1$2$1)`)
}

function patchSimple(file, schema) {
  let t = fs.readFileSync(file, "utf8")
  if (!t.includes("apiLabel(") && !t.includes('apiLabel(')) {
    // may already be patched
  }
  if (!t.includes("apiLabel")) {
    console.log("skip (no apiLabel)", file)
    return
  }
  t = switchImport(t)
  if (!t.includes(`labelsOf("${schema}")`)) {
    t = insertAfterImports(t, [`const L = labelsOf("${schema}")`])
  }
  t = replaceCalls(t, "L")
  // money helper: header: apiLabel(String(key)) 
  t = t.replace(/apiLabel\(String\(key\)\)/g, "L(String(key))")
  fs.writeFileSync(file, t)
  console.log("ok", file, "→", schema)
}

const simple = [
  ["src/app/(dashboard)/customers/page.tsx", "CustListDto"],
  ["src/app/(dashboard)/factories/page.tsx", "FactListDto"],
  ["src/app/(dashboard)/items/page.tsx", "ItemListDto"],
  ["src/app/(dashboard)/stkrooms/page.tsx", "GetStkroomListDto"],
  ["src/app/(dashboard)/permissions/page.tsx", "PermissionDto"],
  ["src/app/(dashboard)/plugins/page.tsx", "PluginDto"],
  ["src/app/(dashboard)/customers/[cuno]/page.tsx", "CustDetailDto"],
  ["src/app/(dashboard)/factories/[fano]/page.tsx", "FactDetailDto"],
  ["src/app/(dashboard)/docs/[kind]/page.tsx", "DocListDto"],
  ["src/features/docs/doc-lines-view.tsx", "SaleDetailDto"],
  ["src/components/history-table.tsx", "CustDocDto"],
  ["src/app/(dashboard)/docs/[kind]/[docno]/page.tsx", "SaleDto"],
  ["src/features/docs/doc-form.tsx", "AddSaleRequest"],
]

for (const [f, s] of simple) patchSimple(f, s)

// items detail
{
  const file = "src/app/(dashboard)/items/[itno]/page.tsx"
  let t = fs.readFileSync(file, "utf8")
  t = switchImport(t)
  if (!t.includes('labelsOf("ItemDetailDto")')) {
    t = insertAfterImports(t, [
      'const L = labelsOf("ItemDetailDto")',
      'const stockL = labelsOf("StockBean")',
    ])
  }
  t = replaceCalls(t, "L")
  t = t.replace(/apiLabel\(String\(key\)\)/g, "L(String(key))")
  for (const k of ["stno", "stname", "itqytf", "itqyt"]) {
    t = t.replaceAll(`header: L("${k}")`, `header: stockL("${k}")`)
  }
  fs.writeFileSync(file, t)
  console.log("ok", file)
}

// payments dates
{
  const file = "src/app/(dashboard)/payments/dates/page.tsx"
  let t = fs.readFileSync(file, "utf8")
  t = switchImport(t)
  if (!t.includes('labelsOf("CustReceive")')) {
    t = insertAfterImports(t, [
      'const rowL = labelsOf("CustReceive")',
      'const sumL = labelsOf("GetDatePaymentDto")',
    ])
  }
  t = t.replace(/apiLabel\(String\(key\)\)/g, "rowL(String(key))")
  const sumKeys = new Set([
    "writeOffTotalNumber",
    "cashTotalMoney",
    "cardTotalMoney",
    "checkTotalMoney",
    "remitTotalMoney",
    "ticketTotalMoney",
    "otherTotalMoney",
    "discountTotalMoney",
    "getPreAccTotal",
    "addPreAccTotal",
    "useTotalMoney",
    "writeOffTotalMoney",
  ])
  t = t.replace(/apiLabel\((['"])([^'"]+)\1\)/g, (_, q, k) =>
    sumKeys.has(k) ? `sumL(${q}${k}${q})` : `rowL(${q}${k}${q})`,
  )
  fs.writeFileSync(file, t)
  console.log("ok", file)
}

// payments employees
{
  const file = "src/app/(dashboard)/payments/employees/page.tsx"
  let t = fs.readFileSync(file, "utf8")
  t = switchImport(t)
  if (!t.includes('labelsOf("CustPayment")')) {
    t = insertAfterImports(t, [
      'const rowL = labelsOf("CustPayment")',
      'const sumL = labelsOf("GetEmplPaymentDto")',
    ])
  }
  t = t.replace(/apiLabel\(String\(key\)\)/g, "rowL(String(key))")
  const rowKeys = new Set(["cuno", "cuname1", "transactionNumber", "cuSpareRcv", "taxmny", "tax", "totmny", "discount", "receivedandadvance", "acctmny"])
  // columns use row fields; summary DetailGrid + Field filters use sumL for emno/emname/transactionNumberAll
  // Actually CustPayment has taxmny etc; GetEmplPaymentDto has summary. Columns = rowL, detail summary + form em = sumL
  t = t.replace(/apiLabel\((['"])([^'"]+)\1\)/g, (_, q, k) => {
    if (k === "emno" || k === "emname" || k === "transactionNumberAll") return `sumL(${q}${k}${q})`
    return `rowL(${q}${k}${q})`
  })
  fs.writeFileSync(file, t)
  console.log("ok", file)
}

// receivable-view
{
  const file = "src/features/payments/receivable-view.tsx"
  let t = fs.readFileSync(file, "utf8")
  t = switchImport(t)
  if (!t.includes('labelsOf("DocumentDetail")')) {
    t = insertAfterImports(t, [
      'const rowL = labelsOf("DocumentDetail")',
      'const sumL = labelsOf("GetCustOrFactPaymentReceivableDto")',
    ])
  }
  t = t.replace(/apiLabel\(String\(key\)\)/g, "rowL(String(key))")
  t = t.replace(/apiLabel\((['"])([^'"]+)\1\)/g, (_, q, k) => {
    if (k === "spname" || k === "totalMoney" || k === "cfno" || k === "cfname1") return `sumL(${q}${k}${q})`
    return `rowL(${q}${k}${q})`
  })
  fs.writeFileSync(file, t)
  console.log("ok", file)
}

// leftover check
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`
    if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".next") walk(p, acc)
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p)
  }
  return acc
}
const left = []
for (const f of walk("src")) {
  const t = fs.readFileSync(f, "utf8")
  if (/apiLabel\s*\(/.test(t) && !f.includes("api-label.ts")) left.push(f)
}
console.log("remaining apiLabel calls:", left)
