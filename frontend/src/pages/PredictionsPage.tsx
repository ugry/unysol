import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '@/lib/api';

interface Prediction {
  ay: string;
  tahmini_gelir: number;
  tahmini_gider: number;
  tahmini_kar: number;
  guven_araligi: string;
}

const mockPredictions: Prediction[] = [
  { ay: 'Haz', tahmini_gelir: 195000, tahmini_gider: 142000, tahmini_kar: 53000, guven_araligi: '±8%' },
  { ay: 'Tem', tahmini_gelir: 210000, tahmini_gider: 148000, tahmini_kar: 62000, guven_araligi: '±9%' },
  { ay: 'Ağu', tahmini_gelir: 225000, tahmini_gider: 155000, tahmini_kar: 70000, guven_araligi: '±10%' },
  { ay: 'Eyl', tahmini_gelir: 240000, tahmini_gider: 160000, tahmini_kar: 80000, guven_araligi: '±11%' },
  { ay: 'Eki', tahmini_gelir: 255000, tahmini_gider: 168000, tahmini_kar: 87000, guven_araligi: '±12%' },
  { ay: 'Kas', tahmini_gelir: 245000, tahmini_gider: 162000, tahmini_kar: 83000, guven_araligi: '±12%' },
  { ay: 'Ara', tahmini_gelir: 260000, tahmini_gider: 170000, tahmini_kar: 90000, guven_araligi: '±13%' },
  { ay: 'Oca', tahmini_gelir: 220000, tahmini_gider: 150000, tahmini_kar: 70000, guven_araligi: '±14%' },
  { ay: 'Şub', tahmini_gelir: 230000, tahmini_gider: 155000, tahmini_kar: 75000, guven_araligi: '±14%' },
  { ay: 'Mar', tahmini_gelir: 250000, tahmini_gider: 165000, tahmini_kar: 85000, guven_araligi: '±15%' },
  { ay: 'Nis', tahmini_gelir: 265000, tahmini_gider: 172000, tahmini_kar: 93000, guven_araligi: '±15%' },
  { ay: 'May', tahmini_gelir: 280000, tahmini_gider: 178000, tahmini_kar: 102000, guven_araligi: '±16%' },
];

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Prediction[]>('/api/tenant/predictions')
      .then((res) => {
        if (!cancelled) setPredictions(res.data);
      })
      .catch(() => {
        if (!cancelled) setPredictions(mockPredictions);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5F03]" size={36} />
          <span className="text-sm text-[#8a8f98]">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const yearlyRevenue = predictions.reduce((s, p) => s + p.tahmini_gelir, 0);
  const yearlyExpense = predictions.reduce((s, p) => s + p.tahmini_gider, 0);
  const yearlyProfit = predictions.reduce((s, p) => s + p.tahmini_kar, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8a8f98] font-medium">Yıllık Tahmini Gelir</span>
            <div className="w-9 h-9 rounded-lg bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#f7f8f8]">₺{yearlyRevenue.toLocaleString('tr-TR')}</span>
        </div>
        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8a8f98] font-medium">Yıllık Tahmini Gider</span>
            <div className="w-9 h-9 rounded-lg bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
              <TrendingDown size={20} />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#f7f8f8]">₺{yearlyExpense.toLocaleString('tr-TR')}</span>
        </div>
        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#8a8f98] font-medium">Yıllık Tahmini Kâr</span>
            <div className="w-9 h-9 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center text-[#FF5F03]">
              <DollarSign size={20} />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#f7f8f8]">₺{yearlyProfit.toLocaleString('tr-TR')}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">12 Aylık Tahmin</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictions} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis
                dataKey="ay"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `₺${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#fafafa',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, undefined]}
                labelStyle={{ color: '#888888' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#888888' }}
              />
              <Line
                type="monotone"
                dataKey="tahmini_gelir"
                name="Gelir"
                stroke="#16A34A"
                strokeWidth={2}
                dot={{ fill: '#16A34A', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="tahmini_gider"
                name="Gider"
                stroke="#DC2626"
                strokeWidth={2}
                dot={{ fill: '#DC2626', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="tahmini_kar"
                name="Kâr"
                stroke="#FF5F03"
                strokeWidth={2}
                dot={{ fill: '#FF5F03', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="hidden md:block bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="text-left text-xs font-medium text-[#8a8f98] uppercase tracking-wider px-5 py-3.5">Ay</th>
                <th className="text-right text-xs font-medium text-[#8a8f98] uppercase tracking-wider px-5 py-3.5">Tahmini Gelir</th>
                <th className="text-right text-xs font-medium text-[#8a8f98] uppercase tracking-wider px-5 py-3.5">Tahmini Gider</th>
                <th className="text-right text-xs font-medium text-[#8a8f98] uppercase tracking-wider px-5 py-3.5">Tahmini Kâr</th>
                <th className="text-center text-xs font-medium text-[#8a8f98] uppercase tracking-wider px-5 py-3.5">Güven Aralığı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {predictions.map((p, i) => (
                <tr key={i} className="hover:bg-[#191a1b] transition-colors">
                  <td className="px-5 py-3"><span className="text-sm font-medium text-[#f7f8f8]">{p.ay}</span></td>
                  <td className="px-5 py-3 text-right"><span className="text-sm text-[#16A34A] font-medium">₺{p.tahmini_gelir.toLocaleString('tr-TR')}</span></td>
                  <td className="px-5 py-3 text-right"><span className="text-sm text-[#DC2626] font-medium">₺{p.tahmini_gider.toLocaleString('tr-TR')}</span></td>
                  <td className="px-5 py-3 text-right"><span className="text-sm text-[#FF5F03] font-medium">₺{p.tahmini_kar.toLocaleString('tr-TR')}</span></td>
                  <td className="px-5 py-3 text-center"><span className="text-xs text-[#8a8f98] bg-[#191a1b] px-2 py-1 rounded">{p.guven_araligi}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {predictions.map((p, i) => (
          <div key={i} className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#f7f8f8]">{p.ay}</span>
              <span className="text-xs text-[#8a8f98] bg-[#191a1b] px-2 py-0.5 rounded">Güven: {p.guven_araligi}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-[#16A34A] font-semibold">₺{(p.tahmini_gelir / 1000).toFixed(0)}K</div>
                <div className="text-[10px] text-[#62666d]">Gelir</div>
              </div>
              <div>
                <div className="text-[#DC2626] font-semibold">₺{(p.tahmini_gider / 1000).toFixed(0)}K</div>
                <div className="text-[10px] text-[#62666d]">Gider</div>
              </div>
              <div>
                <div className="text-[#FF5F03] font-semibold">₺{(p.tahmini_kar / 1000).toFixed(0)}K</div>
                <div className="text-[10px] text-[#62666d]">Kâr</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
