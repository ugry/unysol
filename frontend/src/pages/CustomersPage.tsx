import { useState, useEffect, type FormEvent } from 'react';
import {
  Plus, Loader2, AlertCircle, X, Search, Users, Phone, Mail, MapPin,
  Building2, FileText, TrendingUp, AlertTriangle, DollarSign,
} from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

interface Customer {
  id: number;
  firma_unvani: string;
  yetkili: string;
  telefon: string;
  email: string;
  adres: string;
  fatura_adresi: string;
  vergi_dairesi: string;
  vergi_no: string;
  kategori: string;
  bakiye: number;
  acik_hesap_limiti: number;
  risk_skoru: string;
  vade_gun: number;
  notlar: string;
  durum: string;
  toplam_sefer?: number;
  toplam_fatura?: number;
  toplam_ciro?: number;
  bekleyen_tahsilat?: number;
}

const KATEGORILER = ['GENEL', 'VIP', 'KURUMSAL', 'BAYI', 'YURTDISI'];
const RISK_SKORLARI = ['DUSUK', 'ORTA', 'YUKSEK', 'KRITIK'];

const kategoriColors: Record<string, string> = {
  GENEL: 'border-gray-300 text-gray-600 bg-gray-50',
  VIP: 'border-yellow-300 text-yellow-700 bg-yellow-50',
  KURUMSAL: 'border-blue-300 text-blue-700 bg-blue-50',
  BAYI: 'border-purple-300 text-purple-700 bg-purple-50',
  YURTDISI: 'border-green-300 text-green-700 bg-green-50',
};

