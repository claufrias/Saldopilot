import {
  Car,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Landmark,
  Music,
  Palette,
  Plane,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export const goalColors = [
  { value: 'emerald', label: 'Verde', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', text: 'text-emerald-600', bar: 'bg-emerald-500' },
  { value: 'sky', label: 'Azul', chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300', text: 'text-sky-600', bar: 'bg-sky-500' },
  { value: 'violet', label: 'Violeta', chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300', text: 'text-violet-600', bar: 'bg-violet-500' },
  { value: 'amber', label: 'Dorado', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', text: 'text-amber-600', bar: 'bg-amber-500' },
  { value: 'rose', label: 'Rosa', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300', text: 'text-rose-600', bar: 'bg-rose-500' },
  { value: 'slate', label: 'Grafito', chip: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300', text: 'text-slate-600', bar: 'bg-slate-500' },
  { value: 'orange', label: 'Naranja', chip: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300', text: 'text-orange-600', bar: 'bg-orange-500' },
  { value: 'cyan', label: 'Cian', chip: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300', text: 'text-cyan-600', bar: 'bg-cyan-500' },
  { value: 'indigo', label: 'Índigo', chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300', text: 'text-indigo-600', bar: 'bg-indigo-500' },
  { value: 'fuchsia', label: 'Fucsia', chip: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300', text: 'text-fuchsia-600', bar: 'bg-fuchsia-500' },
  { value: 'lime', label: 'Lima', chip: 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300', text: 'text-lime-600', bar: 'bg-lime-500' },
  { value: 'teal', label: 'Teal', chip: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300', text: 'text-teal-600', bar: 'bg-teal-500' },
];

export const goalIcons: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: 'target', label: 'Meta', icon: Target },
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'plane', label: 'Viaje', icon: Plane },
  { value: 'car', label: 'Auto', icon: Car },
  { value: 'laptop', label: 'Equipo', icon: Laptop },
  { value: 'graduation', label: 'Estudio', icon: GraduationCap },
  { value: 'health', label: 'Salud', icon: HeartPulse },
  { value: 'gift', label: 'Regalo', icon: Gift },
  { value: 'shield', label: 'Fondo', icon: Shield },
  { value: 'rocket', label: 'Proyecto', icon: Rocket },
  { value: 'trophy', label: 'Logro', icon: Trophy },
  { value: 'star', label: 'Deseo', icon: Star },
  { value: 'sparkles', label: 'Especial', icon: Sparkles },
  { value: 'landmark', label: 'Inversión', icon: Landmark },
  { value: 'dumbbell', label: 'Entrenamiento', icon: Dumbbell },
  { value: 'music', label: 'Música', icon: Music },
  { value: 'palette', label: 'Arte', icon: Palette },
];

export function getGoalColor(color: string) {
  return goalColors.find((item) => item.value === color) ?? goalColors[0];
}

export function getGoalIcon(icon: string) {
  return goalIcons.find((item) => item.value === icon) ?? goalIcons[0];
}

export function GoalIconBadge({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = getGoalIcon(icon).icon;
  const tone = getGoalColor(color);
  const sizes = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-12 w-12',
  };

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg ${sizes[size]} ${tone.chip}`}>
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  );
}
