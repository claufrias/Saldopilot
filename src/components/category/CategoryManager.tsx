import { Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { CategoryIcon, categoryColors, categoryIcons } from './CategoryBadge';

interface CategoryManagerProps {
  onClose: () => void;
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const { categories, movements, budgets, recurringExpenses, addCategory, deleteCategory } = useApp();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('shapes');
  const [color, setColor] = useState('slate');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    addCategory({ name: trimmedName, icon, color });
    setName('');
    setIcon('shapes');
    setColor('slate');
  }

  function canDelete(categoryName: string, isDefault?: boolean) {
    if (isDefault) {
      return false;
    }

    return !(
      movements.some((movement) => movement.category === categoryName) ||
      budgets.some((budget) => budget.category === categoryName) ||
      recurringExpenses.some((expense) => expense.category === categoryName)
    );
  }

  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label">Creador de categorías</p>
          <h2 className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">Personaliza tu catálogo</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar creador de categorías">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form className="space-y-5" onSubmit={submit}>
        <div>
          <label className="label">Nombre</label>
          <input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej: Auto, vacaciones, impuestos" />
        </div>

        <div>
          <label className="label">Icono</label>
          <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-10">
            {categoryIcons.map((item) => {
              const Icon = item.icon;
              const selected = icon === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className={`flex h-11 items-center justify-center rounded-lg border transition active:scale-[0.98] ${
                    selected
                      ? 'border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10'
                  }`}
                  onClick={() => setIcon(item.value)}
                  title={item.label}
                  aria-label={`Elegir icono ${item.label}`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Color</label>
          <div className="mt-2 grid grid-cols-7 gap-2 sm:grid-cols-11 lg:grid-cols-12">
            {categoryColors.map((item) => {
              const selected = color === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className={`flex h-10 items-center justify-center rounded-lg border transition active:scale-[0.98] ${
                    selected
                      ? 'border-zinc-950 bg-zinc-950 dark:border-white dark:bg-white'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/10'
                  }`}
                  onClick={() => setColor(item.value)}
                  title={item.label}
                  aria-label={`Elegir color ${item.label}`}
                >
                  <span className={`h-5 w-5 rounded-full ${item.dot}`} />
                </button>
              );
            })}
          </div>
        </div>

        <Button icon={<Plus className="h-4 w-4" />}>Crear categoría</Button>
      </form>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const deletable = canDelete(category.name, category.isDefault);

          return (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-2 dark:border-white/10">
              <div className="flex min-w-0 items-center gap-2">
                <CategoryIcon category={category.name} />
                <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{category.name}</span>
              </div>
              <button
                className="icon-button h-9 w-9"
                disabled={!deletable}
                onClick={() => deleteCategory(category.id)}
                aria-label={`Eliminar categoría ${category.name}`}
                title={deletable ? 'Eliminar categoría' : 'No se puede eliminar una categoría predeterminada o en uso'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
