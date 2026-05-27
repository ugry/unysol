import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import { Plus, X, Loader2, CreditCard } from 'lucide-react';

interface TollLog { id: number; truck_id: number; truck_plaka: string; gecis_tarihi: string; hgs_etiket_no: string; giris_gise: string; cikis_gise: string; gecis_ucreti: number }
interface TruckOption { id: number; plaka: string }

export default function TollLogsPage() {
  const [data, setData] = useState<TollLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ truck_id: 0, gecis_tarihi: '', hgs_etiket_no: '', giris_gise: '', cikis_gise: '', gecis_ucreti: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    api.get('/api/tenant/toll-logs').then(r => setData(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
    api.get('/api/tenant/trucks').then(r => setTrucks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.truck_id) { setFormError('Kamyon zorunludur'); return; }
    setSubmitting(true);
    try { await api.post('/api/tenant/toll-logs', { ...form, gecis_ucreti: parseFloat(form.gecis_ucreti) || 0 }); setShowModal(false); setForm({ truck_id: 0, gecis_tarihi: '', hgs_etiket_no: '', giris_gise: '', cikis_gise: '', gecis_ucreti: '' }); fetchData(); }
    catch (err: any) { setFormError(err?.response?.data?.error || 'Kayıt oluşturulamadı'); }
    finally { setSubmitting(false); }
  };

  const columns: Column<TollLog>[] = [
    { key: 'truck_plaka', header: 'Plaka' },
    { key: 'gecis_tarihi', header: 'Geçiş Tarihi', render: r => (r.gecis_tarihi || '').substring(0, 10) },
    { key: 'hgs_etiket_no', header: 'HGS Etiket' },
    { key: 'giris_gise', header: 'Giriş Gişe' },
    { key: 'cikis_gise', header: 'Çıkış Gişe' },
    { key: 'gecis_ucreti', header: 'Ücret', render: r => r.gecis_ucreti ? `₺${r.gecis_ucreti.toFixed(2)}` : '-' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between"><div /><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm"><Plus size={18} /> HGS Ekle</button></div>
      <DataGrid columns={columns} data={data} loading={loading} title="HGS Geçiş Takibi" emptyIcon={<CreditCard size={48} className="text-gray-300" />} emptyText="Henüz HGS kaydı yok"
        onDelete={row => { api.delete(`/api/tenant/toll-logs/${row.id}`).then(() => setData(prev => prev.filter(i => i.id !== row.id))); }} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold">HGS Geçişi Ekle</h3><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Kamyon</label><select value={form.truck_id} onChange={e => setForm(f => ({ ...f, truck_id: parseInt(e.target.value) || 0 }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm"><option value={0}>Seçiniz</option>{trucks.map(t => <option key={t.id} value={t.id}>{t.plaka}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Geçiş Tarihi</label><input type="date" value={form.gecis_tarihi} onChange={e => setForm(f => ({ ...f, gecis_tarihi: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">HGS Etiket No</label><input type="text" value={form.hgs_etiket_no} onChange={e => setForm(f => ({ ...f, hgs_etiket_no: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Giriş Gişe</label><input type="text" value={form.giris_gise} onChange={e => setForm(f => ({ ...f, giris_gise: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Çıkış Gişe</label><input type="text" value={form.cikis_gise} onChange={e => setForm(f => ({ ...f, cikis_gise: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Geçiş Ücreti (₺)</label><input type="number" step="0.01" value={form.gecis_ucreti} onChange={e => setForm(f => ({ ...f, gecis_ucreti: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting ? <Loader2 size={16} className="animate-spin inline" /> : 'Kaydet'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
