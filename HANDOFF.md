# Expense Tracker — HANDOFF

## Current State
Fully built privacy-first PWA for personal expense tracking. All 4 phases from the master plan are implemented. Production build is clean (zero errors). Dev server runs on port 5173.

## Tech Stack
- Vite 6 + React 18 + React Router v6 (HashRouter)
- Tailwind CSS v3 + @tailwindcss/forms
- Dexie.js v4 (IndexedDB abstraction)
- Recharts v2 (charts)
- vite-plugin-pwa (Service Worker + manifest)
- @google/generative-ai (Gemini 1.5 Flash)

## Architecture
- `src/context/AppContext.jsx` — global state: selectedMonth, categories, monthConfig, settings
- `src/db/db.js` — Dexie schema + 25 seeded default categories across 4 pillars
- `src/services/gemini.js` — AI categorization (description text only, amounts stripped before call)
- `src/utils/sanitizer.js` — strips all numeric values and currency symbols from text before AI
- Routes: `/` Dashboard, `/transactions`, `/history`, `/categories`, `/settings`
- Settings (API key + income) stored in localStorage; all financial data in IndexedDB

## Key Decisions
- API key stored in localStorage (user-entered at runtime), never hardcoded
- INR (₹) currency with en-IN Intl formatting
- Budget percentages user-configurable per month (not fixed 50/30/20)
- Hash router so PWA works without a server
- Gemini called only on explicit "AI Tag" button click (privacy + cost control)
- Gemini model: gemini-1.5-flash

## File Structure
```
src/
  context/AppContext.jsx       global state
  db/db.js                     Dexie schema + seeds
  services/gemini.js           AI service
  utils/formatters.js          INR formatting, month utils
  utils/sanitizer.js           number-stripping for AI privacy
  components/
    layout/AppShell.jsx        header + month nav
    layout/BottomNav.jsx       5-item bottom nav + FAB
    ui/BottomSheet.jsx         slide-up sheet
    ui/Modal.jsx               center modal
    dashboard/SummaryCards.jsx income/expense header card
    dashboard/PillarBars.jsx   budget progress bars
    dashboard/SpendingDonut.jsx  recharts PieChart donut
    dashboard/FixedVsVariable.jsx recharts BarChart
    transactions/AddTransactionSheet.jsx  add/edit form with AI
    transactions/TransactionItem.jsx      list item with edit/delete
  pages/
    Dashboard.jsx   summary + charts + recent 5 txns
    Transactions.jsx list with search + pillar/type filters
    History.jsx     3/6/12 month area + stacked bar + summary table
    Categories.jsx  CRUD for subcategories
    Settings.jsx    income, budget%, API key, export/import, clear
```

## Open Items
- No recurring transaction support yet
- No OCR receipt scanner (Phase 5 future item from master plan)
- Chart library (recharts) is 421KB; lazy-load if startup perf matters

## Next Steps
- Run `npm run dev` and open http://localhost:5173
- Go to Settings → add Gemini API key, set monthly income + budget %
- Add first transaction with "AI Tag" to validate the full flow
- `npm run build` → deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages)
