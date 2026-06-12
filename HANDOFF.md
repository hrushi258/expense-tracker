# Expense Tracker — HANDOFF

## Current State
Fully built privacy-first PWA for personal expense tracking. All 4 original phases plus the Wealth module (Phase 5) are implemented. Production build is clean (zero errors). Dev server runs on port 5173.

## Tech Stack
- Vite 6 + React 18 + React Router v6 (HashRouter)
- Tailwind CSS v3 + @tailwindcss/forms
- Dexie.js v4 (IndexedDB abstraction)
- Recharts v2 (charts)
- vite-plugin-pwa (Service Worker + manifest)
- @google/generative-ai (Gemini 1.5 Flash)

## Architecture
- `src/context/AppContext.jsx` — global state: selectedMonth, categories, monthConfig, settings
- `src/db/db.js` — Dexie schema v4 + 4 original tables + 4 new wealth tables + 25 seeded categories
- `src/services/gemini.js` — AI categorization (description text only, amounts stripped)
- `src/services/fdCalculator.js` — FD compound interest math (futureValue, maturityValue, progressPercent)
- `src/utils/sanitizer.js` — strips numeric values before AI call
- Routes: `/` Dashboard, `/transactions`, `/history`, `/categories`, `/settings`, `/wealth`
- Settings (API key + income) stored in localStorage; all financial data in IndexedDB
- Emergency fund target stored in localStorage under `et_emergency_target` (default: 6)

## Wealth Module (Phase 5)
New `/wealth` page replaces "Categories" in bottom nav (Categories still accessible via Settings quick links).

### DB Tables Added (version 4)
- `assetAccounts` — accounts ledger: salary, savings, MF, gold, PPF, crypto; groups: liquid/growth/emergency
- `assetSnapshots` — historical balance snapshots with delta; written on every "Update Balance"
- `fdRecords` — FD metadata: principal, openDate, maturityDate, interestRate, compoundingFrequency
- `creditCards` — card metadata: name, limit, statementDay, dueDay, color, lastSettledAt

### Transaction Schema Change
- `paymentMethod` field added (non-indexed): null = cash, or creditCard.uuid
- AddTransactionSheet shows Payment Method selector (card pills) when ≥1 credit card exists; hidden for income

### 5 Tabs
1. **Assets** — AssetAllocationRing (donut: liquid/growth/emergency), account cards with Update Balance + edit
2. **FDs** — MaturityTimeline (stacked horizontal BarChart: principal + projected interest), FD cards with progress bar
3. **Emergency** — SVG semicircle gauge (runway months vs target), target editable inline, avg monthly essentials from last 3 months of needs/fixed transactions
4. **Cards** — Upcoming bills sorted by due date, credit card cards with available credit + "Settle" flow
5. **Net Worth** — Hero card (Net Worth = Assets − CC Outstanding), full breakdown, Net Liquidity = (Liquid + Emergency) − CC Outstanding

### Settlement Flow
"Settle" on a card opens SettlementSheet: selects source liquid/emergency account, deducts outstanding from account balance, writes assetSnapshot, updates card.lastSettledAt. No duplicate transaction created (spending already logged at point-of-purchase).

## Key Decisions
- API key stored in localStorage (user-entered at runtime), never hardcoded
- INR (₹) currency with en-IN Intl formatting
- Budget percentages user-configurable per month (not fixed 50/30/20)
- Hash router so PWA works without a server
- Gemini called only on explicit "AI Tag" button click (privacy + cost control)
- FD calculations 100% client-side (compound interest formula)
- Emergency target in localStorage (not per-month DB config)
- CC outstanding = all transactions tagged to card since lastSettledAt (not billing-cycle based)

## File Structure (additions)
```
src/
  services/fdCalculator.js         compound interest engine
  pages/Wealth.jsx                 main wealth page (data + 5 tabs inline)
  components/wealth/
    AssetAllocationRing.jsx        Recharts donut chart
    SnapshotUpdateSheet.jsx        balance update bottom sheet
    AssetAccountFormSheet.jsx      add/edit account
    FDFormSheet.jsx                add/edit FD
    MaturityTimeline.jsx           horizontal stacked bar chart
    EmergencyFundGauge.jsx         SVG semicircle gauge
    CreditCardFormSheet.jsx        add/edit credit card
    SettlementSheet.jsx            card bill settlement flow
    NetWorthPanel.jsx              net worth + liquidity summary
```

## Open Items
- FD maturity "unlock" event: no push notification when an FD matures (future)
- Credit card billing-period model is simplified (since lastSettledAt, not statement cycle)
- No OCR receipt scanner (Phase 5 future item)
- Chart library (recharts) is 421KB; lazy-load if startup perf matters

## Next Steps
- Run `npm run dev` and open http://localhost:5173
- Go to Settings → add Gemini API key, set monthly income + budget %
- Go to Wealth → add salary/savings accounts, set up FDs, add credit cards
- `npm run build` → deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages)
