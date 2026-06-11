import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { db, PILLAR_META, PILLARS } from '../db/db.js'
import { getPreviousMonths, monthToLabel, formatCurrency } from '../utils/formatters.js'

export default function History() {
  const [range, setRange] = useState(6)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const months = getPreviousMonths(range)
    setLoading(true)
    Promise.all(months.map(m => db.transactions.where('month').equals(m).toArray()))
      .then(results => {
        const rows = months.map((m, i) => {
          const txns = results[i]
          const row = {
            month: m,
            label: new Date(Number(m.split('-')[0]), Number(m.split('-')[1]) - 1, 1)
              .toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            Income: txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
            Total: txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
          }
          PILLARS.forEach(p => {
            row[PILLAR_META[p].label] = txns
              .filter(t => t.type === 'expense' && t.mainCategory === p)
              .reduce((s, t) => s + t.amount, 0)
          })
          return row
        })
        setData(rows)
      })
      .finally(() => setLoading(false))
  }, [range])

  const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }
  const axisStyle = { fontSize: 11, fill: '#94a3b8' }

  const maxExpense = Math.max(...data.map(d => d.Total), 1)

  return (
    <div className="pb-4">
      <div className="px-4 pt-4">
        {/* Range selector */}
        <div className="flex gap-2 mb-5">
          {[3, 6, 12].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                range === r ? 'bg-needs text-white border-needs' : 'bg-white text-slate-500 border-slate-200'
              }`}
            >
              {r}M
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 rounded-full border-2 border-needs border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Spending trend */}
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Spending Trend</h2>
            <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), '']}
                    contentStyle={tooltipStyle}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Income" stroke="#10B981" fill="url(#gradIncome)" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} />
                  <Area type="monotone" dataKey="Total" stroke="#4F46E5" fill="url(#gradExpense)" strokeWidth={2} dot={{ r: 3, fill: '#4F46E5' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pillar breakdown */}
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">By Pillar</h2>
            <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v), '']}
                    contentStyle={tooltipStyle}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  {PILLARS.map(p => (
                    <Bar
                      key={p}
                      dataKey={PILLAR_META[p].label}
                      stackId="a"
                      fill={PILLAR_META[p].color}
                      radius={p === 'investments' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Month-by-month table */}
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Monthly Summary</h2>
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-3 font-semibold text-slate-500">Month</th>
                      <th className="text-right px-3 py-3 font-semibold text-slate-500">Income</th>
                      <th className="text-right px-3 py-3 font-semibold text-slate-500">Spent</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-500">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...data].reverse().map(row => {
                      const saved = row.Income - row.Total
                      return (
                        <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-700">{row.label}</td>
                          <td className="px-3 py-3 text-right text-emerald-600 font-medium">
                            {row.Income > 0 ? formatCurrency(row.Income) : '—'}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-700 font-medium">
                            {row.Total > 0 ? formatCurrency(row.Total) : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${saved >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {row.Income > 0 ? formatCurrency(saved) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
