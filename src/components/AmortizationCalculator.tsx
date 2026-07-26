import { useMemo, useState } from 'react';
import { Calculator, TrendingDown, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { computeAmortization, financedAmount } from '../store';
import type { PaymentFrequency } from '../types';
import { fmtMoney, fmtPct } from './ui';

export function AmortizationCalculator({
  cost,
  downPct,
  rate,
  termMonths,
  frequency,
}: {
  cost: number;
  downPct: number;
  rate: number;
  termMonths: number;
  frequency: PaymentFrequency;
}) {
  const [showChart, setShowChart] = useState(true);
  const rows = useMemo(
    () => computeAmortization(financedAmount(cost, downPct), rate, termMonths, frequency),
    [cost, downPct, rate, termMonths, frequency],
  );

  const financed = financedAmount(cost, downPct);
  const downAmount = cost - financed;
  const totalPaid = rows.reduce((a, r) => a + r.payment, 0);
  const totalInterest = rows.reduce((a, r) => a + r.interest, 0);
  const periodsPerYear =
    frequency === 'semanal' ? 52 : frequency === 'quincenal' ? 24 : 12;
  const totalPeriods = Math.round((termMonths / 12) * periodsPerYear);
  const payment = rows[0]?.payment ?? 0;

  const chartData = rows.map((r) => ({
    n: `C${r.number}`,
    principal: r.principal,
    interest: r.interest,
  }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryTile label="Inicial" value={fmtMoney(downAmount)} hint={`${downPct}% del costo`} />
        <SummaryTile label="Monto financiado" value={fmtMoney(financed)} hint={`Costo ${fmtMoney(cost)}`} />
        <SummaryTile
          label="Cuota"
          value={fmtMoney(payment)}
          hint={`${frequency} · ${totalPeriods} cuotas`}
          highlight
        />
        <SummaryTile label="Interés total" value={fmtMoney(totalInterest)} hint={`Tasa ${rate}% anual`} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <TrendingDown size={15} className="text-accent-400" />
          Total a pagar: <span className="font-mono text-white">{fmtMoney(totalPaid + downAmount)}</span>
        </div>
        <button
          onClick={() => setShowChart((v) => !v)}
          className="btn-ghost px-2.5 py-1.5 text-xs"
        >
          <Calendar size={13} /> {showChart ? 'Ocultar gráfico' : 'Ver gráfico'}
        </button>
      </div>

      {/* Chart */}
      {showChart && (
        <div className="h-48 rounded-xl border border-white/5 bg-ink-900/40 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -18, right: 4, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2942" vertical={false} />
              <XAxis dataKey="n" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #1c2942',
                  borderRadius: 10,
                  fontSize: 11,
                }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="principal" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="interest" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Schedule table */}
      <div className="max-h-72 overflow-y-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-ink-850 backdrop-blur-sm">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Cuota</th>
              <th className="px-3 py-2.5 font-medium">Capital</th>
              <th className="px-3 py-2.5 font-medium">Interés</th>
              <th className="px-3 py-2.5 font-medium text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.number} className="table-row">
                <td className="px-3 py-2 font-mono text-slate-400">{r.number}</td>
                <td className="px-3 py-2 font-mono text-white">{fmtMoney(r.payment)}</td>
                <td className="px-3 py-2 font-mono text-accent-300">{fmtMoney(r.principal)}</td>
                <td className="px-3 py-2 font-mono text-violet-400">{fmtMoney(r.interest)}</td>
                <td className="px-3 py-2 font-mono text-right text-slate-300">{fmtMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? 'border-accent-500/30 bg-accent-500/10'
          : 'border-white/5 bg-ink-900/40'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-white">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

export { Calculator };
