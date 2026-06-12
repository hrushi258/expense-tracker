import React from 'react'

export default function CategoryPicker({
  pillarList,
  categories,
  mainCategory,
  subCategoryId,
  costType,
  onPillarChange,
  onSubCategoryChange,
  onCostTypeChange,
  mainCategoryError,
}) {
  const subCategories = categories.filter(c => c.pillar === mainCategory)

  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Pillar</label>
        <div className="grid grid-cols-2 gap-2">
          {pillarList.map(p => (
            <button key={p.key} type="button"
              onClick={() => onPillarChange(p.key)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
              style={mainCategory === p.key
                ? { backgroundColor: p.color, borderColor: p.color, color: 'white' }
                : { borderColor: '#e2e8f0', color: '#64748b', backgroundColor: 'white' }}>
              <span className="text-base">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
        {mainCategoryError && <p className="text-red-500 text-xs mt-1">{mainCategoryError}</p>}
      </div>

      {mainCategory && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Subcategory</label>
          <select value={subCategoryId || ''}
            onChange={e => onSubCategoryChange(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition">
            <option value="">— None —</option>
            {subCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cost Behavior</label>
        <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
          {['fixed', 'variable'].map(ct => (
            <button key={ct} type="button" onClick={() => onCostTypeChange(ct)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${costType === ct ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>
              {ct}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
