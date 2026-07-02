import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { MovementType } from '../../types';

interface MovementTypePickerProps {
  value: MovementType;
  onChange: (type: MovementType) => void;
}

const options = [
  {
    value: 'expense' as MovementType,
    label: 'Gasto',
    description: 'Salida de dinero',
    icon: ArrowDownRight,
    selectedClassName: 'border-rose-600 bg-rose-600 text-white',
    idleClassName: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
  },
  {
    value: 'income' as MovementType,
    label: 'Ingreso',
    description: 'Entrada de dinero',
    icon: ArrowUpRight,
    selectedClassName: 'border-emerald-600 bg-emerald-600 text-white',
    idleClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
];

export function MovementTypePicker({ value, onChange }: MovementTypePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 text-left transition active:scale-[0.98] ${
              selected ? option.selectedClassName : option.idleClassName
            }`}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 text-current dark:bg-zinc-950/30">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">{option.label}</span>
              <span className="block truncate text-xs opacity-75">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
