import { ArrowLeft, Landmark, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

type AppShellProps = {
  eyebrow: string
  title: string
  summary: string
  children: React.ReactNode
  action?: React.ReactNode
  backHref?: string
}

export function AppShell({ eyebrow, title, summary, children, action, backHref }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--paper)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[color:var(--mist)] blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[color:var(--sunbeam)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[color:var(--wash)] blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="surface-panel relative overflow-hidden rounded-[2rem] border border-white/70 px-6 py-6 shadow-[0_24px_80px_rgba(38,43,59,0.12)] sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(135deg,rgba(15,44,91,0.08),rgba(0,0,0,0))] md:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-3 text-[var(--muted)]">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.28em]">
                  <Landmark className="h-3.5 w-3.5" />
                  {eyebrow}
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trusted internal workspace
                </span>
              </div>
              <div className="space-y-3">
                {backHref ? (
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--ink)]"
                    to={backHref}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to portfolios
                  </Link>
                ) : null}
                <h1 className="font-display text-4xl leading-none tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">{summary}</p>
              </div>
            </div>

            {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
          </div>
        </header>

        <main className="relative z-10 flex-1 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
