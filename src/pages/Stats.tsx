import { BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { getCategoryColor } from '../components/category/CategoryBadge';
import { MONTHS } from '../data/constants';
import { useApp } from '../context/AppContext';
import { getCurrentYear } from '../utils/date';
import { formatCurrency } from '../utils/format';
import { expensesByCategory, getMonthMovements, getMovementsWithFinancialStart, monthlyBars, yearsFromMovements } from '../utils/finance';

export function Stats() {
  const { movements, categories, financialStart } = useApp();
  const chartMovements = getMovementsWithFinancialStart(movements, financialStart);
  const [year, setYear] = useState(getCurrentYear());
  const years = yearsFromMovements(chartMovements);
  const yearMovements = useMemo(
    () => chartMovements.filter((movement) => new Date(`${movement.date}T00:00:00`).getFullYear() === year),
    [chartMovements, year],
  );
  const pieData = expensesByCategory(getMonthMovements(chartMovements), categories.map((category) => category.name));
  const categoryColorMap = new Map(categories.map((category) => [category.name, getCategoryColor(category.color).hex]));
  const monthlyData = monthlyBars(chartMovements, year).map((item, index) => ({
    ...item,
    month: MONTHS[index].slice(0, 3),
  }));

  if (yearMovements.length === 0 && chartMovements.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-5 w-5" />}
        title="Sin datos para graficar"
        description="Crea movimientos de ingresos y gastos para ver la evolución de tus finanzas."
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Estadísticas"
        description="Visualiza categorías de gasto, totales mensuales y evolución de ingresos contra gastos."
        action={
          <select className="field w-full sm:w-40" value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        }
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Gastos por categoría">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="amount" nameKey="category" innerRadius={70} outerRadius={110} paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.category} fill={categoryColorMap.get(entry.category) ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-20 text-center text-sm text-zinc-500 dark:text-zinc-400">No hay gastos este mes.</p>
          )}
        </ChartPanel>

        <ChartPanel title="Barras mensuales">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <ChartPanel title="Evolución de ingresos y gastos">
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-white">{title}</h2>
      <div className="min-h-80">{children}</div>
    </section>
  );
}
