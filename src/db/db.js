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
