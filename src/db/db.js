import Dexie from 'dexie'

export const db = new Dexie('ExpenseTrackerDB')

db.version(1).stores({
  transactions: '++id, uuid, timestamp, month, mainCategory, subCategoryId, type, costType',
  categories: '++id, uuid, pillar, name',
  monthConfig: 'month',
})

const DEFAULT_CATEGORIES = [
  // NEEDS
  { uuid: 'cat-needs-rent', name: 'Rent / EMI', pillar: 'needs', costType: 'fixed', icon: '🏠', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-groceries', name: 'Groceries', pillar: 'needs', costType: 'variable', icon: '🛒', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-utilities', name: 'Electricity / Water', pillar: 'needs', costType: 'fixed', icon: '⚡', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-internet', name: 'Internet / Mobile', pillar: 'needs', costType: 'fixed', icon: '📱', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-transport', name: 'Transport / Fuel', pillar: 'needs', costType: 'variable', icon: '🚗', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-health', name: 'Health / Medical', pillar: 'needs', costType: 'variable', icon: '💊', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-insurance', name: 'Insurance', pillar: 'needs', costType: 'fixed', icon: '🛡️', isDefault: true, isArchived: false },
  { uuid: 'cat-needs-education', name: 'Education / Fees', pillar: 'needs', costType: 'fixed', icon: '📚', isDefault: true, isArchived: false },
  // WANTS
  { uuid: 'cat-wants-dining', name: 'Dining Out', pillar: 'wants', costType: 'variable', icon: '🍽️', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-entertainment', name: 'Entertainment', pillar: 'wants', costType: 'variable', icon: '🎬', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-shopping', name: 'Shopping / Clothes', pillar: 'wants', costType: 'variable', icon: '👕', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-subscriptions', name: 'Subscriptions', pillar: 'wants', costType: 'fixed', icon: '📺', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-travel', name: 'Travel / Vacation', pillar: 'wants', costType: 'variable', icon: '✈️', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-personal', name: 'Personal Care / Salon', pillar: 'wants', costType: 'variable', icon: '💇', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-gadgets', name: 'Gadgets / Electronics', pillar: 'wants', costType: 'variable', icon: '💻', isDefault: true, isArchived: false },
  { uuid: 'cat-wants-gifts', name: 'Gifts / Donations', pillar: 'wants', costType: 'variable', icon: '🎁', isDefault: true, isArchived: false },
  // SAVINGS
  { uuid: 'cat-save-emergency', name: 'Emergency Fund', pillar: 'savings', costType: 'fixed', icon: '🏦', isDefault: true, isArchived: false },
  { uuid: 'cat-save-fd', name: 'Fixed Deposit', pillar: 'savings', costType: 'fixed', icon: '📈', isDefault: true, isArchived: false },
  { uuid: 'cat-save-rd', name: 'Recurring Deposit', pillar: 'savings', costType: 'fixed', icon: '🔄', isDefault: true, isArchived: false },
  { uuid: 'cat-save-liquid', name: 'Liquid Savings', pillar: 'savings', costType: 'variable', icon: '💰', isDefault: true, isArchived: false },
  // INVESTMENTS
  { uuid: 'cat-inv-sip', name: 'SIP / Mutual Funds', pillar: 'investments', costType: 'fixed', icon: '📊', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-stocks', name: 'Stocks / Equity', pillar: 'investments', costType: 'variable', icon: '📉', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-ppf', name: 'PPF / NPS', pillar: 'investments', costType: 'fixed', icon: '🏛️', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-gold', name: 'Gold / Commodities', pillar: 'investments', costType: 'variable', icon: '🥇', isDefault: true, isArchived: false },
  { uuid: 'cat-inv-crypto', name: 'Crypto', pillar: 'investments', costType: 'variable', icon: '₿', isDefault: true, isArchived: false },
]

export async function seedDefaultCategories() {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  }
}

export const PILLAR_META = {
  needs: { label: 'Needs', color: '#4F46E5', light: '#EEF2FF', textClass: 'text-needs', bgClass: 'bg-needs-light', borderClass: 'border-needs', description: 'Essential expenses' },
  wants: { label: 'Wants', color: '#EC4899', light: '#FDF2F8', textClass: 'text-wants', bgClass: 'bg-wants-light', borderClass: 'border-wants', description: 'Lifestyle & leisure' },
  savings: { label: 'Savings', color: '#10B981', light: '#ECFDF5', textClass: 'text-savings', bgClass: 'bg-savings-light', borderClass: 'border-savings', description: 'Building a cushion' },
  investments: { label: 'Investments', color: '#F59E0B', light: '#FFFBEB', textClass: 'text-investments', bgClass: 'bg-investments-light', borderClass: 'border-investments', description: 'Growing wealth' },
}

export const PILLARS = ['needs', 'wants', 'savings', 'investments']
