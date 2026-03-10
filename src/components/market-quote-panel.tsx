import { Activity, Clock3 } from 'lucide-react'

import { formatCurrency, formatDateTime } from '../lib/format'
import type { MarketQuote } from '../types/api'
import { Badge, EmptyState } from './ui'

type MarketQuotePanelProps = {
  quotes: MarketQuote[]
  warnings: string[]
}

export function MarketQuotePanel({ quotes, warnings }: MarketQuotePanelProps) {
  return (
    <div className="space-y-4">
      {quotes.length === 0 ? (
        <EmptyState
          title="No indicative quotes yet"
          description="Quotes appear on demand for symbols already held in this portfolio. Provider failures never block balance or position workflows."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quotes.map((quote) => (
            <div
              key={`${quote.symbol}-${quote.provider}`}
              className="rounded-[1.4rem] border border-[var(--line)] bg-white/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-3xl tracking-[-0.04em] text-[var(--ink)]">{quote.symbol}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{quote.provider.replaceAll('_', ' ')}</p>
                </div>
                <Badge className={quote.isStale ? 'text-[var(--danger)]' : 'text-[var(--accent-strong)]'}>
                  <Activity className="h-3.5 w-3.5" />
                  {quote.isStale ? 'Indicative stale' : 'Indicative delayed'}
                </Badge>
              </div>
              <p className="mt-5 font-semibold text-[var(--accent-strong)]">{formatCurrency(quote.price, quote.currency)}</p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDateTime(quote.asOf)}
              </p>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 ? (
        <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/55 px-4 py-3 text-sm text-[var(--muted)]">
          <p className="font-semibold text-[var(--ink)]">Quote warnings</p>
          <ul className="mt-2 space-y-2">
            {warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
