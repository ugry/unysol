import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
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

const monthNames: Record<string, string> = {
  '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis', '05': 'May', '06': 'Haz',
  '07': 'Tem', '08': 'Ağu', '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara',
};

function formatAy(ay: string): string {
  if (ay.length === 7) {
    const m = ay.substring(5, 7);
    const y = ay.substring(2, 4);
    return `${monthNames[m] || m} '${y}`;
  }
  return ay;
}

const mockPredictions: Prediction[] = Array.from({ length: 12 }, (_, i) => {
  const month = new Date(2026, 5 + i, 1);
  const mm = String(month.getMonth() + 1).padStart(2, '0');
  const ay = `2026-${mm}`;
  const base = 180000 + i * 12000;
  return {
    ay,
    tahmini_gelir: base + Math.round(Math.random() * 20000),
    tahmini_gider: Math.round(base * 0.65) + Math.round(Math.random() * 10000),
    tahmini_kar: Math.round(base * 0.35) - Math.round(Math.random() * 5000),
    guven_araligi: `±${8 + i}%`,
  };
});

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchPredictions = () => {
    setLoading(true);
    api
      .get<Prediction[]>('/api/tenant/predictions/12-months')
      .then((res) => {
        setPredictions(res.data);
      })
      .catch(() => {
        setPredictions(mockPredictions);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.post('/api/tenant/predictions/recalculate');
      fetchPredictions();
    } catch {
      fetchPredictions();
    } finally {
      setRecalculating(false);
    }
  };

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

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FF5F03] hover:bg-[#e05502] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={16} className={recalculating ? 'animate-spin' : ''} />
          {recalculating ? 'Hesaplanıyor...' : 'Yeniden Hesapla'}
        </button>
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
                  <td className="px-5 py-3"><span className="text-sm font-medium text-[#f7f8f8]">{formatAy(p.ay)}</span></td>
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
              <span className="text-sm font-semibold text-[#f7f8f8]">{formatAy(p.ay)}</span>
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
