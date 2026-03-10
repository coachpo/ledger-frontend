import { formatCurrency, formatDateTime, formatDecimal } from '../lib/format'
import type { TradingOperation } from '../types/api'
import { Badge, EmptyState, Table, TBody, Td, Th, THead, Tr } from './ui'

type TradingOperationTableProps = {
  operations: TradingOperation[]
}

export function TradingOperationTable({ operations }: TradingOperationTableProps) {
  if (operations.length === 0) {
    return (
      <EmptyState
        title="No simulated trades yet"
        description="Recent buy and sell activity appears here with the settlement balance snapshot that was used for each operation."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/45">
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <Tr>
              <Th>Trade</Th>
              <Th>Settlement</Th>
              <Th>Executed</Th>
            </Tr>
          </THead>
          <TBody>
            {operations.map((operation) => (
              <Tr key={operation.id}>
                <Td>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={operation.side === 'BUY' ? 'text-[var(--accent-strong)]' : 'text-[var(--danger)]'}>
                        {operation.side}
                      </Badge>
                      <span className="font-semibold text-[var(--ink)]">{operation.symbol}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {formatDecimal(operation.quantity)} shares at {formatCurrency(operation.price, operation.currency)}
                    </p>
                  </div>
                </Td>
                <Td>
                  <div className="space-y-1 text-sm text-[var(--muted)]">
                    <p className="font-semibold text-[var(--ink)]">{operation.balanceLabel}</p>
                    <p>Commission {formatCurrency(operation.commission, operation.currency)}</p>
                  </div>
                </Td>
                <Td>
                  <span className="text-sm text-[var(--muted)]">{formatDateTime(operation.executedAt)}</span>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  )
}
