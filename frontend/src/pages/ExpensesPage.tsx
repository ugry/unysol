import { useState, useEffect, type FormEvent } from 'react';
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Search,
  DollarSign,
  Fuel,
  Wrench,
  CircleDot,
  Shield,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

interface Expense {
  id: number;
  tarih: string;
  kategori: string;
  aciklama: string;
  tutar: number;
  plaka?: string;
  fatura_no?: string;
  odeme_durumu?: string;
}

interface ExpenseFormData {
  kategori: string;
  tarih: string;
  tutar: string;
  aciklama: string;
  plaka: string;
  fatura_no: string;
}

const emptyForm: ExpenseFormData = {
  kategori: 'yakit',
  tarih: new Date().toISOString().split('T')[0],
  tutar: '',
  aciklama: '',
  plaka: '',
  fatura_no: '',
};

const kategoriConfig: Record<string, { label: string; icon: typeof Fuel; bg: string; text: string; border: string }> = {
  yakit: { label: 'Yakıt', icon: Fuel, bg: 'bg-[#FF5F03]/15', text: 'text-[#FF5F03]', border: 'border-[#FF5F03]/30' },
  bakim: { label: 'Bakım', icon: Wrench, bg: 'bg-[#3b82f6]/15', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]/30' },
  lastik: { label: 'Lastik', icon: CircleDot, bg: 'bg-[#a855f7]/15', text: 'text-[#a855f7]', border: 'border-[#a855f7]/30' },
  sigorta: { label: 'Sigorta', icon: Shield, bg: 'bg-[#16A34A]/15', text: 'text-[#16A34A]', border: 'border-[#16A34A]/30' },
  mtv: { label: 'MTV', icon: FileText, bg: 'bg-[#71717a]/15', text: 'text-[#a1a1aa]', border: 'border-[#71717a]/30' },
  trafik_cezasi: { label: 'Trafik Cezası', icon: AlertTriangle, bg: 'bg-[#DC2626]/15', text: 'text-[#DC2626]', border: 'border-[#DC2626]/30' },
};

