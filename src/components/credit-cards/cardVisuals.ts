export const cardColors = [
  { value: 'slate', label: 'Grafito', className: 'from-slate-950 to-slate-700', textClassName: 'text-white' },
  { value: 'emerald', label: 'Esmeralda', className: 'from-emerald-700 to-teal-500', textClassName: 'text-white' },
  { value: 'sky', label: 'Atlantico', className: 'from-sky-800 to-cyan-500', textClassName: 'text-white' },
  { value: 'rose', label: 'Rubi', className: 'from-rose-800 to-pink-500', textClassName: 'text-white' },
  { value: 'amber', label: 'Dorado', className: 'from-amber-700 to-yellow-500', textClassName: 'text-white' },
  { value: 'obsidian', label: 'Obsidiana', className: 'from-zinc-950 via-neutral-900 to-stone-800', textClassName: 'text-white' },
  { value: 'platinum', label: 'Platino', className: 'from-zinc-200 via-white to-zinc-400', textClassName: 'text-zinc-950' },
  { value: 'champagne', label: 'Champagne', className: 'from-yellow-100 via-amber-200 to-stone-300', textClassName: 'text-zinc-950' },
  { value: 'sapphire', label: 'Zafiro', className: 'from-blue-950 via-blue-700 to-cyan-500', textClassName: 'text-white' },
  { value: 'amethyst', label: 'Amatista', className: 'from-purple-950 via-violet-700 to-fuchsia-500', textClassName: 'text-white' },
];

export function getCardColor(color: string): string {
  return cardColors.find((item) => item.value === color)?.className ?? cardColors[0].className;
}

export function getCardTextColor(color: string): string {
  return cardColors.find((item) => item.value === color)?.textClassName ?? cardColors[0].textClassName;
}

export function getCardColorLabel(color: string): string {
  return cardColors.find((item) => item.value === color)?.label ?? cardColors[0].label;
}
