import { useState, useEffect, type FormEvent } from 'react';
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Search,
  CreditCard,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

const TURKISH_BANKS = [
  'Akbank',
  'Aktif Yatırım Bankası',
  'Albaraka Türk Katılım Bankası',
  'Alternatif Bank',
  'Anadolubank',
  'Bank of China Turkey',
  'Burgan Bank',
  'Citibank',
  'Denizbank',
  'Deutsche Bank',
  'Diler Yatırım Bankası',
  'Emlak Katılım Bankası',
  'Fibabanka',
  'Garanti BBVA',
  'HSBC',
  'ICBC Turkey',
  'ING Bank',
  'İş Bankası',
  'JPMorgan Chase',
  'Kuveyt Türk Katılım Bankası',
  'MUFG Bank Turkey',
  'Odeabank',
  'QNB Finansbank',
  'Şekerbank',
  'T.C. Ziraat Bankası',
  'Türk Ekonomi Bankası (TEB)',
  'Turkish Bank',
  'Türkiye Finans Katılım Bankası',
  'Türkiye Halk Bankası',
  'Türkiye İhracat Kredi Bankası (Eximbank)',
  'Türkiye Kalkınma ve Yatırım Bankası',
  'Türkiye Sınai Kalkınma Bankası (TSKB)',
  'Türkiye Vakıflar Bankası',
  'Vakıf Katılım Bankası',
  'Yapı ve Kredi Bankası',
  'Ziraat Katılım Bankası',
];

interface CekSenet {
  id: string;
  no: string;
  tip?: 'cek' | 'senet';
  type?: string;
  musteri?: string;
  tutar: number;
  vade_tarihi: string;
  tanzim_tarihi?: string;
  durum: 'portfoyde' | 'tahsilde' | 'odendi' | 'ciro_edildi' | 'karsiliksiz';
  banka?: string;
  sube?: string;
  taraf?: string;
  notlar?: string;
}

interface CekSenetFormData {
  tip: 'cek' | 'senet';
  no: string;
  banka: string;
  sube: string;
  taraf: 'borclu' | 'alacakli';
  tutar: string;
  vade_tarihi: string;
  tanzim_tarihi: string;
  musteri: string;
  notlar: string;
}

interface KpiData {
  toplam_portfoy: number;
  yaklasan_vade_count: number;
  gecikmis_count: number;
}

const emptyForm: CekSenetFormData = {
  tip: 'cek',
  no: '',
  banka: '',
  sube: '',
  taraf: 'borclu',
  tutar: '',
  vade_tarihi: '',
  tanzim_tarihi: '',
  musteri: '',
  notlar: '',
};

const today = new Date();
const dt = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const mockData: CekSenet[] = [
  {
    id: '1',
    no: 'ÇEK-2024001',
    tip: 'cek',
    musteri: 'ABC Lojistik',
    tutar: 25000,
    vade_tarihi: dt(3),
    tanzim_tarihi: dt(-1),
    durum: 'portfoyde',
    banka: 'İş Bankası',
    sube: 'Kadıköy',
    taraf: 'borclu',
    notlar: 'Yakında vadesi geliyor',
  },
  {
    id: '2',
    no: 'ÇEK-2024002',
    tip: 'cek',
    musteri: 'XYZ Nakliyat',
    tutar: 42500,
    vade_tarihi: dt(30),
    tanzim_tarihi: dt(-5),
    durum: 'tahsilde',
    banka: 'Garanti BBVA',
    sube: 'Beşiktaş',
    taraf: 'borclu',
    notlar: '',
  },
  {
    id: '3',
    no: 'SEN-2024001',
    tip: 'senet',
    musteri: 'KLM Taşımacılık',
    tutar: 18000,
    vade_tarihi: dt(60),
    tanzim_tarihi: dt(-10),
    durum: 'portfoyde',
    banka: '',
    sube: '',
    taraf: 'borclu',
    notlar: '3 taksitli senedin ilki',
  },
  {
    id: '4',
    no: 'ÇEK-2024003',
    tip: 'cek',
    musteri: 'DEF Transport',
    tutar: 55000,
    vade_tarihi: dt(-5),
    tanzim_tarihi: dt(-30),
    durum: 'odendi',
    banka: 'Yapı Kredi',
    sube: 'Maslak',
    taraf: 'alacakli',
    notlar: 'Vadesinde ödendi',
  },
  {
    id: '5',
    no: 'ÇEK-2024004',
    tip: 'cek',
    musteri: 'GHI Lojistik',
    tutar: 12000,
    vade_tarihi: dt(-10),
    tanzim_tarihi: dt(-40),
    durum: 'karsiliksiz',
    banka: 'Akbank',
    sube: 'Ümraniye',
    taraf: 'borclu',
    notlar: 'İcra takibi başlatıldı',
  },
];

