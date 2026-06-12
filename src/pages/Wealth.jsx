import React, { useState, useEffect, useCallback } from 'react'
import { db } from '../db/db.js'
import { formatCurrency } from '../utils/formatters.js'
import { fdMaturityValue, fdInterestEarned, daysUntilMaturity, fdProgressPercent } from '../services/fdCalculator.js'

import AssetAllocationRing from '../components/wealth/AssetAllocationRing.jsx'
import SnapshotUpdateSheet from '../components/wealth/SnapshotUpdateSheet.jsx'
import AssetAccountFormSheet from '../components/wealth/AssetAccountFormSheet.jsx'
import FDFormSheet from '../components/wealth/FDFormSheet.jsx'
import MaturityTimeline from '../components/wealth/MaturityTimeline.jsx'
import EmergencyFundGauge from '../components/wealth/EmergencyFundGauge.jsx'
import CreditCardFormSheet from '../components/wealth/CreditCardFormSheet.jsx'
import SettlementSheet from '../components/wealth/SettlementSheet.jsx'
import NetWorthPanel from '../components/wealth/NetWorthPanel.jsx'

const TABS = [
  { key: 'assets',    label: 'Assets' },
  { key: 'fds',       label: 'FDs' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'cards',     label: 'Cards' },
  { key: 'networth',  label: 'Net Worth' },
]

const GROUP_META = {
  liquid:    { label: 'Liquid',    color: '#4F46E5', bg: '#EEF2FF' },
  growth:    { label: 'Growth',    color: '#F59E0B', bg: '#FFFBEB' },
  emergency: { label: 'Emergency', color: '#10B981', bg: '#ECFDF5' },
}

function nextDueDate(dueDay) {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (today <= thisMonth) return thisMonth
  return new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
}

function daysUntil(date) {
  return Math.ceil((date - new Date()) / (24 * 60 * 60 * 1000))
}

// ─── FAB button ───────────────────────────────────────────────────────────────
function AddButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-needs text-white text-sm font-semibold active:scale-95 transition-transform shadow-sm">
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
        <path d="M12 5v14M5 12h14" />
      </svg>
      {label}
    </button>
  )
}

