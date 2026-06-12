import { db } from '../db/db.js'

// Write a balance delta to an asset account and record a snapshot.
// date: YYYY-MM-DD string
export async function applyAccountDelta({ accountUuid, delta, date, note }) {
  const account = await db.assetAccounts.where('uuid').equals(accountUuid).first()
  if (!account) return
  const newBalance = (account.balance || 0) + delta
  const now = Date.now()
  await db.transaction('rw', db.assetAccounts, db.assetSnapshots, async () => {
    await db.assetAccounts.update(account.id, { balance: newBalance, updatedAt: now })
    await db.assetSnapshots.add({
      accountId: accountUuid,
      snapshotDate: date,
      balance: newBalance,
      delta,
      note,
      timestamp: now,
    })
  })
}

// Apply balance effect of a saved transaction.
// Only acts when paidVia is 'account:{uuid}'. No-op for cards, null, or legacy.
export async function applyTxnDelta(txn) {
  if (!txn.paidVia?.startsWith('account:')) return
  const accountUuid = txn.paidVia.slice('account:'.length)
  const delta = txn.type === 'income' ? txn.amount : -txn.amount
  const date = txn.date || new Date(txn.timestamp).toISOString().slice(0, 10)
  await applyAccountDelta({ accountUuid, delta, date, note: txn.description })
}

// Reverse a previously applied balance effect (on edit or delete).
export async function reverseTxnDelta(txn) {
  if (!txn.paidVia?.startsWith('account:')) return
  const accountUuid = txn.paidVia.slice('account:'.length)
  const delta = txn.type === 'income' ? -txn.amount : txn.amount   // opposite of apply
  const date = new Date(txn.timestamp).toISOString().slice(0, 10)
  await applyAccountDelta({ accountUuid, delta, date, note: `Reversal: ${txn.description}` })
}
