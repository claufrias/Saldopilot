import {
  Baby,
  Banknote,
  Beef,
  BookOpen,
  BriefcaseBusiness,
  Bus,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PawPrint,
  Plane,
  Receipt,
  Scissors,
  Shapes,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Ticket,
  Train,
  Utensils,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppCategory, Category } from '../../types';

export const categoryIcons: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: 'utensils', label: 'Comida', icon: Utensils },
  { value: 'beef', label: 'Carniceria', icon: Beef },
  { value: 'shopping-basket', label: 'Verduleria', icon: ShoppingBasket },
  { value: 'shopping-cart', label: 'Supermercado', icon: ShoppingCart },
  { value: 'bus', label: 'Colectivo', icon: Bus },
  { value: 'train', label: 'Tren', icon: Train },
  { value: 'car', label: 'Auto', icon: Car },
  { value: 'fuel', label: 'Combustible', icon: Fuel },
  { value: 'zap', label: 'Servicios', icon: Zap },
  { value: 'receipt', label: 'Factura', icon: Receipt },
  { value: 'clapperboard', label: 'Streaming', icon: Clapperboard },
  { value: 'ticket', label: 'Entradas', icon: Ticket },
  { value: 'heart-pulse', label: 'Salud', icon: HeartPulse },
  { value: 'dumbbell', label: 'Gimnasio', icon: Dumbbell },
  { value: 'paw-print', label: 'Mascotas', icon: PawPrint },
  { value: 'briefcase', label: 'Trabajo', icon: BriefcaseBusiness },
  { value: 'graduation-cap', label: 'Educacion', icon: GraduationCap },
  { value: 'book-open', label: 'Libros', icon: BookOpen },
  { value: 'shopping-bag', label: 'Compras', icon: ShoppingBag },
  { value: 'shirt', label: 'Ropa', icon: Shirt },
  { value: 'gift', label: 'Regalos', icon: Gift },
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'banknote', label: 'Dinero', icon: Banknote },
  { value: 'shield', label: 'Seguro', icon: Shield },
  { value: 'smartphone', label: 'Telefono', icon: Smartphone },
  { value: 'laptop', label: 'Tecnologia', icon: Laptop },
  { value: 'coffee', label: 'Cafe', icon: Coffee },
  { value: 'plane', label: 'Viajes', icon: Plane },
  { value: 'baby', label: 'Familia', icon: Baby },
  { value: 'scissors', label: 'Belleza', icon: Scissors },
  { value: 'gamepad', label: 'Juegos', icon: Gamepad2 },
  { value: 'wrench', label: 'Reparaciones', icon: Wrench },
  { value: 'sparkles', label: 'Especial', icon: Sparkles },
  { value: 'shapes', label: 'Otros', icon: Shapes },
];

