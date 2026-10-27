# API／Swagger 觀察紀錄

前端接 `NEW_JS_API`（`openapi.json`）時，用**測試庫真實資料**打到、且**目前仍缺或需修**的項目。  
給後端補 Swagger／修 API；**不是**正式規格，也**不是**要後端照前端猜測改業務邏輯。

| | |
|---|---|
| 環境 | 測試庫、帳號 BM（2026-10） |
| 樣本 | 銷貨 `202609180001`／`202609180002`、客戶 `000`、產品 `000`／`0000` |
| 最近複核 | 2026-10-27（已對過現行 `openapi.json`） |

| 標記 | 意思 |
|---|---|
| `verified` | 已用真實請求複核，可當補文件／修 API 依據 |
| `inferred` | 樣本少，可能不完整 |
| `guess` | 證據不足，**勿直接寫進正式 swagger** |
| `bug` | 行為不合理或與文件不符 |

**建議範圍**：Swagger、API 契約、錯誤碼、JSON 序列化。  
**不含**：改既有資料表欄位型別或遷移歷史存放格式。

---

## 請先處理

1. **日期**：文件寫清接受／回傳格式；無法解析勿靜默回空陣列（或文件明寫）
2. **`rate`**：寫明小數單位（`0.05` = 5%）
3. **`kitax`／`x3no`**：description 寫清各代碼意義（名稱請後端定；維持現有型別）
4. **`/v1/Report`**：`Header`／`Footer`／`Cuno` 標 required、`Source` 合法值、成功標 PDF、錯誤格式
5. **新增成功**：`data` 帶回單號（或清楚 schema）
6. **錯誤 envelope**：`message` 勿再包一層 JSON 字串
7. **`bomrec`**：新增 `string`／查詢 `integer` → 文件或序列化對齊
8. **`GET /v1/Item` 空查 500**、**`GET /v1/Fquot` 500**（html）
9. **`SaleReport`**：補 response schema
10. **權限**：`taname` 說明／旗標真值表
11. （可選）列表漏掉西元 `docdate` 單據 → 查篩選邏輯

---

## 一、Swagger／契約缺漏

### 日期　`verified`

- 單據 `docdate` 回傳會混用：`20260918`（西元八碼）與 `1150918`（民國八碼）。是 API 回的，不是前端轉的。
- 查詢 `StartDate`／`EndDate`：`20260901` 與 `1150901` 皆可查；`2026/09/01`、`2026-09-01` → **200 + 空陣列**（不 400）。
- 產品進銷日樣本多為民國八碼；歷史交易日期樣本為 `YYYY/MM/DD`（含斜線）。swagger 皆未標格式。

**建議**：分別標註各欄位常見格式與查詢可接受格式。無效輸入建議 400，或文件寫「無法解析＝空結果」。不要求改庫存格式。

**異常（B9，`inferred`）——單筆有、列表沒有**  
同一張銷貨 `202609180002`：用單號 `GET` 找得到（回傳 `docdate=20260918` 西元），但用 9 月的 `StartDate`／`EndDate` 查列表（西元或民國區間都試過）**都不會出現**；同月另一張 `202609180001`（`docdate` 民國）卻會出現在列表。  
→ 請後端查：列表的日期篩選為何漏掉這張（例如字串比對只對到某一種日期寫法）。**不是**要改資料表欄位。

---

### 稅率 `rate`　`verified`

swagger 僅「稅率」。銷貨 `202609180002` 為 **`0.05`（= 5%）**。  
→ 寫明「小數，0.05 代表 5%」，加 `example: 0.05`。

---

### 明細 `kitax`　`verified`（正式名稱仍 `inferred`）

swagger 僅「應稅/免稅」。同張銷貨、`x3no=1`、`rate=0.05`：

| itno | kitax | mny |
|---|---|---|
| `000` | `"2"` | 400 |
| `0000` | `"1"` | 900 |

`taxmny=1300`，`tax=45`（= 900×0.05），`totmny=1345` → **`"2"` 不計營業稅**已 verified。  
→ description 列出各代碼意義（正式名稱請後端定）。維持現有型別。

---

### 稅別 `x3no`　`guess`（名稱／公式）

swagger 僅「稅別編號」，無各代碼意義。前端暫用 1～4；`2` 內含算法為 **guess**。  
→ 請後端提供各代碼名稱與計稅公式，寫進 description。

---

### 列印 `/v1/Report`　`verified`

| 項目 | swagger 現況 | 實際 | 建議 |
|---|---|---|---|
| `Header`／`Footer` | `required: false` | 空白 → 400 | 標 `required` |
| `Cuno` | `required: false`，desc「客戶編號」 | 空白 → 400 | 標 `required`；語意是否含廠商請確認 |
| 成功 200 | `ApiResponse` | `Content-Type: application/pdf` | 標 PDF／binary |
| 錯誤 `message` | — | 常為內層 JSON 字串 | 統一 envelope |
| `Source` | 僅「來源」 | 見下 | description 列合法值 |

**`Source` 測試**（固定銷貨單號、有帶 Cuno）：

