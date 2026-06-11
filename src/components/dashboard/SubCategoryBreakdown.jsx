import React, { useState, useMemo } from 'react'
import { useAppContext } from '../../context/AppContext.jsx'
import { formatCurrency } from '../../utils/formatters.js'

export default function SubCategoryBreakdown({ transactions }) {
  const { categories, pillarList } = useAppContext()
  const [activePillar, setActivePillar] = useState('all')

  const expenses = useMemo(
    () => transactions.filter(t => t.type === 'expense'),
    [transactions],
  )

  const pillarMap = useMemo(
    () => Object.fromEntries(pillarList.map(p => [p.key, p])),
    [pillarList],
  )

  const items = useMemo(() => {
    const filtered = activePillar === 'all' ? expenses : expenses.filter(t => t.mainCategory === activePillar)

    const spendById = {}
    filtered.forEach(t => {
      if (!t.subCategoryId) return
      spendById[t.subCategoryId] = (spendById[t.subCategoryId] || 0) + t.amount
    })

    const total = Object.values(spendById).reduce((s, v) => s + v, 0)
    const max   = Math.max(...Object.values(spendById), 1)

    return categories
      .filter(c => spendById[c.id] > 0)
      .map(c => ({
        ...c,
        spend:    spendById[c.id],
        pct:      total > 0 ? (spendById[c.id] / total) * 100 : 0,
        barWidth: (spendById[c.id] / max) * 100,
        pillar:   pillarMap[c.pillar],
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 12)
  }, [expenses, categories, pillarMap, activePillar])

  // Uncategorized spend in current filter
  const uncategorizedSpend = useMemo(() => {
    const filtered = activePillar === 'all' ? expenses : expenses.filter(t => t.mainCategory === activePillar)
    return filtered.filter(t => !t.subCategoryId).reduce((s, t) => s + t.amount, 0)
  }, [expenses, activePillar])

  if (items.length === 0 && uncategorizedSpend === 0) return null

  return (
    <div className="px-4 mt-4">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">By Subcategory</h2>
      <div className="bg-white rounded-2xl shadow-card p-4">

        {/* Pillar filter chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-4 border-b border-slate-50">
          <button
            onClick={() => setActivePillar('all')}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all
              ${activePillar === 'all' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            All
          </button>
          {pillarList.map(p => (
            <button
              key={p.key}
              onClick={() => setActivePillar(ap => ap === p.key ? 'all' : p.key)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={activePillar === p.key
                ? { backgroundColor: p.color, color: 'white', borderColor: p.color }
                : { backgroundColor: 'white', color: '#64748b', borderColor: '#e2e8f0' }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No subcategory data for this filter</p>
        ) : (
          <div className="space-y-3.5">
            {items.map(item => (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-sm flex-shrink-0">{item.icon}</span>
                    <span className="text-xs font-medium text-slate-700 truncate">{item.name}</span>
                    {item.pillar && activePillar === 'all' && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${item.pillar.color}18`, color: item.pillar.color }}
                      >
                        {item.pillar.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-[11px] text-slate-400">{item.pct.toFixed(0)}%</span>
                    <span className="text-xs font-bold text-slate-700 tabular-nums">{formatCurrency(item.spend)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.barWidth}%`, backgroundColor: item.pillar?.color || '#94a3b8' }}
                  />
                </div>
              </div>
            ))}

            {uncategorizedSpend > 0 && (
              <div className="pt-2 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>🏷️</span> Uncategorized
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{formatCurrency(uncategorizedSpend)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
