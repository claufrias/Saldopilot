import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-zinc-950 dark:text-white sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-5 text-zinc-500 dark:text-zinc-400 sm:mt-2">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
