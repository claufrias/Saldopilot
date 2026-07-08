import { Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { CategoryIcon } from './CategoryBadge';

interface CategoryManagerProps {
  onClose: () => void;
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const { categories, movements, budgets, recurringExpenses, deleteCategory } = useApp();
  const navigate = useNavigate();

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
          <p className="label">Categorias</p>
          <h2 className="mt-1 text-lg font-bold text-zinc-950 dark:text-white">Personaliza tu catalogo</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar categorias">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Button
        type="button"
        icon={<Plus className="h-4 w-4" />}
        onClick={() => {
          onClose();
          navigate('/categorias/nueva');
        }}
      >
        Crear categoria
      </Button>

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
                aria-label={`Eliminar categoria ${category.name}`}
                title={deletable ? 'Eliminar categoria' : 'No se puede eliminar una categoria predeterminada o en uso'}
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
