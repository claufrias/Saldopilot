import { ArrowLeft, ArrowRight, Check, Palette, Shapes, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryIcon, categoryColors, categoryIcons, getCategoryColor, getCategoryIcon } from '../components/category/CategoryBadge';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';

type CategoryStep = 'name' | 'icon' | 'color' | 'review';

const steps: CategoryStep[] = ['name', 'icon', 'color', 'review'];

export function CreateCategory() {
  const navigate = useNavigate();
  const { categories, addCategory } = useApp();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('shapes');
  const [color, setColor] = useState('slate');
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const currentStep = steps[stepIndex];
  const trimmedName = name.trim();
  const duplicate = useMemo(
    () => categories.some((category) => category.name.trim().toLowerCase() === trimmedName.toLowerCase()),
    [categories, trimmedName],
  );
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const SelectedIcon = getCategoryIcon(icon).icon;
  const selectedColor = getCategoryColor(color);

  function goToStep(nextIndex: number) {
    const safeIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
    setDirection(safeIndex > stepIndex ? 'forward' : 'back');
    setStepIndex(safeIndex);
  }

  function canContinue() {
    if (currentStep === 'name') {
      return trimmedName.length > 0 && !duplicate;
    }

    return true;
  }

  function next() {
    if (!canContinue()) {
      return;
    }

    if (currentStep === 'review') {
      addCategory({ name: trimmedName, icon, color });
      navigate('/movimientos', { state: { showCategoryManager: true } });
      return;
    }

    goToStep(stepIndex + 1);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button className="icon-button" type="button" onClick={() => navigate('/movimientos')} aria-label="Volver a movimientos">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="label">Categorias</p>
          <h1 className="truncate text-2xl font-bold text-zinc-950 dark:text-white sm:text-3xl">Crear categoria</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="panel overflow-hidden">
          <div className="border-b border-zinc-200/80 px-4 py-4 dark:border-white/10 sm:px-5">
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <StepIcon step={currentStep} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-950 dark:text-white">{stepTitle(currentStep)}</p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Paso {stepIndex + 1} de {steps.length}
                </p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-zinc-950 transition-all duration-200 ease-out dark:bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="min-h-[25rem] p-4 sm:p-5">
            <div key={currentStep} className={`guided-step guided-step-${direction}`}>
              {currentStep === 'name' ? (
                <StepBlock title="Nombre">
                  <Field label="Nombre">
                    <input
                      className="field mt-2 text-lg font-bold"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ej: Auto, vacaciones, impuestos"
                      autoFocus
                    />
                  </Field>
                  {duplicate ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      Ya existe una categoria con ese nombre.
                    </p>
                  ) : null}
                </StepBlock>
              ) : null}

              {currentStep === 'icon' ? (
                <StepBlock title="Icono">
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-8">
                    {categoryIcons.map((item) => {
                      const Icon = item.icon;
                      const selected = icon === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`flex h-12 items-center justify-center rounded-lg border transition active:scale-[0.98] ${
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
                </StepBlock>
              ) : null}

              {currentStep === 'color' ? (
                <StepBlock title="Color">
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-8">
                    {categoryColors.map((item) => {
                      const selected = color === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`flex h-12 items-center justify-center rounded-lg border transition active:scale-[0.98] ${
                            selected
                              ? 'border-zinc-950 bg-zinc-950 dark:border-white dark:bg-white'
                              : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/10'
                          }`}
                          onClick={() => setColor(item.value)}
                          title={item.label}
                          aria-label={`Elegir color ${item.label}`}
                        >
                          <span className={`h-6 w-6 rounded-full ${item.dot}`} />
                        </button>
                      );
                    })}
                  </div>
                </StepBlock>
              ) : null}

              {currentStep === 'review' ? (
                <StepBlock title="Confirmar">
                  <div className="grid gap-3">
                    <ReviewRow label="Nombre" value={trimmedName || '-'} />
                    <ReviewRow label="Icono" value={getCategoryIcon(icon).label} />
                    <ReviewRow label="Color" value={selectedColor.label} />
                  </div>
                </StepBlock>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-zinc-200/80 p-4 dark:border-white/10 sm:p-5">
            <Button type="button" variant="secondary" onClick={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0} icon={<ArrowLeft className="h-4 w-4" />}>
              Atras
            </Button>
            <Button type="button" onClick={next} disabled={!canContinue()} icon={currentStep === 'review' ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}>
              {currentStep === 'review' ? 'Crear categoria' : 'Continuar'}
            </Button>
          </div>
        </section>

        <aside className="panel p-4 lg:sticky lg:top-6">
          <p className="label">Vista previa</p>
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${selectedColor.className}`}>
                <SelectedIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-zinc-950 dark:text-white">{trimmedName || 'Nombre de categoria'}</p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{getCategoryIcon(icon).label}</p>
              </div>
            </div>
          </div>
          {categories.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Existentes</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 10).map((category) => (
                  <span key={category.id} className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                    <CategoryIcon category={category.name} />
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function stepTitle(step: CategoryStep) {
  const titles: Record<CategoryStep, string> = {
    name: 'Nombre',
    icon: 'Icono',
    color: 'Color',
    review: 'Confirmar',
  };

  return titles[step];
}

function StepIcon({ step }: { step: CategoryStep }) {
  const icons: Record<CategoryStep, ReactNode> = {
    name: <Tag className="h-4 w-4" />,
    icon: <Shapes className="h-4 w-4" />,
    color: <Palette className="h-4 w-4" />,
    review: <Check className="h-4 w-4" />,
  };

  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">{icons[step]}</span>;
}

function StepBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold text-zinc-950 dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-zinc-950">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="truncate text-right text-sm font-bold text-zinc-950 dark:text-white">{value}</span>
    </div>
  );
}
