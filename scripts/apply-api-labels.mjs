/**
 * One-off helper: print apiLabel for keys. Edits are done in source files.
 * Also validates that importing JSON works under the same rules as api-label.ts.
 */
import props from "../src/lib/swagger-prop-descriptions.json" with { type: "json" }

function strip(s) {
  return s.replace(/。$/u, "").trim()
}
function canon(s) {
  return strip(s).replace(/\s+/g, "")
}
function apiLabel(key) {
  const list = props[key]
  if (!list?.length) return key
  const byCanon = new Map()
  for (const raw of list) {
    const c = canon(raw)
    if (!c) continue
    if (!byCanon.has(c)) byCanon.set(c, strip(raw))
  }
  if (byCanon.size === 1) return [...byCanon.values()][0]
  return key
}

const ambiguous = Object.keys(props)
  .map((k) => [k, apiLabel(k)])
  .filter(([k, v]) => v === k && props[k].length > 1)
console.log("ambiguous (will show key):", ambiguous.length)
for (const [k, ,] of ambiguous.slice(0, 40)) console.log(" ", k, "←", props[k])