| Source | 結果 |
|---|---|
| `sale`／`Sale` | 200 PDF（大小寫不敏感） |
| `order` | 200 PDF（用銷貨單號仍出 PDF，未深究） |
| `quote`／`rsale`／`ford`／`bshop`／`rshop` | 500「查無○資料」→ 類型有支援 |
| `shop`／`fquot`／`quot`／`xxx` | 500「不支援的報表類型」 |

請後端提供正式清單。

---

### 新增成功回傳　`verified`（接線期；本次未重做新增）

`POST /v1/Sale` 等 swagger 200 僅 `ApiResponse`；實測曾回 `data`＝「新增成功」字串、**無單號**。  
→ `data` 帶回單號，或文件寫清實際 schema。

---

### 產品列表 `/v1/Item`　`verified`

| 請求 | 結果 |
|---|---|
| 無參數 | **500**「取得清單失敗」 |
| `?Itno=string` | 200，`data: []` |
| `?SearchText=餅乾` | 200，有資料 |

→ 註明「至少一個查詢條件」，或支援空查／分頁；空查勿 500。

---

### 產品帶價 `BaseItem`　`verified`

- `price` 與 `itprice` 的 description **都是「售價」**；樣本 `Cfno=000`、`Kind=sale`、`itno=000`：`price:0`，`itprice:20` → 請寫清差別與優先順序。
- 回傳子件鍵名為 **`bomlist`**，各單據新增為 `saleboms` 等 → 請對照寫清。
- `bomrec`：Dto／查詢為 **integer**，`Add*BomRequest` 為 **string** → 文件或序列化對齊（非改資料表）。

---

### Item 歷史 `source`　`verified`（文件）

`GET /v1/Item/Document/{itno}` 的 `source` **沒有** description。  
（Cust 同參數已有「可使用 sale、quote、order、finish」——Item 缺這段。）

---

### 銷售報表 `/v1/SaleReport`　`verified`

200 僅 `ApiResponse`。客戶報表 Type=0 樣本 `data` 實際含：`saleTotalMoney`、`rSaleTotalMoney`、`saleTotalNetAmount`、`saleTotalCost`、`saleTotalGrossProfit`、`saleTotalGrossMargin`、`custAndEmplSaleList` 等。  
→ 補完整 response schema 與欄位說明。

---

### 權限　`verified`（真值表不全）

- `taname` 僅「功能名稱」；實際為完整中文功能名，需精確比對。
- `search`／`append`／`modify` 本帳皆見 **`"V"`**；合法真／假值未文件化。

---

### 文件用詞（附帶）

- `itnoudf`：自定／自訂並存
- `ticketTotalMoney`：「禮券總稅額」
- `transactionNumberAll`：「交易總比數」

---

## 二、API 行為問題

| ID | 狀態 | 現象 | 建議 |
|---|---|---|---|
| B1 | `verified` | 日期斜線／連字號 → 200 空陣列 | 改 400，或文件寫「無法解析＝空」 |
| B2 | `verified` | 新增成功無單號 | 回應帶回單號 |
| B3 | `inferred` | 失敗常只回「新增○失敗」 | 錯誤加欄位級細節 |
| B4 | `verified` | `GET /v1/Fquot` → 500、空 body、`text/html` | 修 API；錯誤回 JSON |
| B5 | `verified` | `bomrec` integer vs string | 文件／序列化對齊 |
| B6 | 未複核 | 免稅＋應稅合併新增 Sale 曾 500 | 後端重現後再定；未複核前可略 |
| B7 | `verified` | `message` 內層 JSON 字串 | 統一 envelope |
| B8 | `verified` | SaleReport 結構未進 swagger | 補 schema |
| B9 | `inferred` | `202609180002` 單筆 GET 得到、9 月列表沒有 | 查列表日期篩選為何漏單 |

---

## 三、尚缺後端確認（勿當正式文案）

| 主題 | 現況 | 要請後端 |
|---|---|---|
| `kitax` 正式名稱 | `"2"` 不計稅已 verified | 全部值與正式名稱 |
| `x3no` | 無代碼說明 | 名稱與計稅公式 |
| `ischeck` | 見過 `"0"` | 合法值與語意 |
| 權限旗標 | 本帳見 `"V"` | 完整真／假值表 |
| 毛利率自動檢查 | 前端暫以 plname 含「毛利」**guess** | 觸發條件 |
| 轉單權限 `taname` | **guess** | 正確名稱 |
| 倉庫是否必填 | 銷退 required 等為前端假設 **guess** | 各單據規則 |

---

## 四、前端對照（內部）

| 主題 | 位置 |
|---|---|
| 日期轉換 | `src/lib/date.ts` |
| 欄位標籤 | `src/lib/api-label.ts`（依單一 schema，不跨 schema 合併） |
| 稅額 | `src/features/docs/calc.ts` |
| 列印 | `src/features/docs/print.ts` |
| 權限 | `src/hooks/use-permissions.ts`、`src/lib/nav.ts` |

---

## 變更紀錄

| 日期 | 說明 |
|---|---|
| 2026-10-27 | 初版與複核；之後重排、釐清不以改資料表為前提 |
| 2026-10-27 | **刪除不需改的項目**（如倉庫鍵名已與 swagger 一致、已寫清楚的風格參考等）；僅保留現行缺漏／需修項 |
