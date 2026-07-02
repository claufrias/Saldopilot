export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function toMonthKey(date: string): string {
  return date.slice(0, 7);
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function isSameMonth(date: string, month: number, year: number): boolean {
  const current = new Date(`${date}T00:00:00`);
  return current.getMonth() + 1 === month && current.getFullYear() === year;
}

export function monthStartFromKey(key: string): string {
  return `${key}-01`;
}
