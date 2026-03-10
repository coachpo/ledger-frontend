import { FileUp, ShieldCheck } from 'lucide-react'
import * as React from 'react'

import { api, toErrorMessage } from '../lib/api'
import type { CsvCommitResponse, CsvPreviewResponse } from '../types/api'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  FieldError,
  FieldHint,
  Input,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from './ui'

type CsvImportDialogProps = {
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCommitted: () => Promise<void> | void
}

export function CsvImportDialog({
  portfolioId,
  open,
  onOpenChange,
  onCommitted,
}: CsvImportDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<CsvPreviewResponse | null>(null)
  const [commitResult, setCommitResult] = React.useState<CsvCommitResponse | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [previewing, setPreviewing] = React.useState(false)
  const [committing, setCommitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setPreview(null)
      setCommitResult(null)
      setErrorMessage(null)
    }
  }, [open])

  async function handlePreview() {
    if (!selectedFile) {
      setErrorMessage('Select a CSV file first.')
      return
    }

    try {
      setPreviewing(true)
      setCommitResult(null)
      setErrorMessage(null)
      setPreview(await api.previewImport(portfolioId, selectedFile))
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setPreviewing(false)
    }
  }

  async function handleCommit() {
    if (!selectedFile) {
      setErrorMessage('Select a CSV file first.')
      return
    }

    try {
      setCommitting(true)
      setErrorMessage(null)
      const result = await api.commitImport(portfolioId, selectedFile)
      setCommitResult(result)
      await onCommitted()
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setCommitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import position snapshot</DialogTitle>
          <DialogDescription>
            Upload a CSV with <code>symbol</code>, <code>quantity</code>, and <code>average_cost</code>. Preview validates row-level issues before anything is committed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4 rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-4">
            <div className="space-y-3">
              <Badge>
                <ShieldCheck className="h-3.5 w-3.5" />
                Template reminder
              </Badge>
              <div className="rounded-[1.4rem] border border-dashed border-[var(--line-strong)] bg-white/65 p-4 text-sm leading-6 text-[var(--muted)]">
                <p className="font-semibold text-[var(--ink)]">Use the snapshot format below</p>
                <p className="mt-2 font-mono text-xs text-[var(--accent-strong)]">
                  symbol,quantity,average_cost,name
                </p>
                <p className="mt-2 text-xs">The optional <code>name</code> column can be omitted. Existing symbols are updated, new symbols are inserted, and missing symbols stay untouched.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]" htmlFor="csv-file">
                CSV file
              </label>
              <Input
                accept=".csv,text/csv"
                id="csv-file"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setSelectedFile(file)
                  setPreview(null)
                  setCommitResult(null)
                  setErrorMessage(null)
                }}
                type="file"
              />
              <FieldHint>Preview first to inspect accepted rows and row-level errors.</FieldHint>
            </div>

            {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

            {commitResult ? (
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--wash)] px-4 py-3 text-sm text-[var(--ink)]">
                Imported {commitResult.inserted} new, updated {commitResult.updated}, left {commitResult.unchanged} unchanged.
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-[var(--line)] bg-white/55 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl tracking-[-0.03em] text-[var(--ink)]">Validation preview</p>
                <p className="text-sm text-[var(--muted)]">Accepted rows appear here before commit.</p>
              </div>
              <Badge>
                <FileUp className="h-3.5 w-3.5" />
                {preview?.acceptedRows.length ?? 0} accepted
              </Badge>
            </div>

            {preview ? (
              <div className="space-y-4">
                {preview.acceptedRows.length > 0 ? (
                  <div className="overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-white/60">
                    <div className="overflow-x-auto">
                      <Table>
                        <THead>
                          <Tr>
                            <Th>Row</Th>
                            <Th>Symbol</Th>
                            <Th>Quantity</Th>
                            <Th>Average cost</Th>
                          </Tr>
                        </THead>
                        <TBody>
                          {preview.acceptedRows.map((row) => (
                            <Tr key={`${row.row}-${row.symbol}`}>
                              <Td>{row.row}</Td>
                              <Td>{row.symbol}</Td>
                              <Td>{row.quantity}</Td>
                              <Td>{row.averageCost}</Td>
                            </Tr>
                          ))}
                        </TBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No accepted rows"
                    description="Upload a valid file to inspect the rows that are ready to be committed."
                  />
                )}

                {preview.errors.length > 0 ? (
                  <div className="space-y-2 rounded-[1.4rem] border border-[rgba(138,58,58,0.22)] bg-[rgba(138,58,58,0.06)] p-4 text-sm text-[var(--danger)]">
                    <p className="font-semibold">Row-level issues</p>
                    <ul className="space-y-2">
                      {preview.errors.map((error) => (
                        <li key={`${error.row}-${error.field}-${error.issue}`}>
                          Row {error.row} · {error.field} · {error.issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="Preview pending"
                description="Select a CSV file, then preview it to validate headers, duplicate symbols, and decimal values before committing." 
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button disabled={previewing || committing} type="button" variant="secondary" onClick={handlePreview}>
            {previewing ? 'Previewing...' : 'Preview rows'}
          </Button>
          <Button
            disabled={committing || !selectedFile || !preview || preview.errors.length > 0}
            type="button"
            onClick={handleCommit}
          >
            {committing ? 'Committing...' : 'Commit import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
