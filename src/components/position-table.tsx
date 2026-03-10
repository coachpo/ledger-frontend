import { Pencil, Trash2 } from 'lucide-react'

import { formatCurrency, formatDecimal } from '../lib/format'
import type { PositionRecord } from '../types/api'
import { Button, EmptyState, Table, TBody, Td, Th, THead, Tr } from './ui'

type PositionTableProps = {
  positions: PositionRecord[]
  onEdit: (position: PositionRecord) => void
  onDelete: (position: PositionRecord) => void
}

export function PositionTable({ positions, onEdit, onDelete }: PositionTableProps) {
  if (positions.length === 0) {
    return (
      <EmptyState
        title="No positions tracked"
        description="Add positions manually or import a CSV snapshot. One symbol stays aggregated into a single holding per portfolio."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/45">
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <Tr>
              <Th>Symbol</Th>
              <Th>Quantity</Th>
              <Th>Average cost</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {positions.map((position) => (
              <Tr key={position.id}>
                <Td>
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--ink)]">{position.symbol}</p>
                    <p className="text-sm text-[var(--muted)]">{position.name || 'Manual holding'}</p>
                  </div>
                </Td>
                <Td>{formatDecimal(position.quantity)}</Td>
                <Td>{formatCurrency(position.averageCost, position.currency)}</Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(position)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(position)}>
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
