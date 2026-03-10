import { Pencil, Trash2 } from 'lucide-react'

import { formatCurrency } from '../lib/format'
import type { BalanceRecord } from '../types/api'
import { Button, EmptyState, Table, TBody, Td, Th, THead, Tr } from './ui'

type BalanceTableProps = {
  balances: BalanceRecord[]
  onEdit: (balance: BalanceRecord) => void
  onDelete: (balance: BalanceRecord) => void
}

export function BalanceTable({ balances, onEdit, onDelete }: BalanceTableProps) {
  if (balances.length === 0) {
    return (
      <EmptyState
        title="No balances yet"
        description="Add at least one balance to model the cash pool used when simulated trades settle."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/45">
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <Tr>
              <Th>Label</Th>
              <Th>Amount</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {balances.map((balance) => (
              <Tr key={balance.id}>
                <Td>
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--ink)]">{balance.label}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Settlement balance</p>
                  </div>
                </Td>
                <Td>
                  <span className="font-semibold text-[var(--ink)]">
                    {formatCurrency(balance.amount, balance.currency)}
                  </span>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(balance)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(balance)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  )
}
