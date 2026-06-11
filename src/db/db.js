import Dexie from 'dexie'

export const db = new Dexie('ExpenseTrackerDB')

db.version(1).stores({
  transactions: '++id, uuid, timestamp, month, mainCategory, subCategoryId, type, costType',
  categories: '++id, uuid, pillar, name',
  monthConfig: 'month',
})

db.version(2).stores({
  transactions: '++id, uuid, timestamp, month, mainCategory, subCategoryId, type, costType',
  categories: '++id, uuid, pillar, name',
  monthConfig: 'month',
  pillars: '++id, key',
})

db.version(3).stores({
  transactions: '++id, uuid, timestamp, month, mainCategory, subCategoryId, type, costType, recurringId',
  categories: '++id, uuid, pillar, name',
  monthConfig: 'month',
  pillars: '++id, key',
  recurringTransactions: '++id, uuid',
})

export const DEFAULT_PILLARS = [
  { key: 'needs',       label: 'Needs',       icon: '🏠', color: '#4F46E5', lightColor: '#EEF2FF', defaultBudget: 50, isDefault: true },
  { key: 'wants',       label: 'Wants',       icon: '✨', color: '#EC4899', lightColor: '#FDF2F8', defaultBudget: 30, isDefault: true },
  { key: 'savings',     label: 'Savings',     icon: '🏦', color: '#10B981', lightColor: '#ECFDF5', defaultBudget: 10, isDefault: true },
  { key: 'investments', label: 'Investments', icon: '📊', color: '#F59E0B', lightColor: '#FFFBEB', defaultBudget: 10, isDefault: true },
]

export const PILLAR_META = Object.fromEntries(DEFAULT_PILLARS.map(p => [p.key, p]))
export const PILLARS = DEFAULT_PILLARS.map(p => p.key)

