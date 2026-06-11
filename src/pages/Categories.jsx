import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext.jsx'
import { db, PILLAR_META, PILLARS } from '../db/db.js'
import Modal from '../components/ui/Modal.jsx'

const BLANK = { name: '', pillar: 'needs', costType: 'variable', icon: '📦' }
const ICON_SUGGESTIONS = ['🏠','🛒','⚡','📱','🚗','💊','🛡️','📚','🍽️','🎬','👕','📺','✈️','💇','💻','🎁','🏦','📈','🔄','💰','📊','📉','🏛️','🥇','₿','🎓','🏋️','🎮','🌿','🍕']

export default function Categories() {
  const { categories, triggerRefresh } = useAppContext()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('needs')

  const openAdd = () => { setEditing(null); setForm(BLANK); setModalOpen(true) }
  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, pillar: cat.pillar, costType: cat.costType, icon: cat.icon })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await db.categories.update(editing.id, { ...form, name: form.name.trim() })
      } else {
        await db.categories.add({ ...form, name: form.name.trim(), uuid: crypto.randomUUID(), isDefault: false, isArchived: false })
      }
      triggerRefresh()
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (cat) => {
    if (cat.isDefault) return
    await db.categories.update(cat.id, { isArchived: true })
    triggerRefresh()
  }

  const tabCategories = categories.filter(c => c.pillar === activeTab)

  return (
    <div className="pb-4">
      <div className="px-4 pt-4">
        {/* Pillar tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
          {PILLARS.map(p => (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === p ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'
              }`}
            >
              {PILLAR_META[p].label}
            </button>
          ))}
        </div>

        {/* Category list */}
        <div className="space-y-2">
          {tabCategories.map(cat => (
            <div
              key={cat.id}
              className="flex items-center gap-3 bg-white rounded-2xl shadow-card px-4 py-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: PILLAR_META[cat.pillar].light }}
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
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg text-slate-400 hover:text-needs hover:bg-needs-light transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => handleArchive(cat)}
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
              <p className="text-slate-400 text-sm">No categories yet. Add one below.</p>
            </div>
          )}
        </div>

        <button
          onClick={openAdd}
          className="mt-4 w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-semibold hover:border-needs hover:text-needs transition-colors flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Add / Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_SUGGESTIONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                    form.icon === ic ? 'bg-needs-light ring-2 ring-needs' : 'bg-slate-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Pet care"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-needs/30 focus:border-needs transition"
            />
          </div>

          {/* Pillar */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Pillar</label>
            <div className="grid grid-cols-2 gap-2">
              {PILLARS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, pillar: p }))}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    form.pillar === p ? 'text-white border-transparent' : 'border-slate-200 text-slate-500 bg-white'
                  }`}
                  style={form.pillar === p ? { backgroundColor: PILLAR_META[p].color } : {}}
                >
                  {PILLAR_META[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Cost type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cost Behavior</label>
            <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
              {['fixed', 'variable'].map(ct => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, costType: ct }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                    form.costType === ct ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="w-full py-3 rounded-2xl bg-needs text-white font-semibold disabled:opacity-40 transition-opacity"
          >
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
