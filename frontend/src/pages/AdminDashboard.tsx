import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, UserPlus, TrendingUp, Check, Globe, Settings,
  BarChart3, Activity, Search, ChevronDown, ChevronUp, Loader2,
  AlertCircle, X, LogOut, Plus, Save, Shield, Layout, Mail,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import adminApi from '@/lib/adminApi';
import { adminLogout, getStoredAdminUser } from '@/lib/adminAuth';
import DataGrid, { type Column } from '@/components/DataGrid';
import type {
  AdminDashboardSummary, AdminTenant, AdminModule, AdminCountry,
  AdminAnalyticsMmr, AdminAnalyticsChurn, AdminAnalyticsGrowth,
} from '@/types';

const tabs = [
  { id: 'overview' as const, label: 'Genel Bakış', icon: Layout },
  { id: 'tenants' as const, label: 'Firmalar', icon: Building2 },
  { id: 'modules' as const, label: 'Modüller', icon: Settings },
  { id: 'countries' as const, label: 'Ülkeler', icon: Globe },
  { id: 'analytics' as const, label: 'Analitik', icon: BarChart3 },
  { id: 'email' as const, label: 'Sistem Ayarları', icon: Mail },
];

type TabId = typeof tabs[number]['id'];

const plans = ['FREE', 'PRO', 'PREMIUM'] as const;
const planColors: Record<string, string> = {
  FREE: '#16A34A',
  PRO: '#FF5F03',
  PREMIUM: '#8b5cf6',
};