const DEFAULT_CATEGORIES = [
  { uuid: 'cat-needs-rent',       name: 'Rent / EMI',            pillar: 'needs',       costType: 'fixed',    icon: '🏠', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-groceries',  name: 'Groceries',             pillar: 'needs',       costType: 'variable', icon: '🛒', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-utilities',  name: 'Electricity / Water',   pillar: 'needs',       costType: 'fixed',    icon: '⚡', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-internet',   name: 'Internet / Mobile',     pillar: 'needs',       costType: 'fixed',    icon: '📱', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-transport',  name: 'Transport / Fuel',      pillar: 'needs',       costType: 'variable', icon: '🚗', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-health',     name: 'Health / Medical',      pillar: 'needs',       costType: 'variable', icon: '💊', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-insurance',  name: 'Insurance',             pillar: 'needs',       costType: 'fixed',    icon: '🛡️', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-education',  name: 'Education / Fees',      pillar: 'needs',       costType: 'fixed',    icon: '📚', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-dining',     name: 'Dining Out',            pillar: 'wants',       costType: 'variable', icon: '🍽️', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-entertain',  name: 'Entertainment',         pillar: 'wants',       costType: 'variable', icon: '🎬', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-shopping',   name: 'Shopping / Clothes',    pillar: 'wants',       costType: 'variable', icon: '👕', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-subs',       name: 'Subscriptions',         pillar: 'wants',       costType: 'fixed',    icon: '📺', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-travel',     name: 'Travel / Vacation',     pillar: 'wants',       costType: 'variable', icon: '✈️', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-personal',   name: 'Personal Care / Salon', pillar: 'wants',       costType: 'variable', icon: '💇', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-gadgets',    name: 'Gadgets / Electronics', pillar: 'wants',       costType: 'variable', icon: '💻', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-gifts',      name: 'Gifts / Donations',     pillar: 'wants',       costType: 'variable', icon: '🎁', isDefault: true, isArchived: false },
  { uuid: 'cat-save-emergency',   name: 'Emergency Fund',        pillar: 'savings',     costType: 'fixed',    icon: '🏦', isDefault: true, isArchived: false },
  { uuid: 'cat-save-fd',          name: 'Fixed Deposit',         pillar: 'savings',     costType: 'fixed',    icon: '📈', isDefault: true, isArchived: false },
  { uuid: 'cat-save-rd',          name: 'Recurring Deposit',     pillar: 'savings',     costType: 'fixed',    icon: '🔄', isDefault: true, isArchived: false },
  { uuid: 'cat-save-liquid',      name: 'Liquid Savings',        pillar: 'savings',     costType: 'variable', icon: '💰', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-sip',          name: 'SIP / Mutual Funds',    pillar: 'investments', costType: 'fixed',    icon: '📊', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-stocks',       name: 'Stocks / Equity',       pillar: 'investments', costType: 'variable', icon: '📉', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-ppf',          name: 'PPF / NPS',             pillar: 'investments', costType: 'fixed',    icon: '🏛️', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-gold',         name: 'Gold / Commodities',    pillar: 'investments', costType: 'variable', icon: '🥇', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-crypto',       name: 'Crypto',                pillar: 'investments', costType: 'variable', icon: '₿',  isDefault: true, isArchived: false },
]

export async function seedDefaults() {
  await db.transaction('rw', db.pillars, db.categories, async () => {
    const [cats, pillars] = await Promise.all([
      db.categories.count(),
      db.pillars.toArray(),
    ])

    // Deduplicate pillars that snuck in via StrictMode double-invoke — keep lowest id per key
    if (pillars.length > DEFAULT_PILLARS.length) {
      const seen = new Set()
      const toDelete = []
      for (const p of [...pillars].sort((a, b) => a.id - b.id)) {
        if (seen.has(p.key)) toDelete.push(p.id)
        else seen.add(p.key)
      }
      if (toDelete.length) await db.pillars.bulkDelete(toDelete)
    } else if (pillars.length === 0) {
      await db.pillars.bulkAdd(DEFAULT_PILLARS)
    }

    if (cats === 0) await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  })
}

export const seedDefaultCategories = seedDefaults

export async function applyDueRecurring() {
  const now = new Date()
  const today = now.getDate()
  const cy = now.getFullYear()
  const cm = now.getMonth() + 1
  const currentMonthStr = `${cy}-${String(cm).padStart(2, '0')}`
  // Timestamp for "right now" — used for current-month transactions so the
  // displayed date reflects when the app was actually opened, not the scheduled day.
  const nowTimestamp = new Date(cy, cm - 1, today).getTime()

  const actives = (await db.recurringTransactions.toArray()).filter(r => r.isActive)
  if (!actives.length) return 0

  let applied = 0
  for (const rec of actives) {
    const existing = await db.transactions.where('recurringId').equals(rec.uuid).toArray()
    const appliedByMonth = Object.fromEntries(existing.map(t => [t.month, t]))

    const endStr = rec.endMonth && rec.endMonth < currentMonthStr ? rec.endMonth : currentMonthStr
    let [y, m] = rec.startMonth.split('-').map(Number)
    const [ey, em] = endStr.split('-').map(Number)

    while (y < ey || (y === ey && m <= em)) {
      const monthStr = `${y}-${String(m).padStart(2, '0')}`
      const daysInMonth = new Date(y, m, 0).getDate()
      const targetDay = Math.min(rec.dayOfMonth, daysInMonth)

      if (monthStr === currentMonthStr && today < targetDay) break

      const existingTxn = appliedByMonth[monthStr]

      if (!existingTxn) {
        // Current month → stamp today. Past month → stamp last day of that month
        // (the month is over; last day is the closest honest date we can give).
        const ts = monthStr === currentMonthStr
          ? nowTimestamp
          : new Date(y, m, 0).getTime()

        await db.transactions.add({
          uuid: crypto.randomUUID(),
          recurringId: rec.uuid,
          timestamp: ts,
          month: monthStr,
          description: rec.description,
          amount: rec.amount,
          type: rec.type,
          mainCategory: rec.mainCategory,
          subCategoryId: rec.subCategoryId || null,
          costType: rec.costType || 'variable',
          aiTagged: false,
        })
        applied++
      } else if (monthStr === currentMonthStr) {
        // Fix already-created current-month transactions that carry the old
        // scheduled-day date — update them to today's date.
        const storedDay = new Date(existingTxn.timestamp).getDate()
        if (storedDay !== today) {
          await db.transactions.update(existingTxn.id, { timestamp: nowTimestamp })
        }
      }

      m++
      if (m > 12) { m = 1; y++ }
    }
  }
  return applied
}
