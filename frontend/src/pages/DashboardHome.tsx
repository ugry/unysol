import { useState, useEffect } from 'react';
import {
  Truck,
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import type { DashboardSummary, Activity } from '@/types';
import KpiCard from '@/components/KpiCard';

export default function DashboardHome() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .get<DashboardSummary>('/api/tenant/dashboard/summary')
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          setSummary(getMockSummary());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5F03]" size={32} />
          <span className="text-[14px] text-[#8a8f98]">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#8a8f98]">
          <AlertCircle size={32} />
          <span className="text-[14px]">
            {error || 'Veriler yüklenemedi. Lütfen tekrar deneyin.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Truck} label="Aktif Kamyon" value={summary.aktif_kamyon} />
        <KpiCard
          icon={DollarSign}
          label="Bugünkü Kazanç"
          value={`₺${summary.bugunku_kazanc.toLocaleString('tr-TR')}`}
        />
        <KpiCard
          icon={TrendingUp}
          label="Bu Ay Kâr"
          value={`₺${summary.bu_ay_kar.toLocaleString('tr-TR')}`}
          trend={12.5}
        />
        <KpiCard
          icon={Clock}
          label="Bekleyen Tahsilat"
          value={`₺${summary.bekleyen_tahsilat.toLocaleString('tr-TR')}`}
          overdue={summary.bekleyen_tahsilat > 50000}
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-[14px] font-[590] text-[#f7f8f8] mb-4">
            Aylık Gelir
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.aylik_gelir} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#8a8f98"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8a8f98"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `₺${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#191a1b',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    color: '#f7f8f8',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [
                    `₺${value.toLocaleString('tr-TR')}`,
                    'Gelir',
                  ]}
                  labelStyle={{ color: '#d0d6e0' }}
                />
                <Bar
                  dataKey="gelir"
                  fill="#FF5F03"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-[14px] font-[590] text-[#f7f8f8] mb-4">
            Son Aktiviteler
          </h3>
          <div className="space-y-3">
            {summary.son_aktiviteler.length === 0 && (
              <p className="text-[13px] text-[#8a8f98] text-center py-8">
                Henüz aktivite bulunmuyor
              </p>
            )}
            {summary.son_aktiviteler.map((activity: Activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-2 pb-3 border-b border-[rgba(255,255,255,0.05)] last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-[#d0d6e0] truncate">
                    {activity.aciklama}
                  </p>
                  <p className="text-[11px] text-[#62666d] mt-0.5">
                    {formatDate(activity.tarih)}
                  </p>
                </div>
                {activity.tutar !== undefined && (
                  <span
                    className={`text-[14px] font-[510] flex-shrink-0 ${
                      activity.tutar >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    {activity.tutar >= 0 ? '+' : ''}₺
                    {Math.abs(activity.tutar).toLocaleString('tr-TR')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getMockSummary(): DashboardSummary {
  return {
    aktif_kamyon: 14,
    bugunku_kazanc: 24500,
    bu_ay_kar: 187500,
    bekleyen_tahsilat: 92000,
    aylik_gelir: [
      { month: 'Oca', gelir: 120000 },
      { month: 'Şub', gelir: 145000 },
      { month: 'Mar', gelir: 132000 },
      { month: 'Nis', gelir: 168000 },
      { month: 'May', gelir: 187500 },
      { month: 'Haz', gelir: 155000 },
    ],
    son_aktiviteler: [
      {
        id: '1',
        aciklama: '34 ABC 123 plakalı araç İstanbul\'a vardı',
        tarih: new Date().toISOString(),
      },
      {
        id: '2',
        aciklama: 'Fatura #2024-0042 kesildi - ABC Lojistik',
        tarih: new Date(Date.now() - 3600000).toISOString(),
        tutar: 8500,
      },
      {
        id: '3',
        aciklama: 'Yeni araç kaydı: 06 XYZ 456',
        tarih: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '4',
        aciklama: 'Bakım bildirimi: 35 DEF 789',
        tarih: new Date(Date.now() - 86400000).toISOString(),
        tutar: -2500,
      },
      {
        id: '5',
        aciklama: 'Sefer #1087 tamamlandı - Ankara - İzmir',
        tarih: new Date(Date.now() - 172800000).toISOString(),
        tutar: 12000,
      },
    ],
  };
}
