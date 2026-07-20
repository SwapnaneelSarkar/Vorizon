import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Stepper({
  steps,
  active,
  onSelect,
}: {
  steps: string[];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="space-y-1">
      {steps.map((title, i) => (
        <button
          key={title}
          onClick={() => onSelect(i)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
            i === active ? 'bg-brand-blue/10 text-brand-blue' : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          <span
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border text-xs',
              i < active
                ? 'border-brand-blue bg-brand-blue text-white'
                : i === active
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-slate-300 text-slate-400',
            )}
          >
            {i < active ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          {title}
        </button>
      ))}
    </div>
  );
}