const mockCustomers = [
  'ABC Lojistik',
  'XYZ Nakliyat',
  'KLM Taşımacılık',
  'DEF Transport',
  'GHI Lojistik',
  'Aras Lojistik A.Ş.',
  'Borusan Lojistik',
  'Mars Lojistik',
];

const durumConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  portfoyde: { label: 'Portföyde', bg: 'bg-[#3b82f6]/15', text: 'text-blue-600', border: 'border-[#3b82f6]/30' },
  tahsilde: { label: 'Tahsilde', bg: 'bg-[#FF5F03]/15', text: 'text-[#FF5F03]', border: 'border-[#FF5F03]/30' },
  odendi: { label: 'Ödendi', bg: 'bg-[#16A34A]/15', text: 'text-[#16A34A]', border: 'border-[#16A34A]/30' },
  ciro_edildi: { label: 'Ciro Edildi', bg: 'bg-[#a855f7]/15', text: 'text-purple-600', border: 'border-[#a855f7]/30' },
  karsiliksiz: { label: 'Karşılıksız', bg: 'bg-[#DC2626]/15', text: 'text-[#DC2626]', border: 'border-[#DC2626]/30' },
};

const tipConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  cek: { label: 'Çek', bg: 'bg-[#3b82f6]/10', text: 'text-blue-600', border: 'border-[#3b82f6]/20' },
  senet: { label: 'Senet', bg: 'bg-[#a855f7]/10', text: 'text-purple-600', border: 'border-[#a855f7]/20' },
};

const durumSirasi: CekSenet['durum'][] = ['portfoyde', 'tahsilde', 'odendi', 'ciro_edildi', 'karsiliksiz'];

