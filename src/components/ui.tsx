import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle, TriangleAlert, X } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

import { toErrorMessage } from '../lib/api'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-[var(--accent-strong)] bg-[var(--accent-strong)] px-4 text-white shadow-[0_18px_35px_rgba(23,59,99,0.18)] hover:-translate-y-0.5 hover:bg-[var(--accent)]',
        secondary:
          'border-[var(--line-strong)] bg-white/80 px-4 text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent-strong)]',
        ghost:
          'border-transparent bg-transparent px-3 text-[var(--muted)] hover:bg-white/70 hover:text-[var(--ink)]',
        danger:
          'border-[var(--danger)] bg-[var(--danger)] px-4 text-white hover:-translate-y-0.5 hover:opacity-90',
      },
      size: {
        default: 'h-11',
        sm: 'h-9 text-xs uppercase tracking-[0.16em]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({ asChild, className, size, variant, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ size, variant }), className)} {...props} />
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'surface-panel animate-rise rounded-[1.75rem] border border-[var(--line)] shadow-[0_18px_60px_rgba(38,43,59,0.08)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-2 border-b ambient-divider px-5 py-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-display text-2xl tracking-[-0.03em]', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-6 text-[var(--muted)]', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5', className)} {...props} />
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]',
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(47,93,145,0.12)]',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-[1.4rem] border border-[var(--line)] bg-white/90 px-4 py-3 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(47,93,145,0.12)]',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full cursor-pointer appearance-none rounded-2xl border border-[var(--line)] bg-white/90 px-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(47,93,145,0.12)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]', className)}
      {...props}
    />
  )
}

export function Separator({ className, ...props }: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root className={cn('h-px w-full bg-[var(--line)]', className)} {...props} />
  )
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-[var(--muted)]">{children}</p>
}

export function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--danger)]">{children}</p>
}

export function DataAlert({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[rgba(138,58,58,0.25)] bg-[rgba(138,58,58,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-[13px] leading-5">{description}</p>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--line-strong)] bg-white/45 px-5 py-7 text-center">
      <p className="font-display text-2xl tracking-[-0.03em] text-[var(--ink)]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  )
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[1.5rem] border border-[var(--line)] bg-white/55 px-5 py-8 text-sm text-[var(--muted)]">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {message}
    </div>
  )
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('min-w-full border-separate border-spacing-0 text-sm', className)} {...props} />
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('text-left text-xs uppercase tracking-[0.18em] text-[var(--muted)]', className)} {...props} />
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child_td]:border-b-0', className)} {...props} />
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition hover:bg-white/45', className)} {...props} />
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('border-b border-[var(--line)] px-3 py-3 font-semibold', className)} {...props} />
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-[var(--line)] px-3 py-4 align-top', className)} {...props} />
}

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[rgba(18,24,33,0.38)] backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          'surface-panel fixed left-1/2 top-1/2 z-50 w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/70 p-6 shadow-[0_30px_90px_rgba(28,37,52,0.18)] outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-5 top-5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-white/70 text-[var(--muted)] transition hover:text-[var(--ink)]">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-5 space-y-2 pr-10', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('font-display text-3xl tracking-[-0.04em]', className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn('text-sm leading-6 text-[var(--muted)]', className)} {...props} />
  )
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end', className)} {...props} />
}

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export function AlertDialogContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[rgba(18,24,33,0.38)] backdrop-blur-sm" />
      <AlertDialogPrimitive.Content
        className={cn(
          'surface-panel fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/70 p-6 shadow-[0_30px_90px_rgba(28,37,52,0.18)] outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  )
}

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2', className)} {...props} />
}

export function AlertDialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cn('font-display text-3xl tracking-[-0.04em]', className)} {...props} />
}

export function AlertDialogDescription({ className, ...props }: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description className={cn('text-sm leading-6 text-[var(--muted)]', className)} {...props} />
  )
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end', className)} {...props} />
}

export const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} className={cn(buttonVariants({ variant: 'secondary' }), className)} {...props} />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & VariantProps<typeof buttonVariants>
>(({ className, variant = 'danger', size = 'default', ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants({ variant, size }), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

type ConfirmActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  actionLabel: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [pending, setPending] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setSubmitError(null)
    }
  }, [open])

  async function handleConfirm() {
    try {
      setPending(true)
      setSubmitError(null)
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      setSubmitError(toErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {submitError ? <FieldError>{submitError}</FieldError> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <Button disabled={pending} onClick={handleConfirm} type="button" variant="danger">
            {pending ? 'Working...' : actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
