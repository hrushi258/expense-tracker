# Expense Tracker — HANDOFF

## Current State
Fully built privacy-first PWA. Phase 6 (Payment Mode & Balance Syncing) is complete. Build is clean, zero errors. Dev server runs on port 5173.

## Tech Stack
- Vite 6 + React 18 + React Router v6 (HashRouter)
- Tailwind CSS v3 + @tailwindcss/forms
- Dexie.js v5 (IndexedDB)
- Recharts v2 (charts)
- vite-plugin-pwa + @google/generative-ai (Gemini 1.5 Flash)

## Architecture
- `src/context/AppContext.jsx` — global state: selectedMonth, categories, monthConfig, settings
- `src/db/db.js` — Dexie schema v5, all tables
- `src/services/gemini.js` — AI categorization (description only, amounts stripped)
- `src/services/fdCalculator.js` — FD compound interest math
- `src/services/ledger.js` — applyAccountDelta, applyTxnDelta, reverseTxnDelta
- Routes: `/` Dashboard, `/transactions`, `/history`, `/categories`, `/settings`, `/wealth`
- Settings (API key + income) → localStorage; all financial data in IndexedDB

## DB Schema (v5 — additive)
- `transactions` — added `paidVia` (non-indexed); `paymentMethod` kept for backward compat
- `assetAccounts` — accountGroup: liquid/growth/emergency; accountType now includes 'cash'
- `assetSnapshots` — every balance change (manual, auto-deduction, transfer) writes a snapshot
- `transfers` — inter-account fund movements (uuid, fromAccountId, toAccountId, amount, note, timestamp, createdAt)

## Wealth Module (Phase 5)
5-tab page at `/wealth`: Assets · FDs · Emergency · Cards · Net Worth.
See prior sessions for full spec.

## Phase 6: Payment Mode & Balance Syncing

### `paidVia` field on transactions
- `'account:{uuid}'` — specific asset account → triggers auto balance deduction on save
- `'card:{uuid}'` — specific CC (also writes `paymentMethod: uuid` for backward compat)
- `null` — untracked (no balance effect; legacy behavior)

### Ledger service (`src/services/ledger.js`)
- `applyAccountDelta({ accountUuid, delta, date, note })` — writes balance update + snapshot
- `applyTxnDelta(txn)` — expense: delta = -amount; income: delta = +amount
- `reverseTxnDelta(txn)` — opposite sign; used on edit (reverse old) and delete

### Auto-deduction flow
- Create: save transaction → applyTxnDelta
- Edit: reverseTxnDelta(old prefillTransaction) → update record → applyTxnDelta(new)
- Delete (TransactionItem): reverseTxnDelta → delete record

### New Components
- `src/components/transactions/PaidViaPicker.jsx` — scrollable pill row; liquid accounts + CC cards; income type hides CC pills
- `src/components/wealth/TransferSheet.jsx` — inter-account transfer; writes to `transfers` table + updates both account balances + snapshots; NOT a budget expense

### Cash in Hand
- Add account in Wealth > Assets with accountType `cash` (liquid group)
- Appears in PaidViaPicker like any other liquid account
- ATM withdrawal: Transfer from bank → Cash in Hand

### Transfers
- Button in Assets tab header appears when ≥2 accounts exist
- Validates: amount ≤ source balance, source ≠ destination

## Key Decisions
- `paymentMethod` kept alongside `paidVia` — CC outstanding filter checks both
- CC outstanding: `(paymentMethod === uuid || paidVia === 'card:uuid') && timestamp > lastSettledAt`
- Ledger ops are sequential (not atomic with transaction save) — acceptable for local single-user app
- Legacy transactions untouched (paidVia null → no retroactive balance changes)

## Open Items
- Transfer history view in Wealth > Assets (transfers are in DB, no dedicated UI yet)
- One-time migration script for old CC transactions (`paymentMethod` → `paidVia = 'card:uuid'`) — not needed since filter handles both
- FD maturity push notification (future)
- Receipt OCR scanner (future)

## Next Steps
- `npm run dev` → http://localhost:5173
- Wealth > Assets: add accounts (including Cash in Hand, accountType: cash)
- Log a transaction with Paid Via = bank account → check balance auto-decrements in Wealth
- Transfer: Assets tab → Transfer button (bank → cash in hand for ATM sim)
