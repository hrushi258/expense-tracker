import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext.jsx'
import { db } from '../db/db.js'
import Modal from '../components/ui/Modal.jsx'

const CATEGORY_ICONS = ['🏠','🛒','⚡','📱','🚗','💊','🛡️','📚','🍽️','🎬','👕','📺','✈️','💇','💻','🎁','🏦','📈','🔄','💰','📊','📉','🏛️','🥇','₿','🎓','🏋️','🎮','🌿','🍕','🧴','🐾','👶','🔧','⚙️']

const PILLAR_ICONS = ['🏠','✨','🏦','📊','💼','🌱','🎯','💡','🔥','⚡','🌟','💎','🎁','🏆','🎓','🚀','💪','🌍','💰','📈','🧩','🎨','🌈','🏗️','🔑']

const PRESET_COLORS = [
  { color: '#4F46E5', lightColor: '#EEF2FF' },
  { color: '#EC4899', lightColor: '#FDF2F8' },
  { color: '#10B981', lightColor: '#ECFDF5' },
  { color: '#F59E0B', lightColor: '#FFFBEB' },
  { color: '#0EA5E9', lightColor: '#F0F9FF' },
  { color: '#8B5CF6', lightColor: '#F5F3FF' },
  { color: '#F43F5E', lightColor: '#FFF1F2' },
  { color: '#F97316', lightColor: '#FFF7ED' },
  { color: '#14B8A6', lightColor: '#F0FDFA' },
  { color: '#84CC16', lightColor: '#F7FEE7' },
]

const BLANK_CATEGORY = { name: '', pillar: '', costType: 'variable', icon: '📦' }
const BLANK_PILLAR = { label: '', icon: '🎯', color: '#8B5CF6', lightColor: '#F5F3FF' }

function toPillarKey(label) {
  return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 24) || `pillar_${Date.now()}`
}

