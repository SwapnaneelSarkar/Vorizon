import type { WorkingHours } from '@vorizon/shared';
import { cn } from '../lib/utils';
import { Input, Label } from './ui';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const defaultWorkingHours: WorkingHours = {
  tz: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  days: [1, 2, 3, 4, 5],
  start: '09:00',
  end: '17:00',
};

export function WorkingHoursEditor({
  value,
  onChange,
  label = 'Working Hours',
}: {
  value: WorkingHours;
  onChange: (v: WorkingHours) => void;
  label?: string;
}) {
  const toggleDay = (d: number) => {
    const days = value.days.includes(d)
      ? value.days.filter((x) => x !== d)
      : [...value.days, d].sort((a, b) => a - b);
    onChange({ ...value, days });
  };

  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <div className="mb-2 flex flex-wrap gap-1">
        {DAY_LABELS.map((lbl, d) => (
          <button
            key={lbl}
            type="button"
            onClick={() => toggleDay(d)}
            className={cn(
              'h-8 w-10 rounded-md border text-xs font-medium transition',
              value.days.includes(d)
                ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                : 'border-slate-200 text-slate-400',
            )}
          >
            {lbl}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1 block text-xs text-slate-400">Start</span>
          <Input type="time" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} />
        </div>
        <div>
          <span className="mb-1 block text-xs text-slate-400">End</span>
          <Input type="time" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} />
        </div>
      </div>
      <div className="mt-2">
        <span className="mb-1 block text-xs text-slate-400">Timezone</span>
        <Input value={value.tz} onChange={(e) => onChange({ ...value, tz: e.target.value })} />
      </div>
    </div>
  );
}
