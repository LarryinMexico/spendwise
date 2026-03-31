# AI Finance Dashboard (SpendWise)

[English](./README.md) | [繁體中文](./README.zh-TW.md)

**Live Demo: [https://spendwise-gilt.vercel.app/dashboard](https://spendwise-gilt.vercel.app/dashboard)**

個人理財儀表板，幫助你追蹤消費、AI 自動分類、以自然語言查詢財務數據。

## 功能

### 1. CSV 上傳與解析
- **智慧欄位對應**：自動偵測並對應常見的欄位名稱，如「交易日期」、「摘要」、「支出」、「存入」，能相容多數銀行（如玉山、國泰、中信）的 CSV 格式。
- 拖放上傳介面
- 批次匯入，支援單次多筆交易
- 上傳記錄管理，可檢視與刪除歷史批次

### 2. AI 自動分類
- 使用 Groq API (Llama 3.3 70B) 智慧分類交易
- 10+ 消費類別：餐飲、交通、購物、娛樂、醫療、教育、居住、薪資/收入、轉帳、其他
- 批量處理，每批最多 20 筆（避免 API rate limit）

### 3. 自然語言查詢 (Text-to-SQL)
- 輸入：「這個月餐飲花了多少？」
- AI 將自然語言轉換為 SQL 查詢
- 三層安全防護：Prompt 限制，白名單驗證、參數化查詢

### 4. 消費趨勢分析
- 月度收支柱狀圖
- 類別佔比圓餅圖
- 行為洞察：
  - 每週消費模式分析
  - 異常交易偵測（2 標準差）
  - 趨勢判斷（上升/下降/穩定）

### 5. 消費模擬器
- 選擇消費類別，調整支出比例（-80% ~ +50%）
- 即時計算 1/3/6/9/12 個月的預測
- 視覺化折線圖對比：目前 vs 調整後趨勢
- AI 生成財務建議

### 6. 消費決策助手
- 側邊欄即時輸入：「我想買 iPhone 16」
- AI 根據真實財務數據分析：
  - 月收入、支出、餘額
  - 該類別歷史平均
- 提供購買/延後/不購買建議

## 技術架構

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **UI 元件庫**: Shadcn UI
- **圖表**: Recharts
- **認證**: Clerk
- **資料庫**: Supabase (PostgreSQL)
- **ORM**: Drizzle
- **AI**: Groq API (Llama 3.3 70B)
- **部署**: Vercel

## 本地開發

### 前置需求
- Node.js 18+
- npm / yarn / pnpm / bun
- Supabase 帳號
- Clerk 帳號
- Groq API Key

### 1. Clone 並安裝

```bash
git clone <your-repo-url>
cd ai-finance-dashboard
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env.local
```

編輯 `.env.local`：

| 變數 | 說明 | 取得方式 |
|------|------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk 公開金鑰 | [Clerk Dashboard](https://clerk.com) - API Keys |
| `CLERK_SECRET_KEY` | Clerk 私密金鑰 | [Clerk Dashboard](https://clerk.com) - API Keys |
| `DATABASE_URL` | Supabase PostgreSQL 連線字串 | [Supabase Dashboard](https://supabase.com) - Settings - Database |
| `GROQ_API_KEY` | Groq API 金鑰 | [Groq Console](https://console.groq.com) - API Keys |
| `NEXT_PUBLIC_APP_URL` | 應用程式網址（本地為 `http://localhost:3000`） | - |

### 3. 設定 Supabase

1. 在 Supabase 建立新專案
2. 取得 `DATABASE_URL` 連線字串
3. 執行資料庫遷移：
   ```bash
   npm run db:migrate
   ```
4. 或手動在 Supabase SQL Editor 執行 `drizzle/` 目錄下的 SQL 檔案：
   - `0001_enable_rls.sql` - 啟用 RLS
   - `0002_create_uploads_table.sql` - 建立上傳記錄表

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟 http://localhost:3000

## 快速體驗與測試指南

為了讓你能無縫體驗 SpendWise 的強大 AI 分析與圖表功能，專案內已經內建了長達半年的金融測試數據。

**如何使用測試資料：**

1. 啟動並登入本地伺服器後，點擊側邊欄進入 **Upload (上傳)** 頁面。
2. 開啟本機專案內的 `public/` 資料夾，裡面有為你準備好的 CSV 測試檔：
   - `sample-transactions.csv` (綜合交易範例)
   - `sample-transactions-2025-10.csv` 至 `sample-transactions-2026-02.csv` (連續多月的時間序列模擬，能完美呈現走勢圖)
3. 將這些 `.csv` 檔案拖曳到上傳區塊完成匯入。
4. 點擊右上角的 **AI Categorize (AI 自動分類)** 按鈕，感受大語言模型如何極速且精準地為你的花費貼上標籤。
5. 接著就可以前往 **Dashboard**, **Analytics**, 還有 **Simulator** 頁面，觀看精美的數據圖表以及專屬你的 AI 財務長洞察報告！

## 使用 Docker 運行

本專案支援使用 Docker 進行容器化部署，確保環境一致性。

### 1. 建置 Docker Image

```bash
docker build -t spendwise-app .
```

### 2. 運行 Docker Container

```bash
docker run -p 3000:3000 \
  --env-file .env.local \
  spendwise-app
```

注意：`--env-file` 會將你本地的 `.env.local` 檔案中的所有環境變數傳入容器中。請確保該檔案已設定妥當。

## 部署到 Vercel

### 1. 推送程式碼到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. 在 Vercel 部署

1. 前往 [Vercel Dashboard](https://vercel.com)
2. 點擊「Add New Project」
3. 選擇你的 GitHub 專案
4. 設定環境變數（與本地相同）

### 3. 設定環境變數

在 Vercel 專案 Settings - Environment Variables 加入：

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_xxx` | All |
| `CLERK_SECRET_KEY` | `sk_test_xxx` | All |
| `DATABASE_URL` | `postgresql://...` | All |
| `GROQ_API_KEY` | `gsk_xxx` | All |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | All |

### 4. 部署

點擊「Deploy」，Vercel 會自動：
- 安裝依賴
- 執行建置
- 設定預覽 URL

## 資料庫結構

### transactions 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵 |
| `clerk_user_id` | TEXT | Clerk 使用者 ID（用於 RLS） |
| `account_id` | UUID | 帳戶 ID（可選） |
| `upload_id` | UUID | 上傳批次 ID |
| `original_date` | DATE | 原始交易日期 |
| `original_description` | TEXT | 原始交易說明 |
| `original_amount` | NUMERIC | 原始金額 |
| `normalized_amount` | NUMERIC | 標準化金額（永遠為正） |
| `transaction_type` | TEXT | `income` / `expense` / `transfer` |
| `ai_category` | TEXT | AI 分類結果 |
| `ai_category_confidence` | TEXT | AI 信心度分數 |
| `status` | TEXT | `pending` / `categorized` |
| `raw_csv_data` | TEXT | 原始 CSV 資料 |
| `created_at` | TIMESTAMP | 建立時間 |
| `auto_classified_at` | TIMESTAMP | AI 分類時間 |

### uploads 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵 |
| `clerk_user_id` | TEXT | Clerk 使用者 ID |
| `file_name` | TEXT | 原始檔案名稱 |
| `transaction_count` | INTEGER | 匯入交易筆數 |
| `date_range_start` | DATE | 最早交易日期 |
| `date_range_end` | DATE | 最晚交易日期 |
| `created_at` | TIMESTAMP | 上傳時間 |

## 安全機制

### 認證
- 所有 API 路由都需要 Clerk 驗證
- 未授權請求返回 401

### 資料隔離
- Supabase Row Level Security (RLS) 啟用
- 每個查詢自動過濾 `clerk_user_id`

### Text-to-SQL 安全
- 只允許 SELECT 查詢
- 白名單驗證：僅 `transactions` 表
- 禁止模式偵測（UNION, DROP, etc.）
- 自動注入 user 隔離條件

## License

MIT
