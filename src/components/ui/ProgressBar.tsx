interface ProgressBarProps {
  value: number;
  tone?: 'emerald' | 'amber' | 'rose' | 'sky';
}

const tones = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
};

export function ProgressBar({ value, tone = 'emerald' }: ProgressBarProps) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10" aria-label={`Progreso ${value}%`}>
      <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