export default function Categories() {
  const { categories, pillarList, pillarMeta, triggerRefresh } = useAppContext()

  // Category state
  const [activeTab, setActiveTab] = useState(null)
  const [catModal, setCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [catForm, setCatForm] = useState(BLANK_CATEGORY)

  // Pillar state
  const [pillarModal, setPillarModal] = useState(false)
  const [editingPillar, setEditingPillar] = useState(null)
  const [pillarForm, setPillarForm] = useState(BLANK_PILLAR)
  const [saving, setSaving] = useState(false)

  const currentTab = activeTab || pillarList[0]?.key

  // ── Category handlers ──────────────────────────────────────────
  const openAddCat = () => {
    setEditingCat(null)
    setCatForm({ ...BLANK_CATEGORY, pillar: currentTab })
    setCatModal(true)
  }

  const openEditCat = (cat) => {
    setEditingCat(cat)
    setCatForm({ name: cat.name, pillar: cat.pillar, costType: cat.costType, icon: cat.icon })
    setCatModal(true)
  }

  const saveCat = async () => {
    if (!catForm.name.trim()) return
    setSaving(true)
    try {
      if (editingCat) {
        await db.categories.update(editingCat.id, { ...catForm, name: catForm.name.trim() })
      } else {
        await db.categories.add({ ...catForm, name: catForm.name.trim(), uuid: crypto.randomUUID(), isDefault: false, isArchived: false })
      }
      triggerRefresh()
      setCatModal(false)
    } finally {
      setSaving(false)
    }
  }

  const archiveCat = async (cat) => {
    if (cat.isDefault) return
    await db.categories.update(cat.id, { isArchived: true })
    triggerRefresh()
  }

  // ── Pillar handlers ────────────────────────────────────────────
  const openAddPillar = () => {
    setEditingPillar(null)
    setPillarForm(BLANK_PILLAR)
    setPillarModal(true)
  }

  const openEditPillar = (pillar) => {
    setEditingPillar(pillar)
    setPillarForm({ label: pillar.label, icon: pillar.icon, color: pillar.color, lightColor: pillar.lightColor })
    setPillarModal(true)
  }

  const savePillar = async () => {
    if (!pillarForm.label.trim()) return
    setSaving(true)
    try {
      if (editingPillar) {
        await db.pillars.update(editingPillar.id, {
          label: pillarForm.label.trim(),
          icon: pillarForm.icon,
          color: pillarForm.color,
          lightColor: pillarForm.lightColor,
        })
      } else {
        const key = toPillarKey(pillarForm.label)
        const exists = pillarList.some(p => p.key === key)
        await db.pillars.add({
          key: exists ? `${key}_${Date.now()}` : key,
          label: pillarForm.label.trim(),
          icon: pillarForm.icon,
          color: pillarForm.color,
          lightColor: pillarForm.lightColor,
          defaultBudget: 0,
          isDefault: false,
        })
      }
      triggerRefresh()
      setPillarModal(false)
    } finally {
      setSaving(false)
    }
  }

  const tabCategories = categories.filter(c => c.pillar === currentTab)
  const currentPillar = pillarMeta[currentTab]

  return (
    <div className="pb-4">
      <div className="px-4 pt-4">

        {/* ── Pillars section ──────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pillars</h2>
            <button
              onClick={openAddPillar}
              className="flex items-center gap-1 text-xs font-semibold text-needs px-2.5 py-1.5 rounded-lg bg-needs-light hover:bg-indigo-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Pillar
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {pillarList.map(p => (
              <div
                key={p.key}
                className={`flex-shrink-0 flex items-center gap-2 pl-3 pr-1 py-2 rounded-xl border-2 transition-all cursor-pointer ${
                  currentTab === p.key ? 'border-transparent' : 'border-slate-200 bg-white'
                }`}
                style={currentTab === p.key ? { backgroundColor: p.color, borderColor: p.color } : {}}
                onClick={() => setActiveTab(p.key)}
              >
                <span className="text-sm">{p.icon}</span>
                <span className={`text-sm font-semibold ${currentTab === p.key ? 'text-white' : 'text-slate-600'}`}>
                  {p.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditPillar(p) }}
                  className={`p-1 rounded-lg transition-colors ${
                    currentTab === p.key ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Edit pillar"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Subcategories for selected pillar ──────────── */}
        {currentPillar && (
          <div
            className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2"
            style={{ color: currentPillar.color }}
          >
            <span>{currentPillar.icon}</span>
            <span>{currentPillar.label} — Subcategories</span>
          </div>
        )}

        <div className="space-y-2">
          {tabCategories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-4 py-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: currentPillar?.lightColor || '#F1F5F9' }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  cat.costType === 'fixed' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {cat.costType}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditCat(cat)}
                  className="p-2 rounded-lg text-slate-400 hover:text-needs hover:bg-needs-light transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => archiveCat(cat)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          {tabCategories.length === 0 && (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <p className="text-slate-400 text-sm">No subcategories yet. Add one below.</p>
            </div>
          )}
        </div>

        <button
          onClick={openAddCat}
          className="mt-4 w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-semibold hover:border-needs hover:text-needs transition-colors flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Subcategory
        </button>
      </div>

      {/* ── Category modal ───────────────────────────────── */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title={editingCat ? 'Edit Subcategory' : 'New Subcategory'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Icon</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setCatForm(f => ({ ...f, icon: ic }))}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    catForm.icon === ic ? 'bg-needs-light ring-2 ring-needs' : 'bg-slate-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={catForm.name}
              onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Pet care"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Pillar</label>
            <div className="grid grid-cols-2 gap-2">
              {pillarList.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setCatForm(f => ({ ...f, pillar: p.key }))}
                  className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={catForm.pillar === p.key
                    ? { backgroundColor: p.color, borderColor: p.color, color: 'white' }
                    : { borderColor: '#e2e8f0', color: '#64748b', backgroundColor: 'white' }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cost Behavior</label>
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
              {['fixed', 'variable'].map(ct => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setCatForm(f => ({ ...f, costType: ct }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                    catForm.costType === ct ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveCat}
            disabled={!catForm.name.trim() || !catForm.pillar || saving}
            className="w-full py-3 rounded-2xl bg-needs text-white font-semibold disabled:opacity-40 transition-opacity"
          >
            {saving ? 'Saving…' : editingCat ? 'Save Changes' : 'Create Subcategory'}
          </button>
        </div>
      </Modal>

      {/* ── Pillar modal ─────────────────────────────────── */}
      <Modal open={pillarModal} onClose={() => setPillarModal(false)} title={editingPillar ? 'Edit Pillar' : 'New Pillar'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={pillarForm.label}
              onChange={e => setPillarForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Business"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
            />
            {!editingPillar && pillarForm.label && (
              <p className="text-xs text-slate-400 mt-1">Key: <code>{toPillarKey(pillarForm.label)}</code></p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Icon</label>
            <div className="flex flex-wrap gap-2">
              {PILLAR_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setPillarForm(f => ({ ...f, icon: ic }))}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                  style={pillarForm.icon === ic
                    ? { backgroundColor: pillarForm.lightColor, outline: `2px solid ${pillarForm.color}` }
                    : { backgroundColor: '#f1f5f9' }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(({ color, lightColor }) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPillarForm(f => ({ ...f, color, lightColor }))}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    outline: pillarForm.color === color ? `3px solid ${color}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>

            {/* Preview */}
            <div
              className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: pillarForm.lightColor }}
            >
              <span className="text-lg">{pillarForm.icon}</span>
              <span className="text-sm font-semibold" style={{ color: pillarForm.color }}>
                {pillarForm.label || 'Preview'}
              </span>
            </div>
          </div>

          <button
            onClick={savePillar}
            disabled={!pillarForm.label.trim() || saving}
            className="w-full py-3 rounded-2xl text-white font-semibold disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: pillarForm.color }}
          >
            {saving ? 'Saving…' : editingPillar ? 'Save Changes' : 'Create Pillar'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
