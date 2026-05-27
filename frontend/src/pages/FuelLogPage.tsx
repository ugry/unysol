import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import { Plus, X, Loader2, Fuel } from 'lucide-react';

interface FuelLog { id: number; truck_id: number; truck_plaka: string; tarih: string; miktar_litre: number; birim_fiyat: number; toplam_tutar: number; alinan_yer: string; km_okuma: number; delta_km: number; litre_per_100km: number; expense_id: number }
interface TruckOption { id: number; plaka: string }

export default function FuelLogPage() {
  const [data, setData] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ truck_id: 0, tarih: '', miktar_litre: '', birim_fiyat: '', toplam_tutar: '', alinan_yer: '', km_okuma: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    api.get('/api/tenant/fuel-logs').then(r => setData(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
    api.get('/api/tenant/trucks').then(r => setTrucks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.truck_id || !form.miktar_litre) { setFormError('Kamyon ve litre zorunludur'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/tenant/fuel-logs', { ...form, truck_id: Number(form.truck_id), miktar_litre: parseFloat(form.miktar_litre), birim_fiyat: parseFloat(form.birim_fiyat) || 0, toplam_tutar: parseFloat(form.toplam_tutar) || 0, km_okuma: parseInt(form.km_okuma) || 0 });
      setShowModal(false); setForm({ truck_id: 0, tarih: '', miktar_litre: '', birim_fiyat: '', toplam_tutar: '', alinan_yer: '', km_okuma: '' }); fetchData();
    } catch (err: any) { setFormError(err?.response?.data?.error || 'Kayıt oluşturulamadı'); }
    finally { setSubmitting(false); }
  };

  const columns: Column<FuelLog>[] = [
    { key: 'truck_plaka', header: 'Plaka' },
    { key: 'tarih', header: 'Tarih' },
    { key: 'miktar_litre', header: 'Litre', render: r => `${r.miktar_litre.toFixed(0)} L` },
    { key: 'birim_fiyat', header: 'Birim Fiyat', render: r => r.birim_fiyat ? `₺${r.birim_fiyat.toFixed(2)}` : '-' },
    { key: 'toplam_tutar', header: 'Toplam', render: r => `₺${r.toplam_tutar.toFixed(2)}` },
    { key: 'km_okuma', header: 'KM', render: r => r.km_okuma > 0 ? r.km_okuma.toLocaleString('tr') : '-' },
    { key: 'delta_km', header: 'Δ KM', render: r => r.delta_km > 0 ? r.delta_km.toLocaleString('tr') : '-' },
    { key: 'litre_per_100km', header: 'L/100km', render: r => r.litre_per_100km > 0 ? r.litre_per_100km.toFixed(1) : '-' },
    { key: 'alinan_yer', header: 'Alınan Yer' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm"><Plus size={18} /> Yakıt Ekle</button>
      </div>
      <DataGrid columns={columns} data={data} loading={loading} title="Yakıt Takip" emptyIcon={<Fuel size={48} className="text-gray-300" />} emptyText="Henüz yakıt kaydı yok"
        onDelete={row => { api.delete(`/api/tenant/fuel-logs/${row.id}`).then(() => setData(prev => prev.filter(i => i.id !== row.id))); }} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold">Yakıt Ekle</h3><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Kamyon</label>
                <select value={form.truck_id} onChange={e => setForm(f => ({ ...f, truck_id: parseInt(e.target.value) || 0 }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm">
                  <option value={0}>Seçiniz</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.plaka}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Tarih</label><input type="date" value={form.tarih} onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Litre</label><input type="number" step="0.01" value={form.miktar_litre} onChange={e => setForm(f => ({ ...f, miktar_litre: e.target.value }))} required placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Birim Fiyat (₺)</label><input type="number" step="0.01" value={form.birim_fiyat} onChange={e => setForm(f => ({ ...f, birim_fiyat: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Toplam Tutar (₺)</label><input type="number" step="0.01" value={form.toplam_tutar} onChange={e => setForm(f => ({ ...f, toplam_tutar: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">KM Okuma</label><input type="number" value={form.km_okuma} onChange={e => setForm(f => ({ ...f, km_okuma: e.target.value }))} placeholder="0" className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Alınan Yer</label><input type="text" value={form.alinan_yer} onChange={e => setForm(f => ({ ...f, alinan_yer: e.target.value }))} placeholder="İstasyon adı" className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting ? <Loader2 size={16} className="animate-spin inline" /> : 'Kaydet'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
