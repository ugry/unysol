import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import { Plus, Search, X, Loader2, Package, Phone, Mail, Building2 } from 'lucide-react';

interface LoadBoardItem {
  id: number;
  type: string;
  from_city: string;
  from_district: string;
  to_city: string;
  to_district: string;
  load_date: string;
  weight_kg?: number;
  vehicle_type?: string;
  price?: number;
  description?: string;
  status: string;
  contact_phone?: string;
  contact_email: string;
  company_name: string;
}

interface CityData { name: string; districts: string[] }

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
  from_district: string;
  to_city: string;
  to_district: string;
  load_date: string;
  weight_kg: string;
  vehicle_type: string;
  price: string;
  description: string;
  contact_phone: string;
}

const emptyForm: FormData = {
  type: 'YUK_VAR', from_city: '', from_district: '', to_city: '', to_district: '', load_date: '',
  weight_kg: '', vehicle_type: '', price: '', description: '', contact_phone: '',
};

export default function LoadBoardPage() {
  const [data, setData] = useState<LoadBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [cities, setCities] = useState<CityData[]>([]);
  const [fromDistricts, setFromDistricts] = useState<string[]>([]);
  const [toDistricts, setToDistricts] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    api.get<LoadBoardItem[]>('/api/tenant/load-board/')
      .then(r => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get<CityData[]>('/api/cities')
      .then(r => setCities(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const handleCityChange = (city: string, type: 'from' | 'to') => {
    const cityData = cities.find(c => c.name === city);
    if (type === 'from') {
      setFormData(f => ({ ...f, from_city: city, from_district: '' }));
      setFromDistricts(cityData?.districts || []);
    } else {
      setFormData(f => ({ ...f, to_city: city, to_district: '' }));
      setToDistricts(cityData?.districts || []);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.from_city || !formData.to_city || !formData.load_date) {
      setFormError('Kalkış şehri, varış şehri ve tarih zorunludur.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/tenant/load-board/', {
        ...formData,
        weight_kg: parseInt(formData.weight_kg) || 0,
        price: parseInt(formData.price) || 0,
      });
      setShowModal(false);
      setFormData(emptyForm);
      setFromDistricts([]);
      setToDistricts([]);
      const r = await api.get<LoadBoardItem[]>('/api/tenant/load-board/');
      setData(Array.isArray(r.data) ? r.data : []);
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Kayıt oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/tenant/load-board/${id}`);
      setData(prev => prev.filter(i => i.id !== id));
    } catch {}
  };

  const filtered = data.filter(item => {
    if (typeFilter && item.type !== typeFilter) return false;
    if (cityFilter && !item.from_city.toLowerCase().includes(cityFilter.toLowerCase()) && !item.to_city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (search) {
      const s = search.toLowerCase();
      return item.from_city.toLowerCase().includes(s) || item.to_city.toLowerCase().includes(s) ||
             item.company_name.toLowerCase().includes(s) || (item.description || '').toLowerCase().includes(s);
    }
    return true;
  });

  const columns: Column<LoadBoardItem>[] = [
    { key: 'type', header: 'Tür', render: (row) => {
      const cfg = typeConfig[row.type] || typeConfig.YUK_VAR;
      return <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
    }},
    { key: 'from_city', header: 'Nereden', render: (row) => `${row.from_city}${row.from_district ? ', ' + row.from_district : ''}` },
    { key: 'to_city', header: 'Nereye', render: (row) => `${row.to_city}${row.to_district ? ', ' + row.to_district : ''}` },
    { key: 'load_date', header: 'Tarih' },
    { key: 'weight_kg', header: 'Ağırlık (kg)' },
    { key: 'vehicle_type', header: 'Araç' },
    { key: 'price', header: 'Fiyat', render: (row) => row.price ? `₺${row.price.toLocaleString('tr')}` : '-' },
    { key: 'company_name', header: 'Firma', render: (row) => (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-enterprise-text font-medium text-sm">
          <Building2 size={13} /> {row.company_name}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-enterprise-text-muted">
          <Mail size={12} /> {row.contact_email || '-'}
        </div>
        {row.contact_phone && (
          <div className="flex items-center gap-1.5 text-xs text-enterprise-text-muted">
            <Phone size={12} /> {row.contact_phone}
          </div>
        )}
      </div>
    )},
    { key: 'status', header: 'Durum', render: (row) => {
      const cfg = statusConfig[row.status] || statusConfig.AKTIF;
      return <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
    }},
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Şehir, firma ara..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-gray-400 text-sm outline-none focus:border-[#FF5F03]"
            />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm cursor-pointer">
            <option value="">Tüm İlanlar</option>
            <option value="YUK_VAR">Yük Var</option>
            <option value="YUK_ARA">Yük Ara</option>
          </select>
          <input type="text" value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            placeholder="Şehir filtrele..."
            className="px-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] max-w-[180px]"
          />
        </div>
        <button onClick={() => { setEditingId(null); setFormData(emptyForm); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm">
          <Plus size={18} /> Yeni İlan
        </button>
      </div>

      <DataGrid columns={columns} data={filtered} loading={loading} title="Yük Panosu"
        onDelete={(row) => handleDelete(row.id)}
        emptyIcon={<Package size={48} className="text-gray-300" />}
        emptyText={search || typeFilter || cityFilter ? 'Aramanızla eşleşen ilan bulunamadı' : 'Henüz ilan yok'} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">Yeni İlan</h3>
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="text-enterprise-text-muted hover:text-enterprise-text p-1 rounded-md hover:bg-gray-100"><X size={20} /></button>
            </div>

            {formError && (<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>)}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">İlan Türü</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" checked={formData.type === 'YUK_VAR'} onChange={() => setFormData(f => ({ ...f, type: 'YUK_VAR' }))} className="accent-[#FF5F03]" />
                    <span className="text-sm">Yük Var</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" checked={formData.type === 'YUK_ARA'} onChange={() => setFormData(f => ({ ...f, type: 'YUK_ARA' }))} className="accent-[#FF5F03]" />
                    <span className="text-sm">Yük Ara</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kalkış Şehri</label>
                  <select value={formData.from_city} onChange={e => handleCityChange(e.target.value, 'from')} required
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm cursor-pointer">
                    <option value="">Seçiniz</option>
                    {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kalkış İlçesi</label>
                  <select value={formData.from_district} onChange={e => setFormData(f => ({ ...f, from_district: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm cursor-pointer">
                    <option value="">Seçiniz</option>
                    {fromDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Varış Şehri</label>
                  <select value={formData.to_city} onChange={e => handleCityChange(e.target.value, 'to')} required
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm cursor-pointer">
                    <option value="">Seçiniz</option>
                    {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Varış İlçesi</label>
                  <select value={formData.to_district} onChange={e => setFormData(f => ({ ...f, to_district: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm cursor-pointer">
                    <option value="">Seçiniz</option>
                    {toDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tarih</label>
                  <input type="date" value={formData.load_date} onChange={e => setFormData(f => ({ ...f, load_date: e.target.value }))} required
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ağırlık (kg)</label>
                  <input type="number" value={formData.weight_kg} onChange={e => setFormData(f => ({ ...f, weight_kg: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Araç Tipi</label>
                  <select value={formData.vehicle_type} onChange={e => setFormData(f => ({ ...f, vehicle_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm cursor-pointer">
                    <option value="">Seçiniz</option>
                    <option value="TIR">TIR</option>
                    <option value="KAMYON">Kamyon</option>
                    <option value="KIRKAYAK">Kırkayak</option>
                    <option value="KAMYONET">Kamyonet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fiyat (₺)</label>
                  <input type="number" value={formData.price} onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">İletişim Telefon</label>
                  <input type="text" value={formData.contact_phone} onChange={e => setFormData(f => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="0555 000 00 00" className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Açıklama</label>
                <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Yük detayları..." className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm resize-none" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                İlan Ver
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
