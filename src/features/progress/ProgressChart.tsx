import { CartesianGrid, Line, LineChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '../../components/ui';
import { dateLabel, number } from '../../utils/format';
import { localDate } from '../history/analytics';

type Point = { date: string; value: number | null };
export default function ProgressChart({ points, label, unit = '', bars = false }: { points: Point[]; label: string; unit?: string; bars?: boolean }) {
  if (!points.some(p => p.value !== null)) return <EmptyState title="Sem dados no período" description="Finalize um treino ou escolha um período maior para ver sua evolução." />;
  const chartData = points.map(p => ({ ...p, label: dateLabel(+localDate(p.date), { day: '2-digit', month: 'short' }) }));
  const axes = <>
    <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
    <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={30} dy={6} />
    <YAxis width={42} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={number} />
    <Tooltip formatter={value => [`${number(Number(value))}${unit ? ` ${unit}` : ''}`, label]}
      labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? dateLabel(+localDate(payload[0].payload.date), { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text)', fontSize: 12 }}
      labelStyle={{ color: 'var(--muted)' }} cursor={{ stroke: 'var(--line)' }} />
  </>;
  return <figure className="progress-chart" aria-label={`${label} por data`}>
    <ResponsiveContainer width="100%" height={190} minWidth={0}>
      {bars ? <BarChart data={chartData} margin={{ top: 12, right: 10, bottom: 8, left: -10 }} accessibilityLayer>
        {axes}<Bar dataKey="value" name={label} fill="var(--accent, #ed5b3c)" radius={[5, 5, 0, 0]} maxBarSize={24} isAnimationActive={false} />
      </BarChart> : <LineChart data={chartData} margin={{ top: 12, right: 10, bottom: 8, left: -10 }} accessibilityLayer>
        {axes}<Line dataKey="value" name={label} type="linear" stroke="var(--accent, #ed5b3c)" strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 0, fill: 'var(--accent, #ed5b3c)' }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
      </LineChart>}
    </ResponsiveContainer>
    <figcaption className="history-sr">{points.map(p => `${dateLabel(+localDate(p.date))}: ${p.value === null ? 'sem registro' : `${number(p.value)} ${unit}`}`).join('; ')}</figcaption>
  </figure>;
}
