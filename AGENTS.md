<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 本專案目的（demo）

此 admin demo 的主要目的是**對照、找出 swagger／API 缺漏與行為問題**，不是做出「看起來完整」的正式產品 UI。

### 硬規則

1. **Swagger／OpenAPI 沒寫清楚的東西，不要擅自補進畫面或程式當正式定義。**
   - 包含：欄位中文名、enum 意義、代碼對照、預設業務規則、回傳結構欄位翻譯等。
2. **缺漏請記在 `docs/swagger-observations.md`**（標 `verified`／`inferred`／`guess`／`bug`），不要用「自己編的對照表」假裝文件已齊。
3. **畫面標籤依當下 OpenAPI schema 的 description**（`apiLabel(schema, key)`）；該 schema 沒寫才顯示 API key。不要跨 schema 合併同名欄位後自行「裁決」。
4. 為了能操作而暫時需要的假設（例如稅別選項），必須在程式註解與 `swagger-observations.md` 標成 **guess／inferred**，且不得當成已確認規格。
