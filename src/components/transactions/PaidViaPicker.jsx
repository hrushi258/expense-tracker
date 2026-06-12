import React from 'react'

// Unified payment source selector.
// accounts: liquid asset accounts (not archived), cards: active credit cards.
// value: 'account:{uuid}' | 'card:{uuid}' | null
// onChange: (paidVia: string | null) => void
export default function PaidViaPicker({ accounts, cards, value, onChange }) {
  if (!accounts.length && !cards.length) return null

  const sources = [
    ...accounts.map(a => ({
      id: `account:${a.uuid}`,
      label: a.name,
      icon: a.icon || '🏦',
      activeColor: '#4F46E5',
    })),
    ...cards.map(c => ({
      id: `card:${c.uuid}`,
      label: c.name,
      icon: '💳',
      activeColor: c.color || '#4F46E5',
    })),
  ]

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Paid Via</label>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {/* "None / Untracked" deselect pill */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${
            !value ? 'bg-slate-700 border-slate-700 text-white' : 'border-slate-200 text-slate-400 bg-white'
          }`}
        >
          Untracked
        </button>
        {sources.map(s => {
          const isActive = value === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(isActive ? null : s.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all"
              style={isActive
                ? { backgroundColor: s.activeColor, borderColor: s.activeColor, color: 'white' }
                : { backgroundColor: 'white', borderColor: '#e2e8f0', color: '#64748b' }}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