function formatCurrency(v: number): string {
  return `₺${v.toLocaleString('tr-TR')}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getMockDashboardSummary(): AdminDashboardSummary {
  return {
    toplam_firma: 148,
    aktif_firma: 132,
    mrr: 284500,
    bu_ay_yeni_kayit: 12,
    mrr_trend: [
      { month: 'May', gelir: 210000 },
      { month: 'Haz', gelir: 218000 },
      { month: 'Tem', gelir: 224000 },
      { month: 'Ağu', gelir: 235000 },
      { month: 'Eyl', gelir: 242000 },
      { month: 'Eki', gelir: 238000 },
      { month: 'Kas', gelir: 251000 },
      { month: 'Ara', gelir: 259000 },
      { month: 'Oca', gelir: 267000 },
      { month: 'Şub', gelir: 273000 },
      { month: 'Mar', gelir: 279000 },
      { month: 'Nis', gelir: 284500 },
    ],
    paket_dagilimi: [
      { paket: 'FREE', sayi: 42 },
      { paket: 'PRO', sayi: 78 },
      { paket: 'PREMIUM', sayi: 28 },
    ],
    son_kayitlar: [
      { id: '1', firma_unvani: 'İstanbul Express Lojistik', yetkili: 'Ahmet Yılmaz', plan: 'PREMIUM', kayit_tarihi: new Date(Date.now() - 86400000).toISOString() },
      { id: '2', firma_unvani: 'Anadolu Nakliyat', yetkili: 'Mehmet Demir', plan: 'PRO', kayit_tarihi: new Date(Date.now() - 172800000).toISOString() },
      { id: '3', firma_unvani: 'Ege Turizm Taşımacılık', yetkili: 'Ayşe Kaya', plan: 'FREE', kayit_tarihi: new Date(Date.now() - 259200000).toISOString() },
      { id: '4', firma_unvani: 'Karadeniz Lojistik A.Ş.', yetkili: 'Ali Öztürk', plan: 'PRO', kayit_tarihi: new Date(Date.now() - 345600000).toISOString() },
      { id: '5', firma_unvani: 'Marmara Dağıtım', yetkili: 'Zeynep Çelik', plan: 'PREMIUM', kayit_tarihi: new Date(Date.now() - 432000000).toISOString() },
    ],
  };
}

function getMockTenants(): AdminTenant[] {
  return [
    { id: '1', firma_unvani: 'İstanbul Express Lojistik', yetkili: 'Ahmet Yılmaz', email: 'ahmet@istanbulexpress.com', plan: 'PREMIUM', kayit_tarihi: '2024-01-15T10:30:00Z', son_giris: '2026-05-20T08:45:00Z', durum: 'AKTIF', telefon: '+90 212 555 0101' },
    { id: '2', firma_unvani: 'Anadolu Nakliyat', yetkili: 'Mehmet Demir', email: 'mehmet@anadolunakliyat.com', plan: 'PRO', kayit_tarihi: '2024-02-20T14:00:00Z', son_giris: '2026-05-19T17:30:00Z', durum: 'AKTIF', telefon: '+90 312 555 0202' },
    { id: '3', firma_unvani: 'Ege Turizm Taşımacılık', yetkili: 'Ayşe Kaya', email: 'ayse@egeturizm.com', plan: 'FREE', kayit_tarihi: '2024-03-10T09:15:00Z', son_giris: '2026-05-10T12:00:00Z', durum: 'PASIF', telefon: '+90 232 555 0303' },
    { id: '4', firma_unvani: 'Karadeniz Lojistik A.Ş.', yetkili: 'Ali Öztürk', email: 'ali@karadenizlojistik.com', plan: 'PRO', kayit_tarihi: '2024-04-05T16:45:00Z', son_giris: '2026-05-20T09:15:00Z', durum: 'AKTIF', telefon: '+90 462 555 0404' },
    { id: '5', firma_unvani: 'Marmara Dağıtım', yetkili: 'Zeynep Çelik', email: 'zeynep@marmaradagitim.com', plan: 'PREMIUM', kayit_tarihi: '2024-05-12T11:20:00Z', son_giris: '2026-05-20T07:30:00Z', durum: 'AKTIF', telefon: '+90 216 555 0505' },
    { id: '6', firma_unvani: 'Akdeniz Uluslararası Taşımacılık', yetkili: 'Mustafa Şahin', email: 'mustafa@akdeniztasimacilik.com', plan: 'PRO', kayit_tarihi: '2024-06-18T08:00:00Z', son_giris: '2026-05-18T14:20:00Z', durum: 'AKTIF', telefon: '+90 242 555 0606' },
    { id: '7', firma_unvani: 'GAP Tarım Lojistik', yetkili: 'Fatma Yıldız', email: 'fatma@gaplojistik.com', plan: 'FREE', kayit_tarihi: '2024-07-22T13:30:00Z', son_giris: '2026-05-01T10:00:00Z', durum: 'PASIF', telefon: '+90 414 555 0707' },
    { id: '8', firma_unvani: 'Trakya Nakliye', yetkili: 'Hasan Koç', email: 'hasan@trakyanakliye.com', plan: 'PREMIUM', kayit_tarihi: '2024-08-30T10:10:00Z', son_giris: '2026-05-20T11:00:00Z', durum: 'AKTIF', telefon: '+90 284 555 0808' },
  ];
}

function getMockModules(): AdminModule[] {
  return [
    { id: 1, module_name: 'Kimlik Doğrulama', module_key: 'auth', description: null, category: 'CORE', default_enabled: true, is_core: true, enabled_countries: ['TR'], enabled_plans: ['FREE', 'PRO', 'PREMIUM'] },
    { id: 6, module_name: 'Kamyon Takip', module_key: 'truck_tracking', description: 'Canlı GPS takip', category: 'FLEET', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['FREE', 'PRO', 'PREMIUM'] },
    { id: 19, module_name: 'Sefer Yönetimi', module_key: 'trip_mgmt', description: null, category: 'CRM', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['FREE', 'PRO', 'PREMIUM'] },
    { id: 12, module_name: 'Fatura Yönetimi', module_key: 'invoice_mgmt', description: null, category: 'FINANCE', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['PRO', 'PREMIUM'] },
    { id: 14, module_name: 'Gider Takibi', module_key: 'expense_tracking', description: null, category: 'FINANCE', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['FREE', 'PRO', 'PREMIUM'] },
    { id: 25, module_name: 'Personel Yönetimi', module_key: 'employee_mgmt', description: null, category: 'HR', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['PRO', 'PREMIUM'] },
    { id: 13, module_name: 'e-Fatura / e-Arşiv', module_key: 'e_invoice', description: null, category: 'FINANCE', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['PREMIUM'] },
    { id: 18, module_name: 'Müşteri Yönetimi', module_key: 'customer_mgmt', description: null, category: 'CRM', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['FREE', 'PRO', 'PREMIUM'] },
    { id: 21, module_name: 'Tahmin Motoru', module_key: 'predictions', description: null, category: 'ANALYTICS', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['PRO', 'PREMIUM'] },
    { id: 22, module_name: 'Raporlama', module_key: 'reports', description: null, category: 'ANALYTICS', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['PRO', 'PREMIUM'] },
    { id: 42, module_name: 'Çeviri Yönetimi', module_key: 'translations', description: null, category: 'PLATFORM', default_enabled: true, is_core: false, enabled_countries: ['TR'], enabled_plans: ['FREE', 'PRO', 'PREMIUM'] },
  ];
}

function getMockCountries(): AdminCountry[] {
  return [
    { kod: 'TR', ad: 'Türkiye', vergi_orani: 20, para_birimi: 'TRY', fatura_formati: 'E-FATURA', sofor_gereksinimleri: { src_belgesi: true, psikoteknik: true, adr: false } },
    { kod: 'DE', ad: 'Almanya', vergi_orani: 19, para_birimi: 'EUR', fatura_formati: 'XINVOICE', sofor_gereksinimleri: { ehliyet: 'CE', to_karti: true, almanca: 'B1' } },
    { kod: 'BG', ad: 'Bulgaristan', vergi_orani: 20, para_birimi: 'BGN', fatura_formati: 'STANDART', sofor_gereksinimleri: { ehliyet: 'CE', adr: false } },
  ];
}

function getMockAnalyticsMmr(): AdminAnalyticsMmr[] {
  return [
    { month: 'May', mrr: 210000, yeni: 18000, kayip: 5000 },
    { month: 'Haz', mrr: 218000, yeni: 15000, kayip: 7000 },
    { month: 'Tem', mrr: 224000, yeni: 14000, kayip: 8000 },
    { month: 'Ağu', mrr: 235000, yeni: 22000, kayip: 11000 },
    { month: 'Eyl', mrr: 242000, yeni: 19000, kayip: 12000 },
    { month: 'Eki', mrr: 238000, yeni: 16000, kayip: 20000 },
    { month: 'Kas', mrr: 251000, yeni: 25000, kayip: 12000 },
    { month: 'Ara', mrr: 259000, yeni: 18000, kayip: 10000 },
    { month: 'Oca', mrr: 267000, yeni: 21000, kayip: 13000 },
    { month: 'Şub', mrr: 273000, yeni: 14000, kayip: 8000 },
    { month: 'Mar', mrr: 279000, yeni: 17000, kayip: 11000 },
    { month: 'Nis', mrr: 284500, yeni: 16000, kayip: 10500 },
  ];
}

function getMockAnalyticsChurn(): AdminAnalyticsChurn[] {
  return [
    { month: 'May', oran: 2.8 },
    { month: 'Haz', oran: 3.1 },
    { month: 'Tem', oran: 2.5 },
    { month: 'Ağu', oran: 3.4 },
    { month: 'Eyl', oran: 2.9 },
    { month: 'Eki', oran: 4.1 },
    { month: 'Kas', oran: 2.7 },
    { month: 'Ara', oran: 2.3 },
    { month: 'Oca', oran: 2.6 },
    { month: 'Şub', oran: 1.9 },
    { month: 'Mar', oran: 2.2 },
    { month: 'Nis', oran: 2.0 },
  ];
}

function getMockAnalyticsGrowth(): AdminAnalyticsGrowth[] {
  return [
    { month: 'May', gelir: 210000, tahmin: 210000 },
    { month: 'Haz', gelir: 218000, tahmin: 218000 },
    { month: 'Tem', gelir: 224000, tahmin: 224000 },
    { month: 'Ağu', gelir: 235000, tahmin: 235000 },
    { month: 'Eyl', gelir: 242000, tahmin: 242000 },
    { month: 'Eki', gelir: 238000, tahmin: 238000 },
    { month: 'Kas', gelir: 251000, tahmin: 251000 },
    { month: 'Ara', gelir: 259000, tahmin: 259000 },
    { month: 'Oca', gelir: 267000, tahmin: 267000 },
    { month: 'Şub', gelir: 273000, tahmin: 273000 },
    { month: 'Mar', gelir: 279000, tahmin: 279000 },
    { month: 'Nis', gelir: 284500, tahmin: 284500 },
    { month: 'May', tahmin: 292000 },
    { month: 'Haz', tahmin: 300000 },
    { month: 'Tem', tahmin: 310000 },
  ];
}

function AdminKpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 flex flex-col gap-2 transition-all hover:border-[#FF5F03]/30">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#8a8f98] font-medium">{label}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          <Icon size={20} />
        </div>
      </div>
      <span className="text-2xl font-bold tracking-tight text-[#f7f8f8]">
        {value}
      </span>
    </div>
  );
}

function OverviewTab() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get('/api/admin/dashboard/summary')
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError('Veriler yüklenemedi: ' + (err?.response?.data?.error || 'bağlantı hatası')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5F03]" size={36} />
          <span className="text-sm text-[#8a8f98]">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#8a8f98]">
          <AlertCircle size={36} />
          <span className="text-sm">{error || 'Veriler yüklenemedi.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpiCard icon={Building2} label="Toplam Firma" value={data.toplam_firma} color="#FF5F03" />
        <AdminKpiCard icon={Check} label="Aktif Firma" value={data.aktif_firma} color="#16A34A" />
        <AdminKpiCard icon={TrendingUp} label="MRR" value={formatCurrency(data.mrr)} color="#f59e0b" />
        <AdminKpiCard icon={UserPlus} label="Bu Ay Yeni Kayıt" value={data.bu_ay_yeni_kayit} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">MRR Trendi (Son 12 Ay)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.mrr_trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `₺${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#FAFAFA', fontSize: '13px' }}
                  formatter={(value: number) => [formatCurrency(value), 'MRR']}
                  labelStyle={{ color: '#888' }}
                />
                <Line type="monotone" dataKey="gelir" stroke="#FF5F03" strokeWidth={2} dot={{ fill: '#FF5F03', r: 3 }} activeDot={{ r: 5, fill: '#FF5F03' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Paket Dağılımı</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.paket_dagilimi} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="paket" stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#FAFAFA', fontSize: '13px' }}
                  formatter={(value: number) => [value, 'Firma']}
                  labelStyle={{ color: '#888' }}
                />
                <Bar dataKey="sayi" radius={[6, 6, 0, 0]}>
                  {(data.paket_dagilimi || []).map((entry, idx) => (
                    <rect key={idx} fill={planColors[entry.paket] || '#FF5F03'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Son 5 Kayıt</h3>
        {data.son_kayitlar.length === 0 ? (
          <p className="text-sm text-[#8a8f98] text-center py-8">Henüz kayıt bulunmuyor</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8a8f98] border-b border-[rgba(255,255,255,0.08)]">
                  <th className="text-left py-2 pr-4 font-medium">Firma Adı</th>
                  <th className="text-left py-2 pr-4 font-medium">Yetkili</th>
                  <th className="text-left py-2 pr-4 font-medium">Plan</th>
                  <th className="text-left py-2 font-medium">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {(data.son_kayitlar || []).map((kayit) => (
                  <tr key={kayit.id} className="border-b border-[rgba(255,255,255,0.08)] last:border-0">
                    <td className="py-3 pr-4 text-[#f7f8f8]">{kayit.firma_unvani}</td>
                    <td className="py-3 pr-4 text-[#8a8f98]">{kayit.yetkili}</td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${planColors[kayit.plan]}20`, color: planColors[kayit.plan] }}
                      >
                        {kayit.plan}
                      </span>
                    </td>
                    <td className="py-3 text-[#8a8f98]">{formatDate(kayit.kayit_tarihi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TenantsTab() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');
  const [planLoading, setPlanLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<AdminTenant[]>('/api/admin/tenants')
      .then((res) => { if (!cancelled) setTenants(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = planFilter ? tenants.filter(t => t.plan === planFilter) : tenants;

  const handlePlanChange = async (id: string, newPlan: AdminTenant['plan']) => {
    setPlanLoading(id);
    try {
      await adminApi.put(`/api/admin/tenants/${id}/plan`, { plan: newPlan });
      setTenants(prev => prev.map(t => (t.id === id ? { ...t, plan: newPlan } : t)));
    } catch {}
    setPlanLoading(null);
  };

  const handleSuspend = async (id: string, tenant: AdminTenant) => {
    const newStatus = tenant.durum === 'AKTIF' ? 'PASIF' as const : 'AKTIF' as const;
    try {
      await adminApi.post(`/api/admin/tenants/${id}/suspend`, { durum: newStatus });
      setTenants(prev => prev.map(t => (t.id === id ? { ...t, durum: newStatus } : t)));
    } catch {}
  };

  const columns: Column<AdminTenant>[] = [
    { key: 'firma_unvani', header: 'Firma', render: (row) => (
      <div className="space-y-1">
        <div className="text-enterprise-text font-medium text-sm">{row.firma_unvani}</div>
        <div className="text-xs text-enterprise-text-muted">{row.email}</div>
      </div>
    )},
    { key: 'yetkili', header: 'Yetkili' },
    { key: 'plan', header: 'Plan', render: (row) => (
      <div className="flex items-center gap-1.5">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${planColors[row.plan]}20`, color: planColors[row.plan] }}>
          {row.plan}
        </span>
        <select
          value={row.plan}
          disabled={planLoading === row.id}
          onChange={(e) => { e.stopPropagation(); handlePlanChange(row.id, e.target.value as AdminTenant['plan']); }}
          className="px-1.5 py-0.5 rounded text-xs bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#8a8f98] outline-none cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {plans.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
    )},
    { key: 'kayit_tarihi', header: 'Kayıt', render: (row) => formatDate(row.kayit_tarihi) },
    { key: 'durum', header: 'Durum', render: (row) => (
      <div className="flex items-center gap-2">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
          row.durum === 'AKTIF' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}>{row.durum === 'AKTIF' ? 'Aktif' : 'Pasif'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); handleSuspend(row.id, row); }}
          className={`text-xs px-2 py-0.5 rounded border font-medium transition-colors ${
            row.durum === 'AKTIF'
              ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
              : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
          }`}
        >{row.durum === 'AKTIF' ? 'Pasif Yap' : 'Aktifleştir'}</button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] text-sm outline-none focus:border-[#FF5F03]/40 cursor-pointer">
          <option value="">Tüm Planlar</option>
          {plans.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-[#8a8f98]">{filtered.length} firma</span>
      </div>

      <DataGrid
        columns={columns}
        data={filtered}
        keyField="id"
        loading={loading}
        title="Firmalar"
        emptyText={planFilter ? 'Bu planda firma bulunamadı' : 'Henüz kayıtlı firma bulunmuyor'}
        pageSizeOptions={[50, 100, 200]}
      />
    </div>
  );
}

function ModulesTab() {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const countries = ['TR'] as const;
  const categories = [...new Set(modules.map((m) => m.category))].sort();

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi.get<AdminModule[]>('/api/admin/modules/'),
      adminApi.get<{ id: number; module_id: number; enabled: boolean }[]>('/api/admin/modules/country/TR'),
      adminApi.get<{ id: number; module_id: number; enabled: boolean }[]>('/api/admin/modules/plan/FREE'),
      adminApi.get<{ id: number; module_id: number; enabled: boolean }[]>('/api/admin/modules/plan/PRO'),
      adminApi.get<{ id: number; module_id: number; enabled: boolean }[]>('/api/admin/modules/plan/PREMIUM'),
    ])
      .then(([modRes, countryRes, freeRes, proRes, premRes]) => {
        if (cancelled) return;
        const apiModules = modRes.data;
        const countryData = countryRes.data;
        const planData = [...freeRes.data, ...proRes.data, ...premRes.data];

        // Enrich modules with country/plan access
        const enriched: AdminModule[] = apiModules.map((m: AdminModule) => {
          const modCountries = countryData
            .filter((c) => c.module_id === m.id && c.enabled)
            .map(() => 'TR' as string);
          const modPlans = planData
            .filter((p) => p.module_id === m.id && p.enabled)
            .map((p) => {
              const planIds: Record<number, string> = {};
              freeRes.data.forEach((x) => { if (x.module_id === m.id) planIds[x.id] = 'FREE'; });
              proRes.data.forEach((x) => { if (x.module_id === m.id) planIds[x.id] = 'PRO'; });
              premRes.data.forEach((x) => { if (x.module_id === m.id) planIds[x.id] = 'PREMIUM'; });
              return planIds[p.id] || '';
            })
            .filter(Boolean);
          return {
            ...m,
            enabled_countries: modCountries.length > 0 ? modCountries : (m.is_core || m.default_enabled ? ['TR'] : []),
            enabled_plans: modPlans.length > 0 ? [...new Set(modPlans)] : (m.is_core || m.default_enabled ? ['FREE', 'PRO', 'PREMIUM'] : []),
          };
        });
        setModules(enriched);
      })
      .catch((err) => {
        if (!cancelled) setError('Modüller yüklenemedi: ' + (err?.message || 'API hatası'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = modules.filter((m) => {
    if (filterCountry && !m.enabled_countries.includes(filterCountry)) return false;
    if (filterPlan && !m.enabled_plans.includes(filterPlan)) return false;
    if (filterCategory && m.category !== filterCategory) return false;
    return true;
  });

  const handleToggleCountry = async (moduleId: number, country: string, enabled: boolean) => {
    setToggleLoading(`${moduleId}-${country}`);
    try {
      await adminApi.put(`/api/admin/modules/country/${country}`, { module_id: moduleId, enabled });
      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            enabled_countries: enabled
              ? [...new Set([...m.enabled_countries, country])]
              : m.enabled_countries.filter((c) => c !== country),
          };
        })
      );
    } catch {
      // Optimistic update retained
    }
    setToggleLoading(null);
  };

  const handleTogglePlan = async (moduleId: number, plan: string, enabled: boolean) => {
    setToggleLoading(`${moduleId}-plan-${plan}`);
    try {
      await adminApi.put(`/api/admin/modules/plan/${plan}`, { module_id: moduleId, enabled });
      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            enabled_plans: enabled
              ? [...new Set([...m.enabled_plans, plan])]
              : m.enabled_plans.filter((p) => p !== plan),
          };
        })
      );
    } catch {
      // Optimistic update retained
    }
    setToggleLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5F03]" size={36} />
          <span className="text-sm text-[#8a8f98]">Modüller yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-[#8a8f98]">
          <AlertCircle size={36} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[#8a8f98]">{modules.length} modül</div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40"
          >
            <option value="">Tüm Ülkeler</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40"
          >
            <option value="">Tüm Planlar</option>
            {plans.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#8a8f98] text-sm">Filtrelere uygun modül bulunamadı.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mod) => (
            <div key={mod.id} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[#f7f8f8] font-medium text-sm flex items-center gap-2">
                    {mod.module_name}
                    {mod.is_core && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#FF5F03]/15 text-[#FF5F03] font-semibold">
                        CORE
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#8a8f98] mt-0.5">{mod.category}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    mod.default_enabled
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {mod.default_enabled ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div>
                <p className="text-xs text-[#62666d] mb-2 font-medium">Ülkeler</p>
                <div className="flex flex-wrap gap-1.5">
                  {countries.map((country) => {
                    const enabled = mod.enabled_countries.includes(country);
                    const isLoading = toggleLoading === `${mod.id}-${country}`;
                    return (
                      <button
                        key={country}
                        disabled={mod.is_core || isLoading}
                        onClick={() => handleToggleCountry(mod.id, country, !enabled)}
                        className={`relative px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          enabled
                            ? 'bg-[#FF5F03]/15 text-[#FF5F03] border border-[#FF5F03]/30'
                            : 'bg-[#08090a] text-[#62666d] border border-[rgba(255,255,255,0.08)] hover:border-[#62666d]'
                        } ${mod.is_core ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isLoading && <Loader2 size={10} className="animate-spin inline mr-1" />}
                        {country}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#62666d] mb-2 font-medium">Planlar</p>
                <div className="flex flex-wrap gap-1.5">
                  {plans.map((plan) => {
                    const enabled = mod.enabled_plans.includes(plan);
                    const isLoading = toggleLoading === `${mod.id}-plan-${plan}`;
                    return (
                      <button
                        key={plan}
                        disabled={mod.is_core || isLoading}
                        onClick={() => handleTogglePlan(mod.id, plan, !enabled)}
                        className={`relative px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          enabled
                            ? 'bg-[#FF5F03]/15 text-[#FF5F03] border border-[#FF5F03]/30'
                            : 'bg-[#08090a] text-[#62666d] border border-[rgba(255,255,255,0.08)] hover:border-[#62666d]'
                        } ${mod.is_core ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={enabled ? { backgroundColor: `${planColors[plan]}15`, color: planColors[plan], borderColor: `${planColors[plan]}40` } : {}}
                      >
                        {isLoading && <Loader2 size={10} className="animate-spin inline mr-1" />}
                        {plan}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CountriesTab() {
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const emptyForm: AdminCountry = {
    kod: '', ad: '', vergi_orani: 0, para_birimi: 'TRY', fatura_formati: '', sofor_gereksinimleri: {},
  };
  const [form, setForm] = useState<AdminCountry>(emptyForm);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<AdminCountry[]>('/api/admin/countries')
      .then(() => { if (!cancelled) setCountries(getMockCountries()); })
      .catch(() => { if (!cancelled) setCountries(getMockCountries()); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      if (editingCode) {
        await adminApi.put(`/api/admin/countries/${editingCode}`, form);
        setCountries((prev) => prev.map((c) => (c.kod === editingCode ? form : c)));
      } else {
        const res = await adminApi.post<AdminCountry>('/api/admin/countries', form);
        setCountries((prev) => [...prev, res.data || form]);
      }
      setShowForm(false);
      setEditingCode(null);
      setForm(emptyForm);
    } catch {
      if (editingCode) {
        setCountries((prev) => prev.map((c) => (c.kod === editingCode ? form : c)));
      } else {
        setCountries((prev) => [...prev, form]);
      }
      setShowForm(false);
      setEditingCode(null);
      setForm(emptyForm);
    }
    setSaveLoading(false);
  };

  const startEdit = (country: AdminCountry) => {
    setForm({ ...country, sofor_gereksinimleri: { ...country.sofor_gereksinimleri } });
    setEditingCode(country.kod);
    setShowForm(true);
    setJsonError('');
  };

  const startAdd = () => {
    setForm(emptyForm);
    setEditingCode(null);
    setShowForm(true);
    setJsonError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5F03]" size={36} />
          <span className="text-sm text-[#8a8f98]">Ülkeler yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#f7f8f8]">
          {countries.length} ülke yapılandırıldı
        </h3>
        <button
          onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Ülke Ekle
        </button>
      </div>

      {countries.length === 0 ? (
        <div className="text-center py-12 text-[#8a8f98] text-sm">Henüz ülke eklenmemiş.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map((country) => (
            <div key={country.kod} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[#f7f8f8] font-semibold">{country.ad}</h4>
                  <p className="text-xs text-[#FF5F03] font-mono">{country.kod}</p>
                </div>
                <button
                  onClick={() => startEdit(country)}
                  className="p-1.5 rounded-lg text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#2a2a2a] transition-colors"
                >
                  <Settings size={16} />
                </button>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8a8f98]">Vergi Oranı</span>
                  <span className="text-[#f7f8f8]">%{country.vergi_orani}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8f98]">Para Birimi</span>
                  <span className="text-[#f7f8f8]">{country.para_birimi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8f98]">Fatura Formatı</span>
                  <span className="text-[#f7f8f8]">{country.fatura_formati}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#62666d] mb-1 font-medium">Sürücü Gereksinimleri</p>
                <pre className="text-xs text-[#8a8f98] bg-[#08090a] rounded-lg p-2 overflow-x-auto max-h-24">
                  {JSON.stringify(country.sofor_gereksinimleri, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#f7f8f8] font-semibold">
                {editingCode ? 'Ülke Düzenle' : 'Yeni Ülke Ekle'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingCode(null); }}
                className="p-1 rounded-lg text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#2a2a2a]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">Ülke Kodu</label>
                <input
                  type="text"
                  value={form.kod}
                  onChange={(e) => setForm({ ...form, kod: e.target.value.toUpperCase() })}
                  required
                  disabled={!!editingCode}
                  maxLength={2}
                  placeholder="TR"
                  className="w-full px-3 py-2 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">Ülke Adı</label>
                <input
                  type="text"
                  value={form.ad}
                  onChange={(e) => setForm({ ...form, ad: e.target.value })}
                  required
                  placeholder="Türkiye"
                  className="w-full px-3 py-2 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8a8f98] mb-1">Vergi Oranı (%)</label>
                  <input
                    type="number"
                    value={form.vergi_orani}
                    onChange={(e) => setForm({ ...form, vergi_orani: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a8f98] mb-1">Para Birimi</label>
                  <input
                    type="text"
                    value={form.para_birimi}
                    onChange={(e) => setForm({ ...form, para_birimi: e.target.value.toUpperCase() })}
                    required
                    placeholder="TRY"
                    className="w-full px-3 py-2 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">Fatura Formatı</label>
                <input
                  type="text"
                  value={form.fatura_formati}
                  onChange={(e) => setForm({ ...form, fatura_formati: e.target.value })}
                  required
                  placeholder="E-FATURA"
                  className="w-full px-3 py-2 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">
                  Sürücü Gereksinimleri (JSON)
                </label>
                <textarea
                  value={JSON.stringify(form.sofor_gereksinimleri, null, 2)}
                  onChange={(e) => {
                    try {
                      setForm({ ...form, sofor_gereksinimleri: JSON.parse(e.target.value) });
                      setJsonError('');
                    } catch {
                      setJsonError('Geçersiz JSON formatı');
                    }
                  }}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40 font-mono"
                />
                {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
              </div>

              <button
                type="submit"
                disabled={saveLoading || !!jsonError}
                className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saveLoading && <Loader2 size={16} className="animate-spin" />}
                <Save size={16} />
                {editingCode ? 'Güncelle' : 'Ekle'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [mmrData, setMmrData] = useState<AdminAnalyticsMmr[]>([]);
  const [churnData, setChurnData] = useState<AdminAnalyticsChurn[]>([]);
  const [growthData, setGrowthData] = useState<AdminAnalyticsGrowth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Use mock data for prototype (API shapes not fully aligned yet)
    const mrr = Promise.resolve({ data: getMockAnalyticsMmr() });
    const churn = Promise.resolve({ data: getMockAnalyticsChurn() });
    const growth = Promise.resolve({ data: getMockAnalyticsGrowth() });
    Promise.all([mrr, churn, growth])
      .then(([mrrRes, churnRes, growthRes]) => {
        if (!cancelled) {
          setMmrData(mrrRes.data);
          setChurnData(churnRes.data);
          setGrowthData(growthRes.data);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5F03]" size={36} />
          <span className="text-sm text-[#8a8f98]">Analitik veriler yükleniyor...</span>
        </div>
      </div>
    );
  }

  const latestChurn = churnData.length > 0 ? churnData[churnData.length - 1].oran : 0;
  const totalSignups = mmrData.reduce((sum, d) => sum + d.yeni, 0);
  const projectedMonth = growthData.filter((d) => d.gelir === undefined).length > 0
    ? growthData.find((d) => d.gelir === undefined)?.tahmin
    : growthData[growthData.length - 1]?.tahmin;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminKpiCard icon={UserPlus} label="Son 12 Ay Yeni Kayıt" value={totalSignups} color="#FF5F03" />
        <AdminKpiCard icon={Activity} label="Son Ay Churn Oranı" value={`%${latestChurn.toFixed(1)}`} color={latestChurn > 3 ? '#DC2626' : '#16A34A'} />
        <AdminKpiCard icon={TrendingUp} label="Öngörülen Gelecek Ay MRR" value={projectedMonth ? formatCurrency(projectedMonth) : '—'} color="#8b5cf6" />
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
        <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Aylık Yeni Kayıt & Churn</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mmrData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#FAFAFA', fontSize: '13px' }}
                labelStyle={{ color: '#888' }}
              />
              <Area type="monotone" dataKey="yeni" name="Yeni Kayıt" stroke="#16A34A" fill="#16A34A" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="kayip" name="Kayıp" stroke="#DC2626" fill="#DC2626" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Churn Oranı (Son 12 Ay)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `%${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#FAFAFA', fontSize: '13px' }}
                  formatter={(value: number) => [`%${value.toFixed(1)}`, 'Churn Oranı']}
                  labelStyle={{ color: '#888' }}
                />
                <Line type="monotone" dataKey="oran" stroke="#DC2626" strokeWidth={2} dot={{ fill: '#DC2626', r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Gelir Projeksiyonu</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8a8f98" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `₺${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#FAFAFA', fontSize: '13px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Gelir']}
                  labelStyle={{ color: '#888' }}
                />
                <Line type="monotone" dataKey="gelir" name="Gerçekleşen" stroke="#FF5F03" strokeWidth={2} dot={{ fill: '#FF5F03', r: 2 }} connectNulls />
                <Line type="monotone" dataKey="tahmin" name="Tahmin" stroke="#FF5F03" strokeWidth={2} strokeDasharray="6 4" dot={{ fill: '#FF5F03', r: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailTab() {
  const [cfg, setCfg] = useState({ email_address: '', email_password: '', smtp_address: '', imap_address: '', smtp_port: '465', imap_port: '993', google_client_id: '', stripe_pub_key: '', stripe_price_monthly: '', stripe_price_yearly: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    adminApi.get('/api/admin/email/config').then(res => {
      setCfg(prev => ({ ...prev, ...res.data }));
    }).finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: string) => setCfg(prev => ({ ...prev, [field]: value }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try { const res = await adminApi.post('/api/admin/email/config', cfg); setMsg({ type: 'success', text: res.data.message }); }
    catch (err: any) { setMsg({ type: 'error', text: err?.response?.data?.error || 'Kaydetme hatası' }); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setMsg(null);
    try { const res = await adminApi.post('/api/admin/email/test', cfg); setMsg({ type: res.data.success ? 'success' : 'error', text: res.data.message || res.data.error }); }
    catch (err: any) { setMsg({ type: 'error', text: err?.response?.data?.error || 'Test hatası' }); }
    finally { setTesting(false); }
  };

  if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-[#FF5F03]" size={32} /></div>;

  return (
    <div>
      <h3 className="text-[16px] font-[590] text-[#f7f8f8] mb-1">Sistem E-posta Ayarları</h3>
      <p className="text-[13px] text-[#8a8f98] mb-6">Kayıt onayı, şifre sıfırlama ve sistem bildirimleri için genel e-posta yapılandırması.</p>

      {msg && (
        <div className={`mb-4 p-3 rounded-md text-[14px] ${msg.type === 'success' ? 'bg-[#16A34A]/10 border border-[#16A34A]/20 text-[#16A34A]' : 'bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626]'}`}>{msg.text}</div>
      )}

      <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">E-posta Adresi</label>
            <input type="text" value={cfg.email_address} onChange={e => update('email_address', e.target.value)} placeholder="info@unysolar.com" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
          </div>
          <div>
            <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">E-posta Şifresi</label>
            <input type="password" value={cfg.email_password} onChange={e => update('email_password', e.target.value)} placeholder="E-posta hesap şifresi" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">SMTP Adresi</label>
            <input type="text" value={cfg.smtp_address} onChange={e => update('smtp_address', e.target.value)} placeholder="smtp.hostinger.com" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
          </div>
          <div>
            <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">IMAP Adresi</label>
            <input type="text" value={cfg.imap_address} onChange={e => update('imap_address', e.target.value)} placeholder="imap.hostinger.com" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">SMTP Port</label>
            <input type="text" value={cfg.smtp_port} onChange={e => update('smtp_port', e.target.value)} placeholder="465" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
          </div>
          <div>
            <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">IMAP Port</label>
            <input type="text" value={cfg.imap_port} onChange={e => update('imap_port', e.target.value)} placeholder="993" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">Google Client ID</label>
            <input type="text" value={cfg.google_client_id} onChange={e => update('google_client_id', e.target.value)} placeholder="123456789-xxxxx.apps.googleusercontent.com" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
          </div>
          <div></div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 mt-2">
          <h4 className="text-[14px] font-[510] text-[#d0d6e0] mb-3">Stripe Ödeme Ayarları</h4>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">Publishable Key</label>
              <input type="text" value={cfg.stripe_pub_key} onChange={e => update('stripe_pub_key', e.target.value)} placeholder="pk_test_..." className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">Price ID (Aylık)</label>
                <input type="text" value={cfg.stripe_price_monthly} onChange={e => update('stripe_price_monthly', e.target.value)} placeholder="price_xxxxx" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
              </div>
              <div>
                <label className="block text-[13px] font-[510] text-[#d0d6e0] mb-1.5">Price ID (Yıllık)</label>
                <input type="text" value={cfg.stripe_price_yearly} onChange={e => update('stripe_price_yearly', e.target.value)} placeholder="price_xxxxx" className="w-full px-3 py-2 rounded-md bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#8a8f98] text-[14px] outline-none focus:border-[#FF5F03]/40" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-[#FF5F03] hover:bg-[#E55600] text-white px-5 py-2 rounded-md font-[510] text-[14px] transition-colors inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Kaydet
          </button>
          <button type="button" disabled={testing} onClick={handleTest} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#d0d6e0] px-5 py-2 rounded-md font-[510] text-[14px] transition-colors hover:bg-[rgba(255,255,255,0.06)] inline-flex items-center gap-2 disabled:opacity-50">
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Test E-postası Gönder
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = getStoredAdminUser();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!adminUser) {
      navigate('/admin/login', { replace: true });
    }
  }, [adminUser, navigate]);

  if (!adminUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#08090a]">
        <Loader2 className="animate-spin text-[#FF5F03]" size={40} />
      </div>
    );
  }

  const handleLogout = () => {
    adminLogout();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'tenants': return <TenantsTab />;
      case 'modules': return <ModulesTab />;
      case 'countries': return <CountriesTab />;
      case 'analytics': return <AnalyticsTab />;
      case 'email': return <EmailTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="flex h-screen bg-[#08090a] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.08)] flex-col flex-shrink-0">
        <div className="p-5 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FF5F03] rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="text-[#f7f8f8] font-bold text-lg tracking-tight">Unysol</span>
              <span className="text-[#FF5F03] font-bold text-lg"> Admin</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FF5F03]/15 text-[#FF5F03] border-r-2 border-[#FF5F03]'
                    : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.04] border-r-2 border-transparent'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5F03] to-[#E55600] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {adminUser.ad?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-[#f7f8f8] font-medium truncate">
                {adminUser.ad || 'Yönetici'}
              </div>
              <div className="text-xs text-[#62666d] truncate">{adminUser.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-[#8a8f98] hover:text-red-400 transition-colors py-1.5 rounded-md hover:bg-red-400/5 px-2 -mx-2"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.08)] flex flex-col z-50">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#FF5F03] rounded-lg flex items-center justify-center">
                  <Shield size={18} className="text-white" />
                </div>
                <span className="text-[#f7f8f8] font-bold text-lg">Unysol Yönetici</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-[#8a8f98] hover:text-[#f7f8f8]">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#FF5F03]/15 text-[#FF5F03] border-r-2 border-[#FF5F03]'
                        : 'text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.04] border-r-2 border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-sm text-[#8a8f98] hover:text-red-400 py-1.5"
              >
                <LogOut size={16} />
                Çıkış Yap
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between px-4 lg:px-6 flex-shrink-0 bg-[#08090a]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#2a2a2a]"
            >
              <BarChart3 size={20} />
            </button>
            <h1 className="text-lg font-semibold text-[#f7f8f8] hidden sm:block">
              {tabs.find((t) => t.id === activeTab)?.label || 'Yönetici Paneli'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#8a8f98] hidden sm:block">
              {adminUser?.ad}
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-[#FF5F03]/15 text-[#FF5F03] text-xs font-medium">
                {adminUser?.rol === 'SUPER_ADMIN' ? 'Süper Admin' : 'Yönetici'}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="lg:hidden p-1.5 rounded-lg text-[#8a8f98] hover:text-red-400 hover:bg-red-400/5"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden flex overflow-x-auto border-b border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] flex-shrink-0 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'text-[#FF5F03] border-[#FF5F03]'
                    : 'text-[#8a8f98] border-transparent hover:text-[#f7f8f8]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