const riskColors: Record<string, string> = {
  DUSUK: 'text-[#16A34A]',
  ORTA: 'text-[#D97706]',
  YUKSEK: 'text-[#DC2626]',
  KRITIK: 'text-[#DC2626] font-bold',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showDetail, setShowDetail] = useState<Customer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formData, setFormData] = useState({
    firma_unvani: '', yetkili: '', telefon: '', email: '', adres: '',
    fatura_adresi: '', vergi_dairesi: '', vergi_no: '',
    kategori: 'GENEL', acik_hesap_limiti: 0, risk_skoru: 'DUSUK',
    vade_gun: 30, notlar: '',
  });

  // KPI
  const totalBakiye = customers.reduce((s, c) => s + (c.bakiye || 0), 0);
  const riskliMusteriler = customers.filter(c => c.risk_skoru === 'YUKSEK' || c.risk_skoru === 'KRITIK').length;

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = () => {
    setLoading(true);
    api.get<Customer[]>('/api/tenant/customers')
      .then(r => { if (Array.isArray(r.data)) setCustomers(r.data); })
      .catch(() => setError('Müşteriler yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  const openDetail = async (c: Customer) => {
    setDetailLoading(true);
    try {
      const r = await api.get(`/api/tenant/customers/${c.id}/detail`);
      setShowDetail(r.data);
    } catch { setShowDetail(c); }
    finally { setDetailLoading(false); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.firma_unvani.trim()) { setFormError('Firma unvanı zorunludur.'); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/api/tenant/customers/${editingId}`, formData);
      } else {
        await api.post('/api/tenant/customers', formData);
      }
      setShowModal(false); setEditingId(null); fetchCustomers();
    } catch { setFormError('İşlem başarısız.'); }
    finally { setSubmitting(false); }
  };

  const filtered = customers.filter(c => {
    const s = search.toLowerCase();
    const match = !s || (c.firma_unvani || '').toLowerCase().includes(s) || (c.yetkili || '').toLowerCase().includes(s);
    const matchKat = !kategoriFilter || c.kategori === kategoriFilter;
    return match && matchKat;
  });

  const columns: Column<Customer>[] = [
    { key: 'firma_unvani', header: 'Firma', sortable: true, render: c => (
      <button onClick={(e) => { e.stopPropagation(); openDetail(c); }} className="text-sm font-medium text-enterprise-text hover:text-[#072C2C] underline decoration-dotted text-left">
        {c.firma_unvani}
      </button>
    ), exportRender: c => c.firma_unvani },
    { key: 'kategori', header: 'Kategori', render: c => (
      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${kategoriColors[c.kategori] || kategoriColors.GENEL}`}>
        {c.kategori || 'GENEL'}
      </span>
    ), exportRender: c => c.kategori || 'GENEL' },
    { key: 'yetkili', header: 'Yetkili', exportRender: c => c.yetkili || '' },
    { key: 'telefon', header: 'Telefon', exportRender: c => c.telefon || '' },
    { key: 'bakiye', header: 'Bakiye', align: 'right', render: c => (
      <span className={`text-sm font-medium ${(c.bakiye || 0) > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
        ₺{(c.bakiye || 0).toLocaleString('tr-TR')}
      </span>
    ), exportRender: c => String(c.bakiye || 0) },
    { key: 'risk_skoru', header: 'Risk', align: 'center', render: c => (
      <span className={`text-xs font-medium ${riskColors[c.risk_skoru] || riskColors.DUSUK}`}>
        {c.risk_skoru === 'DUSUK' ? '⬇' : c.risk_skoru === 'ORTA' ? '➡' : c.risk_skoru === 'YUKSEK' ? '⬆' : '⚠'} {c.risk_skoru || 'DUSUK'}
      </span>
    ), exportRender: c => c.risk_skoru || 'DUSUK' },
    { key: 'durum', header: 'Durum', align: 'center', render: c => (
      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${c.durum === 'AKTIF' ? 'border-[#16A34A]/30 text-[#16A34A] bg-[#16A34A]/10' : 'border-gray-300 text-gray-500 bg-gray-50'}`}>
        {c.durum === 'AKTIF' ? 'Aktif' : 'Pasif'}
      </span>
    ), exportRender: c => c.durum || '' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-enterprise-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Users size={16} className="text-enterprise-text-muted" /><span className="text-xs text-enterprise-text-muted">Toplam Müşteri</span></div>
          <p className="text-2xl font-bold text-enterprise-text">{customers.length}</p>
        </div>
        <div className="bg-white border border-enterprise-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={16} className="text-enterprise-text-muted" /><span className="text-xs text-enterprise-text-muted">Toplam Bakiye</span></div>
          <p className={`text-2xl font-bold ${totalBakiye > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>₺{totalBakiye.toLocaleString('tr-TR')}</p>
        </div>
        <div className="bg-white border border-enterprise-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-enterprise-text-muted" /><span className="text-xs text-enterprise-text-muted">Riskli Müşteri</span></div>
          <p className={`text-2xl font-bold ${riskliMusteriler > 0 ? 'text-[#DC2626]' : 'text-enterprise-text'}`}>{riskliMusteriler}</p>
        </div>
        <div className="bg-white border border-enterprise-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-enterprise-text-muted" /><span className="text-xs text-enterprise-text-muted">Aktif</span></div>
          <p className="text-2xl font-bold text-enterprise-text">{customers.filter(c => c.durum === 'AKTIF').length}</p>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-3">
          <div className="relative max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Firma veya yetkili ara..." className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-gray-400 text-sm outline-none focus:border-[#FF5F03]" />
          </div>
          <select value={kategoriFilter} onChange={e => setKategoriFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm cursor-pointer">
            <option value="">Tüm Kategoriler</option>
            {KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({ firma_unvani: '', yetkili: '', telefon: '', email: '', adres: '', fatura_adresi: '', vergi_dairesi: '', vergi_no: '', kategori: 'GENEL', acik_hesap_limiti: 0, risk_skoru: 'DUSUK', vade_gun: 30, notlar: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all flex-shrink-0">
          <Plus size={18} /> Yeni Müşteri
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm flex items-center gap-2"><AlertCircle size={16} />{error}<button onClick={() => setError('')} className="ml-auto"><X size={16} /></button></div>}

      <DataGrid columns={columns} data={filtered} loading={loading} title="Müşteriler"
        onEdit={c => { setEditingId(c.id); setFormData({ firma_unvani: c.firma_unvani, yetkili: c.yetkili || '', telefon: c.telefon || '', email: c.email || '', adres: c.adres || '', fatura_adresi: c.fatura_adresi || '', vergi_dairesi: c.vergi_dairesi || '', vergi_no: c.vergi_no || '', kategori: c.kategori || 'GENEL', acik_hesap_limiti: c.acik_hesap_limiti || 0, risk_skoru: c.risk_skoru || 'DUSUK', vade_gun: c.vade_gun || 30, notlar: c.notlar || '' }); setShowModal(true); }}
        onDelete={c => { api.delete(`/api/tenant/customers/${c.id}`).then(() => { setCustomers(prev => prev.filter(x => x.id !== c.id)); }).catch(() => {}); }}
        onBulkDelete={ids => { ids.forEach(id => api.delete(`/api/tenant/customers/${id}`).catch(() => {})); setCustomers(prev => prev.filter(x => !ids.includes(String(x.id)))); }}
        emptyIcon={<Users size={48} className="text-gray-300" />}
        emptyText={search || kategoriFilter ? 'Aramanızla eşleşen müşteri bulunamadı' : 'Henüz müşteri kaydı yok'} />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-enterprise-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">{editingId ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-enterprise-text-muted hover:text-enterprise-text p-1 rounded-md hover:bg-gray-100"><X size={20} /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Firma Unvanı *</label><input type="text" value={formData.firma_unvani} onChange={e => setFormData({...formData, firma_unvani: e.target.value})} required className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Yetkili</label><input type="text" value={formData.yetkili} onChange={e => setFormData({...formData, yetkili: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Telefon</label><input type="text" value={formData.telefon} onChange={e => setFormData({...formData, telefon: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">E-posta</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
              </div>
              <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Adres</label><input type="text" value={formData.adres} onChange={e => setFormData({...formData, adres: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Vergi Dairesi</label><input type="text" value={formData.vergi_dairesi} onChange={e => setFormData({...formData, vergi_dairesi: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Vergi No</label><input type="text" value={formData.vergi_no} onChange={e => setFormData({...formData, vergi_no: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Kategori</label><select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm cursor-pointer">{KATEGORILER.map(k => <option key={k}>{k}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Risk Skoru</label><select value={formData.risk_skoru} onChange={e => setFormData({...formData, risk_skoru: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm cursor-pointer">{RISK_SKORLARI.map(r => <option key={r}>{r}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Vade (Gün)</label><input type="number" value={formData.vade_gun} onChange={e => setFormData({...formData, vade_gun: Number(e.target.value)})} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C]" /></div>
              </div>
              <div><label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">Notlar</label><textarea value={formData.notlar} onChange={e => setFormData({...formData, notlar: e.target.value})} rows={2} className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="flex-1 py-2.5 rounded-lg border border-enterprise-border text-enterprise-text-secondary font-medium text-sm">İptal</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2">{submitting && <Loader2 size={16} className="animate-spin" />}{editingId ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-enterprise-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">{showDetail.firma_unvani}</h3>
              <button onClick={() => setShowDetail(null)} className="text-enterprise-text-muted hover:text-enterprise-text p-1 rounded-md hover:bg-gray-100"><X size={20} /></button>
            </div>
            {detailLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} /></div> : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-enterprise-text-muted">Toplam Sefer</span><p className="text-lg font-bold text-enterprise-text">{showDetail.toplam_sefer || 0}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-enterprise-text-muted">Toplam Fatura</span><p className="text-lg font-bold text-enterprise-text">{showDetail.toplam_fatura || 0}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-enterprise-text-muted">Toplam Ciro</span><p className="text-lg font-bold text-enterprise-text">₺{(showDetail.toplam_ciro || 0).toLocaleString('tr-TR')}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-enterprise-text-muted">Bekleyen Tahsilat</span><p className={`text-lg font-bold ${(showDetail.bekleyen_tahsilat || 0) > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>₺{(showDetail.bekleyen_tahsilat || 0).toLocaleString('tr-TR')}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-enterprise-text-muted">Yetkili:</span> <span className="text-enterprise-text">{showDetail.yetkili || '-'}</span></div>
                  <div><span className="text-enterprise-text-muted">Kategori:</span> <span className="text-enterprise-text">{showDetail.kategori || 'GENEL'}</span></div>
                  <div className="flex items-center gap-1"><Phone size={14} className="text-enterprise-text-muted" /><span className="text-enterprise-text">{showDetail.telefon || '-'}</span></div>
                  <div className="flex items-center gap-1"><Mail size={14} className="text-enterprise-text-muted" /><span className="text-enterprise-text">{showDetail.email || '-'}</span></div>
                  <div className="flex items-center gap-1"><MapPin size={14} className="text-enterprise-text-muted" /><span className="text-enterprise-text">{showDetail.adres || '-'}</span></div>
                  <div><span className="text-enterprise-text-muted">Vade:</span> <span className="text-enterprise-text">{showDetail.vade_gun || 30} gün</span></div>
                  <div><span className="text-enterprise-text-muted">Risk:</span> <span className={riskColors[showDetail.risk_skoru || ''] || ''}>{showDetail.risk_skoru || 'DUSUK'}</span></div>
                  <div><span className="text-enterprise-text-muted">Bakiye:</span> <span className={(showDetail.bakiye || 0) > 0 ? 'text-[#DC2626] font-medium' : 'text-[#16A34A] font-medium'}>₺{(showDetail.bakiye || 0).toLocaleString('tr-TR')}</span></div>
                </div>
                {showDetail.notlar && <div className="bg-gray-50 rounded-lg p-3 text-sm text-enterprise-text-secondary"><span className="font-medium text-enterprise-text">Notlar:</span> {showDetail.notlar}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