function kalanGun(vade: string, durum: string): number | null {
  if (durum === 'odendi') return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vadeDate = new Date(vade);
  vadeDate.setHours(0, 0, 0, 0);
  return Math.ceil((vadeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function kalanGunClass(gun: number | null): string {
  if (gun === null) return 'text-gray-400';
  if (gun < 0) return 'text-[#DC2626] font-medium';
  if (gun <= 7) return 'text-[#DC2626] font-medium';
  if (gun <= 30) return 'text-[#FF5F03] font-medium';
  return 'text-[#16A34A] font-medium';
}

export default function CekSenetPage() {
  const [data, setData] = useState<CekSenet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [vadeStart, setVadeStart] = useState('');
  const [vadeEnd, setVadeEnd] = useState('');
  const [customers, setCustomers] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CekSenetFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kpi, setKpi] = useState<KpiData>({ toplam_portfoy: 0, yaklasan_vade_count: 0, gecikmis_count: 0 });
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerError, setQuickCustomerError] = useState('');
  const [quickCustomerSaving, setQuickCustomerSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.allSettled([
      api.get<CekSenet[]>('/api/tenant/cek-senet/').then((r) => r.data),
      api.get<KpiData>('/api/tenant/cek-senet/summary').then((r) => r.data),
      api.get<{ firma_unvani: string }[]>('/api/tenant/customers').then((r) =>
        (Array.isArray(r.data) ? r.data : []).map((c) => c.firma_unvani)
      ),
    ])
      .then(([dataResult, kpiResult, customersResult]) => {
        if (cancelled) return;

        const useApi = dataResult.status === 'fulfilled' && Array.isArray(dataResult.value);
        const tableData = useApi ? dataResult.value : mockData;
        setData(tableData);

        if (kpiResult.status === 'fulfilled' && kpiResult.value && useApi) {
          setKpi(kpiResult.value);
        } else {
          computeKpi(tableData);
        }

        if (customersResult.status === 'fulfilled' && Array.isArray(customersResult.value)) {
          setCustomers(customersResult.value);
        } else {
          setCustomers(mockCustomers);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(mockData);
          computeKpi(mockData);
          setCustomers(mockCustomers);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function computeKpi(list: CekSenet[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const active = list.filter((i) => i.durum === 'portfoyde' || i.durum === 'tahsilde');

    setKpi({
      toplam_portfoy: active.reduce((sum, i) => sum + i.tutar, 0),
      yaklasan_vade_count: active.filter((i) => {
        const vd = new Date(i.vade_tarihi);
        vd.setHours(0, 0, 0, 0);
        return vd >= today && vd <= sevenDays;
      }).length,
      gecikmis_count: active.filter((i) => {
        const vd = new Date(i.vade_tarihi);
        vd.setHours(0, 0, 0, 0);
        return vd < today;
      }).length,
    });
  }

  const handleStatusCycle = async (item: CekSenet) => {
    const currentIndex = durumSirasi.indexOf(item.durum);
    const nextIndex = (currentIndex + 1) % durumSirasi.length;
    const nextDurum = durumSirasi[nextIndex];

    if (statusLoading) return;

    setData((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, durum: nextDurum } : d))
    );

    setStatusLoading(item.id);
    try {
      await api.put(`/api/tenant/cek-senet/${item.id}/status`, { durum: nextDurum });
    } catch {
      setData((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, durum: item.durum } : d))
      );
    } finally {
      setStatusLoading(null);
    }
  };

  const cekSenetColumns: Column<CekSenet>[] = [
    { key: 'no', header: 'No', sortable: true },
    {
      key: 'tip',
      header: 'Tip',
      render: (row) => {
        const cfg = tipConfig[row.tip || (row as any).type] || tipConfig.cek;
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.label}
          </span>
        );
      },
      exportRender: (row) => tipConfig[row.tip || (row as any).type]?.label || 'Çek',
    },
    { key: 'musteri', header: 'Müşteri', sortable: true },
    {
      key: 'tutar',
      header: 'Tutar',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-sm text-enterprise-text font-medium">
          ₺{row.tutar.toLocaleString('tr-TR')}
        </span>
      ),
      exportRender: (row) => String(row.tutar),
    },
    { key: 'vade_tarihi', header: 'Vade Tarihi', sortable: true },
    {
      key: 'kalan_gun',
      header: 'Kalan Gün',
      sortable: false,
      align: 'center',
      render: (row) => {
        const gun = kalanGun(row.vade_tarihi, row.durum);
        return (
          <span className={`text-sm ${kalanGunClass(gun)}`}>
            {gun !== null ? (gun < 0 ? `${Math.abs(gun)} gün gecikti` : `${gun} gün`) : '-'}
          </span>
        );
      },
      exportRender: (row) => {
        const gun = kalanGun(row.vade_tarihi, row.durum);
        return gun !== null ? String(gun) : '-';
      },
    },
    {
      key: 'durum',
      header: 'Durum',
      align: 'center',
      render: (row) => {
        const dc = durumConfig[row.durum] || durumConfig.portfoyde;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusCycle(row);
            }}
            disabled={statusLoading === row.id}
            className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${dc.bg} ${dc.text} ${dc.border} hover:brightness-125 transition-all cursor-pointer`}
            title="Tıklayarak durumu değiştirin"
          >
            {statusLoading === row.id ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              dc.label
            )}
          </button>
        );
      },
      exportRender: (row) => durumConfig[row.durum]?.label || row.durum,
    },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.no.trim()) { setFormError('Kayıt numarası zorunludur.'); return; }
    if (!formData.musteri) { setFormError('Müşteri seçimi zorunludur.'); return; }
    if (!formData.tutar || parseFloat(formData.tutar) <= 0) { setFormError('Geçerli bir tutar giriniz.'); return; }
    if (!formData.vade_tarihi) { setFormError('Vade tarihi zorunludur.'); return; }

    setSubmitting(true);
    try {
      const payload = {
        tur: formData.tip,
        seri_no: formData.no.trim(),
        banka: formData.banka.trim(),
        sube: formData.sube.trim(),
        kesideci: formData.taraf.trim(),
        tutar: parseFloat(formData.tutar),
        vade_tarihi: formData.vade_tarihi,
        customer_id: 0,
        aciklama: formData.notlar.trim(),
        hesap_no: '',
      };

      if (editingId) {
        const res = await api.put<CekSenet>(`/api/tenant/cek-senet/${editingId}`, payload);
        if (res.status === 200) {
          setData((prev) => prev.map((d) => d.id === editingId ? { ...d, ...payload, durum: d.durum } : d));
        }
      } else {
        const res = await api.post<CekSenet>('/api/tenant/cek-senet/', payload);
        if (res.status === 201 || res.status === 200) {
          const newItem: CekSenet = res.data ?? {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            ...payload,
            durum: 'portfoyde',
          };
          setData((prev) => [newItem, ...prev]);
        }
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch {
      const newItem: CekSenet = {
        id: editingId || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
        tip: formData.tip,
        no: formData.no.trim(),
        musteri: formData.musteri,
        tutar: parseFloat(formData.tutar),
        vade_tarihi: formData.vade_tarihi,
        tanzim_tarihi: formData.tanzim_tarihi || undefined,
        durum: 'portfoyde',
        banka: formData.banka.trim() || undefined,
        sube: formData.sube.trim() || undefined,
        taraf: formData.taraf.trim() || undefined,
        notlar: formData.notlar.trim() || undefined,
      };
      if (editingId) {
        setData((prev) => prev.map((d) => d.id === editingId ? newItem : d));
      } else {
        setData((prev) => [newItem, ...prev]);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = data.filter((item) => {
    const s = search.toLowerCase();
    const matchesSearch =
      (item.no ?? '').toLowerCase().includes(s) ||
      (item.musteri ?? '').toLowerCase().includes(s);
    const matchesStatus = !statusFilter || item.durum === statusFilter;
    const matchesCustomer = !customerFilter || item.musteri === customerFilter;
    const matchesVadeStart = !vadeStart || item.vade_tarihi >= vadeStart;
    const matchesVadeEnd = !vadeEnd || item.vade_tarihi <= vadeEnd;
    return matchesSearch && matchesStatus && matchesCustomer && matchesVadeStart && matchesVadeEnd;
  });

  const uniqueCustomers = [...new Set([...customers, ...data.map((d) => d.musteri)])].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#FF5F03]" size={36} />
          <span className="text-sm text-enterprise-text-muted">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-enterprise-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={18} className="text-blue-600" />
            <span className="text-xs text-enterprise-text-muted uppercase tracking-wider">Toplam Portföy</span>
          </div>
          <p className="text-2xl font-bold text-enterprise-text">
            ₺{kpi.toplam_portfoy.toLocaleString('tr-TR')}
          </p>
        </div>

        <div className="bg-white border border-enterprise-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-[#FF5F03]" />
            <span className="text-xs text-enterprise-text-muted uppercase tracking-wider">Yaklaşan Vade (7 Gün)</span>
          </div>
          <p className={`text-2xl font-bold ${kpi.yaklasan_vade_count > 0 ? 'text-[#FF5F03]' : 'text-enterprise-text'}`}>
            {kpi.yaklasan_vade_count} kayıt
          </p>
        </div>

        <div className="bg-white border border-enterprise-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-[#DC2626]" />
            <span className="text-xs text-enterprise-text-muted uppercase tracking-wider">Gecikmiş Vadeler</span>
          </div>
          <p className={`text-2xl font-bold ${kpi.gecikmis_count > 0 ? 'text-[#DC2626]' : 'text-enterprise-text'}`}>
            {kpi.gecikmis_count} kayıt
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-[240px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="No veya müşteri ara..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(durumConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
          >
            <option value="">Tüm Müşteriler</option>
            {uniqueCustomers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={vadeStart}
              onChange={(e) => setVadeStart(e.target.value)}
              placeholder="Vade Başlangıç"
              className="px-3 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
            />
            <span className="text-gray-400 text-sm">-</span>
            <input
              type="date"
              value={vadeEnd}
              onChange={(e) => setVadeEnd(e.target.value)}
              placeholder="Vade Bitiş"
              className="px-3 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0"
        >
          <Plus size={18} />
          Yeni Kayıt
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <DataGrid
        columns={cekSenetColumns}
        data={filteredData}
        loading={loading}
        title="Çek/Senet"
        onEdit={(row) => {
          setFormData({
            tip: (row.tip || (row as any).type || 'cek') as 'cek' | 'senet',
            no: row.no,
            banka: row.banka || '',
            sube: row.sube || '',
            taraf: (row.taraf || 'borclu') as 'borclu' | 'alacakli',
            tutar: String(row.tutar),
            vade_tarihi: row.vade_tarihi,
            tanzim_tarihi: row.tanzim_tarihi || '',
            musteri: row.musteri || '',
            notlar: row.notlar || '',
          });
          setEditingId(row.id);
          setShowModal(true);
        }}
        onDelete={(row) => {
          api.delete(`/api/tenant/cek-senet/${row.id}`).catch(() => {});
          setData((prev) => prev.filter((d) => d.id !== row.id));
        }}
        onBulkDelete={(ids) => {
          ids.forEach((id) => api.delete(`/api/tenant/cek-senet/${id}`).catch(() => {}));
          setData((prev) => prev.filter((d) => !ids.includes(d.id)));
        }}
        emptyIcon={<CreditCard size={48} className="text-[#2a2a2a]" />}
        emptyText={
          search || statusFilter || customerFilter || vadeStart || vadeEnd
            ? 'Aramanızla eşleşen kayıt bulunamadı'
            : 'Henüz çek/senet kaydı yok'
        }
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">{editingId ? 'Çek/Senet Düzenle' : 'Yeni Çek/Senet Kaydı'}</h3>
              <button
                onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); setFormError(''); }}
                className="text-enterprise-text-muted hover:text-enterprise-text transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-sm">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Tip</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tip"
                      value="cek"
                      checked={formData.tip === 'cek'}
                      onChange={() => setFormData({ ...formData, tip: 'cek' })}
                      className="accent-[#FF5F03]"
                    />
                    <span className="text-sm text-enterprise-text">Çek</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tip"
                      value="senet"
                      checked={formData.tip === 'senet'}
                      onChange={() => setFormData({ ...formData, tip: 'senet' })}
                      className="accent-[#a855f7]"
                    />
                    <span className="text-sm text-enterprise-text">Senet</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">No</label>
                  <input
                    type="text"
                    value={formData.no}
                    onChange={(e) => setFormData({ ...formData, no: e.target.value })}
                    required
                    placeholder="ÇEK-2024005"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Tutar (₺)</label>
                  <input
                    type="number"
                    value={formData.tutar}
                    onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Banka</label>
                  <select
                    value={formData.banka}
                    onChange={(e) => setFormData({ ...formData, banka: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
                  >
                    <option value="">Seçiniz</option>
                    {TURKISH_BANKS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Şube</label>
                  <input
                    type="text"
                    value={formData.sube}
                    onChange={(e) => setFormData({ ...formData, sube: e.target.value })}
                    placeholder="Kadıköy"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Taraf</label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                    formData.taraf === 'borclu'
                      ? 'bg-[#FF5F03]/10 border-[#FF5F03] text-[#FF5F03]'
                      : 'bg-gray-100 border-enterprise-border text-enterprise-text-muted hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="taraf"
                      value="borclu"
                      checked={formData.taraf === 'borclu'}
                      onChange={() => setFormData({ ...formData, taraf: 'borclu' })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">Borçlu</span>
                    <span className="text-xs opacity-60">(Müşteri bize borçlu)</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                    formData.taraf === 'alacakli'
                      ? 'bg-[#FF5F03]/10 border-[#FF5F03] text-[#FF5F03]'
                      : 'bg-gray-100 border-enterprise-border text-enterprise-text-muted hover:border-gray-400'
                  }`}>
                    <input
                      type="radio"
                      name="taraf"
                      value="alacakli"
                      checked={formData.taraf === 'alacakli'}
                      onChange={() => setFormData({ ...formData, taraf: 'alacakli' })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">Alacaklı</span>
                    <span className="text-xs opacity-60">(Biz müşteriye borçluyuz)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Vade Tarihi</label>
                  <input
                    type="date"
                    value={formData.vade_tarihi}
                    onChange={(e) => setFormData({ ...formData, vade_tarihi: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Tanzim Tarihi</label>
                  <input
                    type="date"
                    value={formData.tanzim_tarihi}
                    onChange={(e) => setFormData({ ...formData, tanzim_tarihi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Müşteri</label>
                <div className="flex gap-2">
                  <select
                    value={formData.musteri}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setFormData({ ...formData, musteri: selected });
                    }}
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
                  >
                    <option value="">Seçiniz</option>
                    {uniqueCustomers.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddCustomer(true)}
                    className="shrink-0 px-3 py-2.5 rounded-lg bg-white border border-enterprise-border text-[#FF5F03] text-sm font-medium hover:bg-gray-100 hover:border-[#FF5F03]/30 transition-all flex items-center gap-1"
                    title="Yeni müşteri ekle"
                  >
                    <Plus size={16} /> Yeni
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Notlar</label>
                <textarea
                  value={formData.notlar}
                  onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                  rows={2}
                  placeholder="Opsiyonel notlar..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-enterprise-border text-enterprise-text-muted hover:text-enterprise-text hover:border-gray-400 font-medium text-sm transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showQuickAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowQuickAddCustomer(false); setQuickCustomerError(''); setQuickCustomerName(''); }} />
          <div className="relative bg-white border border-enterprise-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-enterprise-text">Yeni Müşteri Ekle</h3>
              <button onClick={() => { setShowQuickAddCustomer(false); setQuickCustomerError(''); setQuickCustomerName(''); }} className="text-[#888] hover:text-enterprise-text transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!quickCustomerName.trim()) { setQuickCustomerError('Firma adı zorunludur'); return; }
              setQuickCustomerSaving(true);
              setQuickCustomerError('');
              try {
                await api.post('/api/tenant/customers', { firma_unvani: quickCustomerName.trim() });
                const newName = quickCustomerName.trim();
                setCustomers(prev => [...prev, newName].sort());
                setFormData({ ...formData, musteri: newName });
                setShowQuickAddCustomer(false);
                setQuickCustomerName('');
              } catch {
                // If API fails, still add locally
                const newName = quickCustomerName.trim();
                setCustomers(prev => prev.includes(newName) ? prev : [...prev, newName].sort());
                setFormData({ ...formData, musteri: newName });
                setShowQuickAddCustomer(false);
                setQuickCustomerName('');
              } finally {
                setQuickCustomerSaving(false);
              }
            }}>
              <input
                type="text"
                value={quickCustomerName}
                onChange={(e) => { setQuickCustomerName(e.target.value); setQuickCustomerError(''); }}
                placeholder="Firma adı giriniz"
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all mb-4"
                autoFocus
              />
              {quickCustomerError && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                  <AlertCircle size={14} /> {quickCustomerError}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowQuickAddCustomer(false); setQuickCustomerError(''); setQuickCustomerName(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-enterprise-border text-enterprise-text-muted hover:text-enterprise-text font-medium text-sm transition-all">
                  İptal
                </button>
                <button type="submit" disabled={quickCustomerSaving}
                  className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {quickCustomerSaving && <Loader2 size={16} className="animate-spin" />}
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
