import { useState, useEffect, type FormEvent } from 'react';
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Search,
  MapPin,
  ArrowRight,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

interface Trip {
  id: number;
  truck_id: number;
  truck_plaka: string;
  sofor: string;
  customer_id: number;
  musteri: string;
  yukleme: string;
  teslimat: string;
  ucret: number;
  durum: string;
  payment_method: string;
  invoice_id?: number;
  baslangic?: string;
}

interface TruckOption { id: number; plaka: string; marka: string; model: string }
interface CustomerOption { id: number; firma_unvani: string }
interface DriverOption { id: number; ad_soyad: string }

const durumConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  AKTIF: { label: 'Aktif', bg: 'bg-[#FF5F03]/15', text: 'text-enterprise-secondary', border: 'border-enterprise-secondary/30' },
  TAMAMLANDI: { label: 'Tamamlandı', bg: 'bg-[#16A34A]/15', text: 'text-[#16A34A]', border: 'border-[#16A34A]/30' },
  IPTAL: { label: 'İptal', bg: 'bg-[#DC2626]/15', text: 'text-[#DC2626]', border: 'border-[#DC2626]/30' },
};

const paymentMethods: Record<string, string> = {
  havale: 'Havale/EFT',
  nakit: 'Nakit',
  kredi_karti: 'Kredi Kartı',
  acik_hesap: 'Açık Hesap',
  cek: 'Çek',
  senet: 'Senet',
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown data
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);

  const [formData, setFormData] = useState({
    truck_id: 0,
    sofor: '',
    customer_id: 0,
    yukleme: '',
    teslimat: '',
    ucret: '',
    payment_method: 'havale',
    durum: 'AKTIF',
  });

  // Auto-invoice state
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [lastCreatedTripId, setLastCreatedTripId] = useState<number | null>(null);

  useEffect(() => {
    fetchTrips();
    fetchDropdownData();
  }, []);

  const fetchTrips = () => {
    setLoading(true);
    api.get<Trip[]>('/api/tenant/trips')
      .then((r) => { if (Array.isArray(r.data)) setTrips(r.data); })
      .catch(() => setError('Seferler yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  const fetchDropdownData = () => {
    api.get<{ id: number; plaka: string; marka: string; model: string; aktif: boolean }[]>('/api/tenant/trucks')
      .then((r) => {
        if (Array.isArray(r.data)) setTrucks(r.data.filter((t: any) => t.aktif !== false));
      })
      .catch(() => {});
    api.get<CustomerOption[]>('/api/tenant/customers')
      .then((r) => { if (Array.isArray(r.data)) setCustomers(r.data); })
      .catch(() => {});
    api.get<DriverOption[]>('/api/tenant/employees')
      .then((r) => { if (Array.isArray(r.data)) setDrivers(r.data); })
      .catch(() => {});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.truck_id) { setFormError('Plaka seçimi zorunludur.'); return; }
    if (!formData.sofor.trim()) { setFormError('Şoför adı zorunludur.'); return; }
    if (!formData.customer_id) { setFormError('Müşteri seçimi zorunludur.'); return; }
    if (!formData.ucret || parseFloat(formData.ucret) <= 0) { setFormError('Geçerli bir ücret giriniz.'); return; }

    const payload = {
      truck_id: formData.truck_id,
      sofor: formData.sofor.trim(),
      customer_id: formData.customer_id,
      yukleme: formData.yukleme.trim(),
      teslimat: formData.teslimat.trim(),
      ucret: parseFloat(formData.ucret),
      payment_method: formData.payment_method,
      durum: formData.durum,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/api/tenant/trips/${editingId}`, payload);
        setShowModal(false);
        setEditingId(null);
        fetchTrips();
      } else {
        const res = await api.post('/api/tenant/trips', payload);
        const newTrip = res.data;
        setTrips((prev) => [newTrip, ...prev]);
        setShowModal(false);
        // Ask about invoice
        if (newTrip.id) {
          setLastCreatedTripId(newTrip.id);
          setShowInvoicePrompt(true);
        }
      }
    } catch (e: any) {
      setFormError(e?.response?.data?.error || 'Sefer oluşturulurken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoInvoice = async () => {
    if (!lastCreatedTripId) return;
    setCreatingInvoice(true);
    try {
      await api.post(`/api/tenant/trips/${lastCreatedTripId}/auto-invoice`);
      fetchTrips();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Fatura oluşturulamadı.');
    } finally {
      setCreatingInvoice(false);
      setShowInvoicePrompt(false);
      setLastCreatedTripId(null);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const s = search.toLowerCase();
    const matchesSearch = !s || 
      (t.truck_plaka || '').toLowerCase().includes(s) ||
      (t.sofor || '').toLowerCase().includes(s) ||
      (t.musteri || '').toLowerCase().includes(s);
    const matchesStatus = !statusFilter || t.durum === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tripColumns: Column<Trip>[] = [
    { key: 'truck_plaka', header: 'Plaka', sortable: true, render: (t) => <span className="text-sm font-medium text-enterprise-text">{t.truck_plaka || '-'}</span>, exportRender: (t) => t.truck_plaka || '' },
    { key: 'sofor', header: 'Şoför', sortable: true, exportRender: (t) => t.sofor || '' },
    { key: 'musteri', header: 'Müşteri', sortable: true, exportRender: (t) => t.musteri || '' },
    { key: 'yukleme', header: 'Yükleme → Teslimat', sortable: true, render: (t) => (
      <span className="flex items-center gap-1 text-sm text-enterprise-text-muted">
        {t.yukleme || '-'} <ArrowRight size={12} /> {t.teslimat || '-'}
      </span>
    ), exportRender: (t) => `${t.yukleme || ''} → ${t.teslimat || ''}` },
    { key: 'ucret', header: 'Ücret', sortable: true, align: 'right', render: (t) => (
      <span className="text-sm font-medium text-enterprise-text">₺{(t.ucret || 0).toLocaleString('tr-TR')}</span>
    ), exportRender: (t) => String(t.ucret || 0) },
    { key: 'payment_method', header: 'Ödeme', render: (t) => (
      <span className="text-xs text-enterprise-text-muted">{paymentMethods[t.payment_method] || t.payment_method || '-'}</span>
    ), exportRender: (t) => paymentMethods[t.payment_method] || t.payment_method || '' },
    { key: 'durum', header: 'Durum', align: 'center', sortable: true, render: (t) => {
      const cfg = durumConfig[t.durum] || durumConfig.aktif;
      return (<span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>);
    }, exportRender: (t) => durumConfig[t.durum]?.label || t.durum },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-text-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Plaka, şoför veya müşteri ara..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-gray-400 text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] cursor-pointer">
            <option value="">Tüm Durumlar</option>
            <option value="AKTIF">Aktif</option>
            <option value="TAMAMLANDI">Tamamlandı</option>
            <option value="IPTAL">İptal</option>
          </select>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({ truck_id: 0, sofor: '', customer_id: 0, yukleme: '', teslimat: '', ucret: '', payment_method: 'havale', durum: 'aktif' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm transition-all flex-shrink-0">
          <Plus size={18} /> Yeni Sefer
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <DataGrid columns={tripColumns} data={filteredTrips} loading={loading} title="Seferler"
        onEdit={(row) => {
          setEditingId(row.id);
          setFormData({
            truck_id: row.truck_id || 0,
            sofor: row.sofor || '',
            customer_id: row.customer_id || 0,
            yukleme: row.yukleme || '',
            teslimat: row.teslimat || '',
            ucret: String(row.ucret || ''),
            payment_method: row.payment_method || 'havale',
            durum: row.durum || 'AKTIF',
          });
          setShowModal(true);
        }}
        onDelete={(row) => {
          api.delete(`/api/tenant/trips/${row.id}`).then(() => {
            setTrips((prev) => prev.filter((t) => t.id !== row.id));
          }).catch(() => {});
        }}
        onBulkDelete={(ids) => {
          ids.forEach((id) => api.delete(`/api/tenant/trips/${String(id)}`).catch(() => {}));
          setTrips((prev) => prev.filter((t) => !ids.includes(String(t.id))));
        }}
        emptyIcon={<MapPin size={48} className="text-gray-300" />}
        emptyText={search || statusFilter ? 'Aramanızla eşleşen sefer bulunamadı' : 'Henüz sefer yok'} />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">{editingId ? 'Sefer Düzenle' : 'Yeni Sefer'}</h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); setFormError(''); }}
                className="text-enterprise-text-muted hover:text-enterprise-text p-1 rounded-md hover:bg-gray-100"><X size={20} /></button>
            </div>

            {formError && (<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>)}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Plaka</label>
                <select value={formData.truck_id} onChange={(e) => setFormData({ ...formData, truck_id: Number(e.target.value) })} required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] cursor-pointer">
                  <option value={0}>Seçiniz</option>
                  {trucks.map((t) => (<option key={t.id} value={t.id}>{t.plaka} — {t.marka} {t.model}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Şoför</label>
                <select value={formData.sofor} onChange={(e) => setFormData({ ...formData, sofor: e.target.value })} required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] cursor-pointer">
                  <option value="">Seçiniz</option>
                  {drivers.map((d) => (<option key={d.id} value={d.ad_soyad}>{d.ad_soyad}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Müşteri</label>
                <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: Number(e.target.value) })} required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] cursor-pointer">
                  <option value={0}>Seçiniz</option>
                  {customers.map((c) => (<option key={c.id} value={c.id}>{c.firma_unvani}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Yükleme</label>
                  <input type="text" value={formData.yukleme} onChange={(e) => setFormData({ ...formData, yukleme: e.target.value })} required
                    placeholder="İstanbul" className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text placeholder-gray-400 text-sm outline-none focus:border-[#072C2C]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Teslimat</label>
                  <input type="text" value={formData.teslimat} onChange={(e) => setFormData({ ...formData, teslimat: e.target.value })} required
                    placeholder="Ankara" className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text placeholder-gray-400 text-sm outline-none focus:border-[#072C2C]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Ücret (₺)</label>
                  <input type="number" value={formData.ucret} onChange={(e) => setFormData({ ...formData, ucret: e.target.value })} required
                    min="0" step="0.01" placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text placeholder-gray-400 text-sm outline-none focus:border-[#072C2C]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Ödeme Yöntemi</label>
                  <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] cursor-pointer">
                    {Object.entries(paymentMethods).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-enterprise-border text-enterprise-text-secondary hover:text-enterprise-text font-medium text-sm transition-all">İptal</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Invoice Prompt */}
      {showInvoicePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FF5F03]/10 flex items-center justify-center">
                <FileText size={20} className="text-enterprise-secondary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-enterprise-text">Fatura Oluştur</h3>
                <p className="text-sm text-enterprise-text-secondary mt-0.5">Bu sefer için fatura kaydı bulunamadı. Otomatik oluşturulsun mu?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowInvoicePrompt(false); setLastCreatedTripId(null); }}
                className="flex-1 py-2.5 rounded-lg border border-enterprise-border text-enterprise-text-secondary hover:text-enterprise-text font-medium text-sm transition-all">Hayır</button>
              <button onClick={handleAutoInvoice} disabled={creatingInvoice}
                className="flex-1 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {creatingInvoice && <Loader2 size={16} className="animate-spin" />}
                Evet, Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
