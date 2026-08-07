import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants: Record<string, string> = {
    primary:
      'bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-sm hover:shadow-md hover:brightness-105 focus-visible:ring-brand-blue/50',
    secondary:
      'bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-400',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:bg-slate-50 disabled:text-slate-400',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:bg-slate-50 disabled:text-slate-400',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20',
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-slate-700">{children}</label>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-xl border border-slate-200/80 bg-white p-6 shadow-card', className)}>
      {children}
    </div>
  );
}

/** Consistent page top: title, description, optional primary action. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  running: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-violet-50 text-violet-700 ring-violet-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
  valid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  invalid: 'bg-red-50 text-red-700 ring-red-200',
  pending: 'bg-slate-100 text-slate-600 ring-slate-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  created: 'bg-slate-100 text-slate-600 ring-slate-200',
  transferred: 'bg-blue-50 text-blue-700 ring-blue-200',
  no_answer: 'bg-amber-50 text-amber-700 ring-amber-200',
  owner: 'bg-violet-50 text-violet-700 ring-violet-200',
  admin: 'bg-blue-50 text-blue-700 ring-blue-200',
  member: 'bg-slate-100 text-slate-600 ring-slate-200',
  'opted out': 'bg-red-50 text-red-700 ring-red-200',
  manual: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const badgeDots: Record<string, string> = {
  active: 'bg-emerald-500',
  running: 'bg-blue-500 animate-pulse',
  completed: 'bg-violet-500',
  paused: 'bg-amber-500',
  valid: 'bg-emerald-500',
  invalid: 'bg-red-500',
  failed: 'bg-red-500',
  paid: 'bg-emerald-500',
};

export function Badge({ children }: { children: string }) {
  const style = badgeStyles[children] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  const dot = badgeDots[children];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        style,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
      {children.replace(/_/g, ' ')}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-brand-blue" />
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
  action,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <p className="font-semibold text-slate-700">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toasts — tiny module-level store; mount <Toaster/> once (done in Layout).
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

let toastSeq = 0;
let pushToast: ((t: ToastItem) => void) | null = null;

function emit(kind: ToastKind, message: string) {
  pushToast?.({ id: ++toastSeq, kind, message });
}

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
};

const toastIcons: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushToast = (t) => {
      setItems((prev) => [...prev.slice(-3), t]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== t.id)), 4000);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 shadow-card-hover animate-toast-in"
        >
          <span className="mt-0.5 shrink-0">{toastIcons[t.kind]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setItems((prev) => prev.filter((i) => i.id !== t.id))}
            className="shrink-0 text-slate-300 hover:text-slate-500"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConfirmButton — guards destructive actions with a lightweight dialog.
// ---------------------------------------------------------------------------

export function ConfirmButton({
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  children,
  className,
  disabled,
}: {
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        disabled={disabled}
        title={title}
      >
        {children}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-fade-up"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 text-left shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-semibold text-slate-800">{title}</h3>
            </div>
            <p className="mb-5 text-sm text-slate-500">{message ?? 'This action cannot be undone.'}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