const expenseColumns: Column<Expense>[] = [
  {
    key: 'tarih',
    header: 'Tarih',
    sortable: true,
  },
  {
    key: 'kategori',
    header: 'Kategori',
    sortable: true,
    render: (row) => {
      const cfg = kategoriConfig[row.kategori] || kategoriConfig.yakit;
      const Icon = cfg.icon;
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          <Icon size={12} />
          {cfg.label}
        </span>
      );
    },
    exportRender: (row) => {
      const cfg = kategoriConfig[row.kategori] || kategoriConfig.yakit;
      return cfg.label;
    },
  },
  {
    key: 'aciklama',
    header: 'Açıklama',
    sortable: true,
  },
  {
    key: 'plaka',
    header: 'Plaka',
    sortable: true,
    render: (row) => <span className="text-sm text-enterprise-text">{row.plaka || '-'}</span>,
  },
  {
    key: 'tutar',
    header: 'Tutar',
    sortable: true,
    align: 'right',
    render: (row) => <span className="text-sm font-medium text-enterprise-text">₺{row.tutar.toLocaleString('tr-TR')}</span>,
    exportRender: (row) => `${row.tutar.toLocaleString('tr-TR')}`,
  },
  {
    key: 'odeme_durumu',
    header: 'Ödeme',
    sortable: true,
    render: (row) => {
      const cfg: Record<string,string> = { odendi:'Ödendi', bekleyen:'Bekleyen', gecikti:'Gecikti' };
      const label = cfg[row.odeme_durumu||''] || row.odeme_durumu || '-';
      const isPaid = row.odeme_durumu === 'odendi';
      return <span className={`text-xs px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{label}</span>;
    },
    exportRender: (row) => row.odeme_durumu || '',
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState<{id:number;plaka:string;marka?:string;model?:string}[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Expense[]>('/api/tenant/expenses')
      .then((res) => {
        if (!cancelled) setExpenses(res.data);
      })
      .catch(() => {
        if (!cancelled) setExpenses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    api.get('/api/tenant/trucks/').then(res => {
      if (!cancelled && Array.isArray(res.data)) setTrucks(res.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const payload = { ...formData, tutar: parseFloat(formData.tutar) };
    try {
      if (editingId) {
        await api.put(`/api/tenant/expenses/${editingId}`, payload);
        setExpenses((prev) =>
          prev.map((ex) => (ex.id === editingId ? { ...ex, ...payload, tutar: payload.tutar } : ex))
        );
      } else {
        const res = await api.post<Expense>('/api/tenant/expenses', payload);
        if (res.data) setExpenses((prev) => [...prev, res.data]);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch {
      setFormError('Gider kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((ex) => {
    const matchesSearch =
      ex.aciklama.toLowerCase().includes(search.toLowerCase()) ||
      (ex.plaka && ex.plaka.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || ex.kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenses.reduce((sum, ex) => sum + (ex.tutar||0), 0);

  const categoryBreakdown = expenses.reduce<Record<string, number>>((acc, ex) => {
    acc[ex.kategori] = (acc[ex.kategori] || 0) + (ex.tutar||0);
    return acc;
  }, {});

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
      {/* Monthly Summary Card */}
      <div className="bg-white border border-enterprise-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-enterprise-text mb-4">Aylık Gider Özeti</h3>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 bg-enterprise-surface-hi rounded-lg p-4 border border-enterprise-border">
            <span className="text-xs text-enterprise-text-muted uppercase tracking-wider">Toplam Gider</span>
            <p className="text-2xl font-bold text-enterprise-text mt-1">₺{totalExpenses.toLocaleString('tr-TR')}</p>
          </div>
          <div className="flex-1 bg-enterprise-surface-hi rounded-lg p-4 border border-enterprise-border">
            <span className="text-xs text-enterprise-text-muted uppercase tracking-wider">Ödenen</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">₺{expenses.filter(e=>e.odeme_durumu==='odendi').reduce((s,e)=>s+(e.tutar||0),0).toLocaleString('tr-TR')}</p>
          </div>
          <div className="flex-1 bg-enterprise-surface-hi rounded-lg p-4 border border-enterprise-border">
            <span className="text-xs text-enterprise-text-muted uppercase tracking-wider">Bekleyen</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">₺{expenses.filter(e=>e.odeme_durumu!=='odendi').reduce((s,e)=>s+(e.tutar||0),0).toLocaleString('tr-TR')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(kategoriConfig).map(([key, cfg]) => {
            const amount = categoryBreakdown[key] || 0;
            return (
              <div key={key} className="bg-enterprise-surface-hi rounded-lg p-3 border border-enterprise-border text-center">
                <cfg.icon size={16} className={cfg.text + ' mx-auto mb-1'} />
                <span className="block text-[10px] text-enterprise-text-muted uppercase">{cfg.label}</span>
                <span className="text-sm font-semibold text-enterprise-text">₺{amount.toLocaleString('tr-TR')}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Açıklama veya plaka ara..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
          >
            <option value="">Tüm Kategoriler</option>
            {Object.entries(kategoriConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0"
        >
          <Plus size={18} />
          Yeni Gider
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
        columns={expenseColumns}
        data={filteredExpenses}
        loading={loading}
        title="Giderler"
        onEdit={(row) => {
          setFormData({
            kategori: row.kategori,
            tarih: row.tarih,
            tutar: String(row.tutar),
            aciklama: row.aciklama,
            plaka: row.plaka || '',
            fatura_no: row.fatura_no || '',
          });
          setEditingId(row.id);
          setShowModal(true);
        }}
        onDelete={async (row) => {
          try { await api.delete(`/api/tenant/expenses/${row.id}`); setExpenses((prev) => prev.filter((e) => e.id !== row.id)); } catch {}
        }}
        onBulkDelete={(ids) => {
          setExpenses((prev) => prev.filter((e) => !ids.includes(String(e.id))));
        }}
        emptyText={search || categoryFilter ? 'Aramanızla eşleşen gider bulunamadı' : 'Henüz gider kaydı yok'}
        emptyIcon={<DollarSign size={48} className="text-[#2a2a2a]" />}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">{editingId ? 'Gider Düzenle' : 'Yeni Gider'}</h3>
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
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
                >
                  {Object.entries(kategoriConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Tarih</label>
                  <input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
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
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Açıklama</label>
                <input
                  type="text"
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  required
                  placeholder="Periyodik bakım (yağ, filtre)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Fatura No</label>
                <input
                  type="text"
                  value={formData.fatura_no}
                  onChange={(e) => setFormData({ ...formData, fatura_no: e.target.value })}
                  placeholder="FT-2026-001"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Kamyon</label>
                <select
                  value={formData.plaka}
                  onChange={(e) => setFormData({ ...formData, plaka: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
                >
                  <option value="">Seçiniz</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.plaka}>{t.plaka} {t.marka ? `- ${t.marka} ${t.model||''}` : ''}</option>
                  ))}
                </select>
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
    </div>
  );
}
