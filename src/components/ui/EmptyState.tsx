import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="panel flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-zinc-950 dark:text-white">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  );
}
