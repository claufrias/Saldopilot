import type { AppCategory, Category } from '../types';

export const DEFAULT_CATEGORIES: AppCategory[] = [
  { id: 'category-food', name: 'Comida', icon: 'utensils', color: 'emerald', isDefault: true },
  { id: 'category-transport', name: 'Transporte', icon: 'bus', color: 'sky', isDefault: true },
  { id: 'category-services', name: 'Servicios', icon: 'zap', color: 'amber', isDefault: true },
  { id: 'category-streaming', name: 'Streaming', icon: 'clapperboard', color: 'violet', isDefault: true },
  { id: 'category-health', name: 'Salud', icon: 'heart-pulse', color: 'rose', isDefault: true },
  { id: 'category-pets', name: 'Mascotas', icon: 'paw-print', color: 'orange', isDefault: true },
  { id: 'category-work', name: 'Trabajo', icon: 'briefcase', color: 'zinc', isDefault: true },
  { id: 'category-education', name: 'Educación', icon: 'graduation-cap', color: 'indigo', isDefault: true },
  { id: 'category-shopping', name: 'Compras', icon: 'shopping-bag', color: 'fuchsia', isDefault: true },
  { id: 'category-gifts', name: 'Regalos', icon: 'gift', color: 'pink', isDefault: true },
  { id: 'category-other', name: 'Otros', icon: 'shapes', color: 'slate', isDefault: true },
];

export const CATEGORIES: Category[] = DEFAULT_CATEGORIES.map((category) => category.name);

export const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
