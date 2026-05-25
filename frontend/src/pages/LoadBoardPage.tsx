import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import { Plus, Search, X, Loader2, Package } from 'lucide-react';

interface LoadBoardItem {
  id: number;
  type: string;
  from_city: string;
  to_city: string;
  load_date: string;
  weight_kg?: number;
  vehicle_type?: string;
  price?: number;
  description?: string;
  status?: string;
  contact_phone?: string;
}

const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
  YUK_VAR: { label: 'Yük Var', bg: 'bg-[#3b82f6]/15', text: 'text-blue-600' },
  YUK_ARA: { label: 'Yük Ara', bg: 'bg-[#FF5F03]/15', text: 'text-[#FF5F03]' },
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  AKTIF: { label: 'Aktif', bg: 'bg-[#16A34A]/15', text: 'text-[#16A34A]' },
  KAPANDI: { label: 'Kapandı', bg: 'bg-[#8a8f98]/15', text: 'text-[#8a8f98]' },
};

interface FormData {
  type: string;
  from_city: string;
  to_city: string;
  load_date: string;
  weight_kg: string;
  vehicle_type: string;
  price: string;
  description: string;
  contact_phone: string;
}

const emptyForm: FormData = {
  type: 'YUK_VAR', from_city: '', to_city: '', load_date: '',
  weight_kg: '', vehicle_type: '', price: '', description: '', contact_phone: '',
};