export const categoryColors = [
  { value: 'emerald', label: 'Verde', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30', soft: 'bg-emerald-50/70 dark:bg-emerald-500/10', hex: '#10b981' },
  { value: 'sky', label: 'Azul', className: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-500/30', soft: 'bg-sky-50/70 dark:bg-sky-500/10', hex: '#0ea5e9' },
  { value: 'amber', label: 'Ambar', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30', soft: 'bg-amber-50/70 dark:bg-amber-500/10', hex: '#f59e0b' },
  { value: 'violet', label: 'Violeta', className: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300', dot: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-500/30', soft: 'bg-violet-50/70 dark:bg-violet-500/10', hex: '#8b5cf6' },
  { value: 'rose', label: 'Rosa', className: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-500/30', soft: 'bg-rose-50/70 dark:bg-rose-500/10', hex: '#f43f5e' },
  { value: 'orange', label: 'Naranja', className: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-500/30', soft: 'bg-orange-50/70 dark:bg-orange-500/10', hex: '#f97316' },
  { value: 'zinc', label: 'Zinc', className: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300', dot: 'bg-zinc-500', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-200 dark:border-white/10', soft: 'bg-zinc-50 dark:bg-white/5', hex: '#71717a' },
  { value: 'indigo', label: 'Indigo', className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300', dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-500/30', soft: 'bg-indigo-50/70 dark:bg-indigo-500/10', hex: '#6366f1' },
  { value: 'fuchsia', label: 'Fucsia', className: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300', dot: 'bg-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-500/30', soft: 'bg-fuchsia-50/70 dark:bg-fuchsia-500/10', hex: '#d946ef' },
  { value: 'pink', label: 'Pink', className: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300', dot: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-500/30', soft: 'bg-pink-50/70 dark:bg-pink-500/10', hex: '#ec4899' },
  { value: 'slate', label: 'Pizarra', className: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', dot: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-500/30', soft: 'bg-slate-50 dark:bg-slate-500/10', hex: '#64748b' },
  { value: 'cyan', label: 'Cian', className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300', dot: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-500/30', soft: 'bg-cyan-50/70 dark:bg-cyan-500/10', hex: '#06b6d4' },
  { value: 'teal', label: 'Teal', className: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300', dot: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-500/30', soft: 'bg-teal-50/70 dark:bg-teal-500/10', hex: '#14b8a6' },
  { value: 'lime', label: 'Lima', className: 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300', dot: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-500/30', soft: 'bg-lime-50/70 dark:bg-lime-500/10', hex: '#84cc16' },
  { value: 'green', label: 'Green', className: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300', dot: 'bg-green-500', text: 'text-green-600 dark:text-green-300', border: 'border-green-200 dark:border-green-500/30', soft: 'bg-green-50/70 dark:bg-green-500/10', hex: '#22c55e' },
  { value: 'yellow', label: 'Amarillo', className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300', dot: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-500/30', soft: 'bg-yellow-50/70 dark:bg-yellow-500/10', hex: '#eab308' },
  { value: 'red', label: 'Rojo', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-300', border: 'border-red-200 dark:border-red-500/30', soft: 'bg-red-50/70 dark:bg-red-500/10', hex: '#ef4444' },
  { value: 'purple', label: 'Purpura', className: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300', dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-500/30', soft: 'bg-purple-50/70 dark:bg-purple-500/10', hex: '#a855f7' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-500/30', soft: 'bg-blue-50/70 dark:bg-blue-500/10', hex: '#3b82f6' },
  { value: 'stone', label: 'Stone', className: 'bg-stone-100 text-stone-700 dark:bg-stone-500/10 dark:text-stone-300', dot: 'bg-stone-500', text: 'text-stone-700 dark:text-stone-300', border: 'border-stone-200 dark:border-stone-500/30', soft: 'bg-stone-50 dark:bg-stone-500/10', hex: '#78716c' },
  { value: 'neutral', label: 'Neutral', className: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/10 dark:text-neutral-300', dot: 'bg-neutral-500', text: 'text-neutral-700 dark:text-neutral-300', border: 'border-neutral-200 dark:border-neutral-500/30', soft: 'bg-neutral-50 dark:bg-neutral-500/10', hex: '#737373' },
];

export function getCategoryIcon(icon: string) {
  return categoryIcons.find((item) => item.value === icon) ?? categoryIcons[categoryIcons.length - 1];
}

export function getCategoryColor(color: string) {
  return categoryColors.find((item) => item.value === color) ?? categoryColors[10];
}

export function findCategoryMeta(categories: AppCategory[], category: Category): AppCategory {
  return categories.find((item) => item.name === category) ?? { id: category, name: category, icon: 'shapes', color: 'slate' };
}

export function getCategoryColorFor(categories: AppCategory[], category: Category) {
  return getCategoryColor(findCategoryMeta(categories, category).color);
}

export function useCategoryMeta(category: Category) {
  const { categories } = useApp();
  return findCategoryMeta(categories, category);
}

interface CategoryBadgeProps {
  category: Category;
  compact?: boolean;
}

export function CategoryBadge({ category, compact = false }: CategoryBadgeProps) {
  const meta = useCategoryMeta(category);
  const Icon = getCategoryIcon(meta.icon).icon;
  const tone = getCategoryColor(meta.color);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${tone.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {!compact ? category : null}
    </span>
  );
}

export function CategoryIcon({ category }: { category: Category }) {
  const meta = useCategoryMeta(category);
  const Icon = getCategoryIcon(meta.icon).icon;
  const tone = getCategoryColor(meta.color);

  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone.className}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