// ─── Asset Account Card ───────────────────────────────────────────────────────
function AccountCard({ account, onUpdate, onEdit }) {
  const meta = GROUP_META[account.accountGroup] || GROUP_META.liquid
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: meta.bg }}>
          {account.icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{account.name}</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="text-base font-bold text-slate-800">{formatCurrency(account.balance || 0)}</p>
          {account.updatedAt && (
            <p className="text-[10px] text-slate-400">
              updated {new Date(account.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => onUpdate(account)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-needs hover:text-white transition-colors text-xs font-bold"
            title="Update balance">
            ↑₹
          </button>
          <button onClick={() => onEdit(account)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            title="Edit">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FD Card ──────────────────────────────────────────────────────────────────
function FDCard({ fd, onEdit }) {
  const maturityVal = fdMaturityValue(fd)
  const interest = fdInterestEarned(fd)
  const days = daysUntilMaturity(fd)
  const progress = fdProgressPercent(fd)
  const isMatured = days <= 0

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{fd.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {fd.interestRate}% p.a. · {fd.compoundingFrequency}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isMatured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {isMatured ? 'Matured' : `${days}d left`}
          </span>
          <button onClick={() => onEdit(fd)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Principal</p>
          <p className="text-xs font-bold text-slate-700 mt-0.5">{formatCurrency(fd.principal)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-emerald-500 uppercase tracking-wide">Interest</p>
          <p className="text-xs font-bold text-emerald-700 mt-0.5">+{formatCurrency(Math.round(interest))}</p>
        </div>
        <div className="bg-needs-light rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-needs uppercase tracking-wide">Maturity</p>
          <p className="text-xs font-bold text-needs mt-0.5">{formatCurrency(Math.round(maturityVal))}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>{fd.openDate}</span>
          <span>{fd.maturityDate}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: isMatured ? '#10B981' : '#4F46E5' }} />
        </div>
        <p className="text-right text-[10px] text-slate-400 mt-0.5">{progress}% elapsed</p>
      </div>
    </div>
  )
}

// ─── Credit Card Bill Card ─────────────────────────────────────────────────────
function CreditCardCard({ card, outstanding, onEdit, onSettle }) {
  const available = Math.max(0, card.limit - outstanding)
  const usedPct = card.limit > 0 ? Math.min((outstanding / card.limit) * 100, 100) : 0
  const dueDate = nextDueDate(card.dueDay)
  const daysLeft = daysUntil(dueDate)

  const urgencyColor = daysLeft <= 2 ? '#EF4444' : daysLeft <= 5 ? '#F97316' : '#10B981'

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="p-4 text-white flex items-end justify-between relative"
        style={{ backgroundColor: card.color || '#4F46E5', minHeight: 80 }}>
        <div className="absolute top-3 right-4 opacity-20 text-5xl font-black select-none leading-none">▣</div>
        <div>
          <p className="text-xs opacity-75 font-medium">Credit Card</p>
          <p className="text-base font-bold leading-tight">{card.name}</p>
        </div>
        <button onClick={() => onEdit(card)}
          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Used: {formatCurrency(outstanding)}</span>
            <span>Limit: {formatCurrency(card.limit)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${usedPct}%`, backgroundColor: usedPct > 80 ? '#EF4444' : usedPct > 60 ? '#F59E0B' : '#4F46E5' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-2.5">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Available</p>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(available)}</p>
          </div>
          <div className="rounded-xl p-2.5" style={{ backgroundColor: `${urgencyColor}15` }}>
            <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: urgencyColor }}>
              {daysLeft <= 0 ? 'OVERDUE' : `Due in ${daysLeft}d`}
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: urgencyColor }}>
              {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {outstanding > 0 && (
          <button onClick={() => onSettle(card, outstanding)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white active:scale-[0.98] transition-transform"
            style={{ backgroundColor: card.color || '#4F46E5' }}>
            Settle {formatCurrency(outstanding)}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Wealth() {
  const [activeTab, setActiveTab] = useState('assets')
  const [accounts, setAccounts] = useState([])
  const [fds, setFDs] = useState([])
  const [cards, setCards] = useState([])
  const [cardStats, setCardStats] = useState({})     // { cardUuid: outstanding }
  const [essentialAvg, setEssentialAvg] = useState(0)
  const [loading, setLoading] = useState(true)

  // Sheet states
  const [snapshotTarget, setSnapshotTarget] = useState(null)
  const [accountFormTarget, setAccountFormTarget] = useState(null)
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [fdFormTarget, setFDFormTarget] = useState(null)
  const [fdFormOpen, setFDFormOpen] = useState(false)
  const [cardFormTarget, setCardFormTarget] = useState(null)
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [settlementTarget, setSettlementTarget] = useState(null) // { card, outstanding }

  // Emergency target (stored in localStorage)
  const [emergencyTarget, setEmergencyTarget] = useState(() => {
    return Number(localStorage.getItem('et_emergency_target') || '6')
  })

  const handleEmergencyTargetChange = (v) => {
    setEmergencyTarget(v)
    localStorage.setItem('et_emergency_target', String(v))
  }

  const reload = useCallback(async () => {
    const now = new Date()
    const cutoffMonths = [0, 1, 2].map(i => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })

    const [rawAccounts, rawFDs, rawCards, allTxns] = await Promise.all([
      db.assetAccounts.toArray(),
      db.fdRecords.toArray(),
      db.creditCards.toArray(),
      db.transactions.toArray(),
    ])

    const activeAccounts = rawAccounts.filter(a => !a.isArchived)
    const activeCards = rawCards.filter(c => !c.isArchived)

    // CC outstanding per card
    const stats = {}
    for (const card of activeCards) {
      const lastSettled = card.lastSettledAt || 0
      const outstanding = allTxns
        .filter(t => t.paymentMethod === card.uuid && t.timestamp > lastSettled)
        .reduce((s, t) => s + (t.amount || 0), 0)
      stats[card.uuid] = outstanding
    }

    // Avg monthly essential expenses (last 3 months, needs/fixed)
    const essentialTotal = allTxns
      .filter(t => t.mainCategory === 'needs' && t.costType === 'fixed' && cutoffMonths.includes(t.month))
      .reduce((s, t) => s + (t.amount || 0), 0)

    setAccounts(activeAccounts)
    setFDs(rawFDs.filter(f => !f.isMatured))
    setCards(activeCards)
    setCardStats(stats)
    setEssentialAvg(essentialTotal / 3)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const emergencyBalance = accounts
    .filter(a => a.accountGroup === 'emergency')
    .reduce((s, a) => s + (a.balance || 0), 0)

  const totalCCOutstanding = Object.values(cardStats).reduce((s, v) => s + v, 0)

  const liquidAccounts = accounts.filter(a => a.accountGroup === 'liquid' || a.accountGroup === 'emergency')

  const handleAccountUpdate = (acc) => setSnapshotTarget(acc)
  const handleAccountEdit = (acc) => { setAccountFormTarget(acc); setAccountFormOpen(true) }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-6 h-6 rounded-full border-2 border-needs border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Tab Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100">
        <div className="flex overflow-x-auto hide-scrollbar px-3 gap-1 py-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-needs text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* ── ASSETS TAB ──────────────────────────────────────────────── */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-4">
              <AssetAllocationRing accounts={accounts} />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Your Accounts</h2>
              <AddButton label="Add Account" onClick={() => { setAccountFormTarget(null); setAccountFormOpen(true) }} />
            </div>

            {accounts.length === 0 ? (
              <EmptyState icon="🏦" title="No accounts yet"
                body="Add your salary, savings, investments, and emergency accounts to track your total wealth." />
            ) : (
              <div className="space-y-2">
                {['liquid', 'growth', 'emergency'].map(group => {
                  const group_accounts = accounts.filter(a => a.accountGroup === group)
                  if (!group_accounts.length) return null
                  const meta = GROUP_META[group]
                  return (
                    <div key={group}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: meta.color }}>
                        {meta.label}
                      </p>
                      <div className="space-y-2">
                        {group_accounts.map(account => (
                          <AccountCard
                            key={account.id}
                            account={account}
                            onUpdate={handleAccountUpdate}
                            onEdit={handleAccountEdit}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FDS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'fds' && (
          <div className="space-y-4">
            {fds.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-4">
                <MaturityTimeline fds={fds} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Fixed Deposits</h2>
              <AddButton label="Add FD" onClick={() => { setFDFormTarget(null); setFDFormOpen(true) }} />
            </div>

            {fds.length === 0 ? (
              <EmptyState icon="📑" title="No Fixed Deposits"
                body="Track all your FDs with maturity dates, interest rates, and projected returns." />
            ) : (
              <div className="space-y-3">
                {[...fds]
                  .sort((a, b) => new Date(a.maturityDate) - new Date(b.maturityDate))
                  .map(fd => (
                    <FDCard key={fd.id} fd={fd} onEdit={fd => { setFDFormTarget(fd); setFDFormOpen(true) }} />
                  ))}
              </div>
            )}

            {fds.length > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Portfolio Summary</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total Principal', value: formatCurrency(fds.reduce((s, f) => s + f.principal, 0)) },
                    { label: 'Total Interest', value: '+' + formatCurrency(Math.round(fds.reduce((s, f) => s + fdInterestEarned(f), 0))), color: 'text-emerald-600' },
                    { label: 'At Maturity', value: formatCurrency(Math.round(fds.reduce((s, f) => s + fdMaturityValue(f), 0))), color: 'text-needs' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
                      <p className={`text-xs font-bold mt-1 ${color || 'text-slate-800'}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EMERGENCY TAB ───────────────────────────────────────────── */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Runway Calculator</h2>
              <EmergencyFundGauge
                emergencyBalance={emergencyBalance}
                avgMonthlyEssentials={essentialAvg}
                target={emergencyTarget}
                onTargetChange={handleEmergencyTargetChange}
              />
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>How it works:</strong> Runway = Emergency Fund ÷ Average Monthly Essential Expenses (last 3 months of fixed Needs spending). Accounts in the <strong>Emergency</strong> group contribute to this pool.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Emergency Accounts</h2>
              <AddButton label="Add Account" onClick={() => { setAccountFormTarget(null); setAccountFormOpen(true) }} />
            </div>

            {accounts.filter(a => a.accountGroup === 'emergency').length === 0 ? (
              <EmptyState icon="🛡️" title="No emergency accounts"
                body="Add savings accounts or liquid FDs and mark them as 'Emergency' group to track your safety net." />
            ) : (
              <div className="space-y-2">
                {accounts.filter(a => a.accountGroup === 'emergency').map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onUpdate={handleAccountUpdate}
                    onEdit={handleAccountEdit}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CARDS TAB ───────────────────────────────────────────────── */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            {/* Bills due summary */}
            {cards.length > 0 && totalCCOutstanding > 0 && (
              <div className="bg-white rounded-2xl shadow-card p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Upcoming Bills</p>
                <div className="space-y-2">
                  {[...cards]
                    .map(c => ({ ...c, outstanding: cardStats[c.uuid] || 0, dueDate: nextDueDate(c.dueDay) }))
                    .filter(c => c.outstanding > 0)
                    .sort((a, b) => a.dueDate - b.dueDate)
                    .map(c => {
                      const days = daysUntil(c.dueDate)
                      const urgency = days <= 2 ? 'text-red-600 bg-red-50' : days <= 5 ? 'text-orange-600 bg-orange-50' : 'text-slate-600 bg-slate-50'
                      return (
                        <div key={c.uuid} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${urgency}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="text-sm font-semibold">{c.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{formatCurrency(c.outstanding)}</p>
                            <p className="text-[10px]">{days <= 0 ? 'Overdue' : `Due in ${days}d`}</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
                <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-medium">Total Outstanding</span>
                  <span className="text-base font-bold text-red-600">{formatCurrency(totalCCOutstanding)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Credit Cards</h2>
              <AddButton label="Add Card" onClick={() => { setCardFormTarget(null); setCardFormOpen(true) }} />
            </div>

            {cards.length === 0 ? (
              <EmptyState icon="💳" title="No credit cards"
                body="Track your credit cards, available credit, and upcoming due dates." />
            ) : (
              <div className="space-y-3">
                {cards.map(card => (
                  <CreditCardCard
                    key={card.id}
                    card={card}
                    outstanding={cardStats[card.uuid] || 0}
                    onEdit={c => { setCardFormTarget(c); setCardFormOpen(true) }}
                    onSettle={(c, outstanding) => setSettlementTarget({ card: c, outstanding })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NET WORTH TAB ────────────────────────────────────────────── */}
        {activeTab === 'networth' && (
          <NetWorthPanel accounts={accounts} totalCCOutstanding={totalCCOutstanding} />
        )}

      </div>

      {/* ── Sheets ──────────────────────────────────────────────────────── */}
      <SnapshotUpdateSheet
        open={!!snapshotTarget}
        onClose={() => setSnapshotTarget(null)}
        account={snapshotTarget}
        onUpdated={reload}
      />

      <AssetAccountFormSheet
        open={accountFormOpen}
        onClose={() => setAccountFormOpen(false)}
        account={accountFormTarget}
        onSaved={reload}
      />

      <FDFormSheet
        open={fdFormOpen}
        onClose={() => setFDFormOpen(false)}
        fd={fdFormTarget}
        onSaved={reload}
      />

      <CreditCardFormSheet
        open={cardFormOpen}
        onClose={() => setCardFormOpen(false)}
        card={cardFormTarget}
        onSaved={reload}
      />

      <SettlementSheet
        open={!!settlementTarget}
        onClose={() => setSettlementTarget(null)}
        card={settlementTarget?.card || null}
        outstanding={settlementTarget?.outstanding || 0}
        liquidAccounts={liquidAccounts}
        onSettled={reload}
      />
    </div>
  )
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-slate-700 font-semibold mb-1">{title}</p>
      <p className="text-slate-400 text-sm">{body}</p>
    </div>
  )
}
