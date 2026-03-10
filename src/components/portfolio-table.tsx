import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { formatDateTime, formatRelativePortfolioSize } from '../lib/format'
import type { PortfolioSummary } from '../types/api'
import { Badge, Button, EmptyState, Table, TBody, Td, Th, THead, Tr } from './ui'

type PortfolioTableProps = {
  portfolios: PortfolioSummary[]
  onEdit: (portfolio: PortfolioSummary) => void
  onDelete: (portfolio: PortfolioSummary) => void
}

export function PortfolioTable({ portfolios, onEdit, onDelete }: PortfolioTableProps) {
  const navigate = useNavigate()

  if (portfolios.length === 0) {
    return (
      <EmptyState
        title="No portfolios yet"
        description="Create your first workspace to start tracking balances, positions, and simulated trades without mixing strategies together."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/45">
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <Tr>
              <Th>Portfolio</Th>
              <Th>Footprint</Th>
              <Th>Currency</Th>
              <Th>Updated</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {portfolios.map((portfolio) => (
              <Tr key={portfolio.id}>
                <Td>
                  <div className="space-y-2">
                    <button
                      className="group flex cursor-pointer items-center gap-2 text-left"
                      onClick={() => navigate(`/portfolios/${portfolio.id}`)}
                      type="button"
                    >
                      <span className="font-display text-2xl tracking-[-0.03em] text-[var(--ink)]">{portfolio.name}</span>
                      <ArrowRight className="h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--accent-strong)]" />
                    </button>
                    <p className="max-w-lg text-sm leading-6 text-[var(--muted)]">
                      {portfolio.description || 'A focused portfolio workspace for isolated tracking.'}
                    </p>
                  </div>
                </Td>
                <Td>
                  <Badge>{formatRelativePortfolioSize(portfolio.balanceCount, portfolio.positionCount)}</Badge>
                </Td>
                <Td>
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                    {portfolio.baseCurrency}
                  </span>
                </Td>
                <Td>
                  <span className="text-sm text-[var(--muted)]">{formatDateTime(portfolio.updatedAt)}</span>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(portfolio)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(portfolio)}>
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
