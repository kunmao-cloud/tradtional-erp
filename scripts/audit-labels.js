const fs = require("fs")
const path = require("path")

const props = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../docs/swagger-prop-descriptions.json"), "utf8"),
)
const params = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../docs/swagger-param-descriptions.json"), "utf8"),
)

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue
      walk(p, acc)
    } else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith(".d.ts")) acc.push(p)
  }
  return acc
}

const root = path.join(__dirname, "../src")
const files = walk(root)
const findings = []

/** @type {{re: RegExp, key: number, label: number}[]} */
const patterns = [
  { re: /accessorKey:\s*["'](\w+)["']\s*,\s*header:\s*["']([^"']*)["']/g, key: 1, label: 2 },
  { re: /name:\s*["'](\w+)["']\s*,\s*label:\s*["']([^"']*)["']/g, key: 1, label: 2 },
  { re: /key:\s*["'](\w+)["']\s*,\s*label:\s*["']([^"']*)["']/g, key: 1, label: 2 },
  { re: /money\(\s*["'](\w+)["']\s*,\s*["']([^"']*)["']\s*\)/g, key: 1, label: 2 },
  {
    re: /\{\s*label:\s*["']([^"']+)["']\s*,\s*value:[^\n}]*?\b(?:data|d|it|c|f|row)\.(\w+)/g,
    key: 2,
    label: 1,
  },
]

function classify(key, label) {
  const descs = props[key] || params[key] || []
  if (!descs.length) return { status: "NO_SWAGGER", descs }
  if (descs.includes(label)) return { status: "EXACT", descs }
  const close = descs.some((d) => d.includes(label) || label.includes(d))
  if (close) return { status: "CLOSE", descs }
  return { status: "MISMATCH", descs }
}

for (const file of files) {
  const text = fs.readFileSync(file, "utf8")
  const rel = path.relative(root, file).replace(/\\/g, "/")
  for (const { re, key: ki, label: li } of patterns) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const key = m[ki]
      const label = m[li]
      if (!label || !key) continue
      const c = classify(key, label)
      if (c.status !== "EXACT") findings.push({ file: rel, key, label, ...c })
    }
  }
}

const byStatus = {}
for (const f of findings) byStatus[f.status] = (byStatus[f.status] || 0) + 1
console.log("counts", byStatus)

for (const status of ["NO_SWAGGER", "MISMATCH", "CLOSE"]) {
  console.log(`\n--- ${status} ---`)
  for (const f of findings.filter((x) => x.status === status)) {
    console.log(
      `${f.file} | ${f.key} | UI=${JSON.stringify(f.label)} | swagger=${JSON.stringify(f.descs)}`,
    )
  }
}

fs.writeFileSync(path.join(__dirname, "../docs/label-audit.json"), JSON.stringify(findings, null, 2))
