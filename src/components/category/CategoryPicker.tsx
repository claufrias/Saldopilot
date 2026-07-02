import { useApp } from '../../context/AppContext';
import type { Category } from '../../types';
import { CategoryIcon } from './CategoryBadge';

interface CategoryPickerProps {
  value: Category;
  onChange: (category: Category) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { categories } = useApp();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((category) => {
        const selected = value === category.name;

        return (
          <button
            key={category.id}
            type="button"
            className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 text-left transition active:scale-[0.98] ${
              selected
                ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-950'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-white/10'
            }`}
            onClick={() => onChange(category.name)}
            aria-pressed={selected}
          >
            <CategoryIcon category={category.name} />
            <span className="min-w-0 truncate text-sm font-semibold">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