export default function LoadBoardPage() {
  const [data, setData] = useState<LoadBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<LoadBoardItem[]>('/api/tenant/load-board/')
      .then(r => { if (!cancelled) setData(r.data); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const payload = {
      type: formData.type, from_city: formData.from_city, to_city: formData.to_city,
      load_date: formData.load_date,
      weight_kg: parseFloat(formData.weight_kg) || 0,
      vehicle_type: formData.vehicle_type,
      price: parseFloat(formData.price) || 0,
      description: formData.description,
      contact_phone: formData.contact_phone,
    };
    try {
      if (editingId) {
        await api.put(`/api/tenant/load-board/${editingId}`, payload);
        setData(prev => prev.map(d => d.id === editingId ? { ...d, ...payload, type: payload.type } : d));
      } else {
        const res = await api.post<LoadBoardItem>('/api/tenant/load-board/', payload);
        if (res.data) setData(prev => [res.data, ...prev]);
      }
      setShowModal(false); setEditingId(null); setFormData(emptyForm);
    } catch { setFormError('Kaydedilirken hata oluştu.'); }
    finally { setSubmitting(false); }
  };

  const filtered = data.filter(item => {
    const s = search.toLowerCase();
    const match = !s || item.from_city.toLowerCase().includes(s) || item.to_city.toLowerCase().includes(s) || (item.description || '').toLowerCase().includes(s);
    const typeMatch = !typeFilter || item.type === typeFilter;
    return match && typeMatch;
  });

  const columns: Column<LoadBoardItem>[] = [
    { key: 'type', header: 'Tür', sortable: true,
      render: (row) => { const c = typeConfig[row.type] || typeConfig.YUK_VAR; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>; },
      exportRender: (row) => typeConfig[row.type]?.label || row.type },
    { key: 'from_city', header: 'Nereden', sortable: true },
    { key: 'to_city', header: 'Nereye', sortable: true },
    { key: 'load_date', header: 'Tarih', sortable: true },
    { key: 'weight_kg', header: 'Ağırlık (kg)', align: 'right' as const, sortable: true,
      render: (row) => row.weight_kg ? <span className="text-sm">{row.weight_kg.toLocaleString('tr-TR')}</span> : <span className="text-sm text-[#555]">-</span>,
      exportRender: (row) => row.weight_kg ? String(row.weight_kg) : '-' },
    { key: 'vehicle_type', header: 'Araç Tipi',
      render: (row) => row.vehicle_type || <span className="text-sm text-[#555]">-</span>,
      exportRender: (row) => row.vehicle_type || '-' },
    { key: 'price', header: 'Fiyat', align: 'right' as const, sortable: true,
      render: (row) => row.price ? <span className="text-sm text-[#16A34A] font-medium">₺{row.price.toLocaleString('tr-TR')}</span> : <span className="text-sm text-[#555]">-</span>,
      exportRender: (row) => row.price ? `₺${row.price}` : '-' },
    { key: 'status', header: 'Durum', sortable: true,
      render: (row) => { const c = statusConfig[row.status || ''] || statusConfig.AKTIF; return <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>; },
      exportRender: (row) => statusConfig[row.status || '']?.label || row.status || '-' },
    { key: 'contact_phone', header: 'İletişim' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Şehir veya açıklama ara..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] cursor-pointer">
            <option value="">Tüm Türler</option>
            <option value="YUK_VAR">Yük Var</option>
            <option value="YUK_ARA">Yük Ara</option>
          </select>
        </div>
        <button onClick={() => { setEditingId(null); setFormData(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0">
          <Plus size={18} /> Yük Ekle
        </button>
      </div>

      <DataGrid columns={columns} data={filtered} loading={loading} title="Yük Panosu"
        emptyIcon={<Package size={48} className="text-[#2a2a2a]" />}
        emptyText={search || typeFilter ? 'Aramanızla eşleşen yük bulunamadı' : 'Henüz yük kaydı yok'}
        onEdit={(row) => {
          setFormData({
            type: row.type, from_city: row.from_city, to_city: row.to_city,
            load_date: row.load_date,
            weight_kg: row.weight_kg ? String(row.weight_kg) : '',
            vehicle_type: row.vehicle_type || '',
            price: row.price ? String(row.price) : '',
            description: row.description || '',
            contact_phone: row.contact_phone || '',
          });
          setEditingId(row.id); setShowModal(true);
        }}
        onDelete={async (row) => {
          try { await api.delete(`/api/tenant/load-board/${row.id}`); } catch {}
          setData(prev => prev.filter(d => d.id !== row.id));
        }}
        onBulkDelete={(ids) => {
          ids.forEach(id => { api.delete(`/api/tenant/load-board/${id}`).catch(() => {}); });
          setData(prev => prev.filter(d => !ids.includes(String(d.id))));
        }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">{editingId ? 'Yük Düzenle' : 'Yeni Yük'}</h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); setFormError(''); }}
                className="text-enterprise-text-muted hover:text-enterprise-text transition-colors p-1 rounded-md hover:bg-gray-100"><X size={20} /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Tür</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] cursor-pointer">
                    <option value="YUK_VAR">Yük Var</option>
                    <option value="YUK_ARA">Yük Ara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Tarih</label>
                  <input type="date" value={formData.load_date} onChange={e => setFormData({ ...formData, load_date: e.target.value })} required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Nereden</label>
                  <input type="text" value={formData.from_city} onChange={e => setFormData({ ...formData, from_city: e.target.value })} required placeholder="İstanbul"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Nereye</label>
                  <input type="text" value={formData.to_city} onChange={e => setFormData({ ...formData, to_city: e.target.value })} required placeholder="Ankara"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Ağırlık (kg)</label>
                  <input type="number" value={formData.weight_kg} onChange={e => setFormData({ ...formData, weight_kg: e.target.value })} min="0" placeholder="25000"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Fiyat (₺)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} min="0" step="0.01" placeholder="15000"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Araç Tipi</label>
                <input type="text" value={formData.vehicle_type} onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })} placeholder="Tır, Kamyon, Kırkayak..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Açıklama</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Paletli, istiflenebilir..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">İletişim Telefonu</label>
                <input type="text" value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="0532 111 22 33"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-enterprise-border text-enterprise-text-muted hover:text-enterprise-text hover:border-gray-400 font-medium text-sm transition-all">İptal</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />} Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
