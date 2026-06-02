import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import { Plus, X, Loader2, Wrench } from 'lucide-react';

interface MaintEntry { id: number; truck_id: number; truck_plaka: string; tarih: string; km: number; turu: string; yapilan_islemler: string; toplam_tutar: number; fatura_no: string; servis_adi: string; sonraki_bakim_km: number; sonraki_bakim_tarih: string }
interface TruckOption { id: number; plaka: string }

const turuLabels: Record<string, string> = { PERIYODIK_BAKIM: 'Periyodik Bakım', FREN_BALATA: 'Fren Balata', FREN_DISK: 'Fren Disk', DEBRIYAJ: 'Debriyaj', TRIGER_ZINCIR: 'Triger Zincir', YAG_DEGISIM: 'Yağ Değişim', LASTIK_DEGISIM: 'Lastik Değişim', ROT_BALANS: 'Rot Balans', KLIMATIK: 'Klimatik', ELEKTRIK: 'Elektrik', AKU: 'Akü', DIGER: 'Diğer' };

export default function MaintenancePage() {
  const [data, setData] = useState<MaintEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [trucks, setTrucks] = useState<TruckOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ truck_id: 0, tarih: '', km: '', turu: 'PERIYODIK_BAKIM', yapilan_islemler: '', toplam_tutar: '', fatura_no: '', servis_adi: '', sonraki_bakim_km: '', sonraki_bakim_tarih: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = () => {
    api.get('/api/tenant/maintenance').then(r => setData(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
    api.get('/api/tenant/trucks').then(r => setTrucks(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.truck_id || !form.tarih) { setFormError('Kamyon ve tarih zorunludur'); return; }
    setSubmitting(true);
    try {
      if (editingId) await api.put(`/api/tenant/maintenance/${editingId}`, { ...form, truck_id: Number(form.truck_id), km: parseInt(form.km) || 0, toplam_tutar: parseFloat(form.toplam_tutar) || 0, sonraki_bakim_km: parseInt(form.sonraki_bakim_km) || 0 }); else await api.post('/api/tenant/maintenance', { ...form, truck_id: Number(form.truck_id), km: parseInt(form.km) || 0, toplam_tutar: parseFloat(form.toplam_tutar) || 0, sonraki_bakim_km: parseInt(form.sonraki_bakim_km) || 0 });
      setShowModal(false); setEditingId(null); setForm({ truck_id: 0, tarih: '', km: '', turu: 'PERIYODIK_BAKIM', yapilan_islemler: '', toplam_tutar: '', fatura_no: '', servis_adi: '', sonraki_bakim_km: '', sonraki_bakim_tarih: '' }); fetchData();
    } catch (err: any) { setFormError(err?.response?.data?.error || 'Kayıt oluşturulamadı'); }
    finally { setSubmitting(false); }
  };

  const columns: Column<MaintEntry>[] = [
    { key: 'truck_plaka', header: 'Plaka' },
    { key: 'tarih', header: 'Tarih' },
    { key: 'turu', header: 'Tür', render: r => <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF5F03]/10 text-[#FF5F03]">{turuLabels[r.turu] || r.turu}</span> },
    { key: 'yapilan_islemler', header: 'Yapılan İşlem' },
    { key: 'toplam_tutar', header: 'Tutar', render: r => r.toplam_tutar ? `₺${r.toplam_tutar.toFixed(2)}` : '-' },
    { key: 'servis_adi', header: 'Servis' },
    { key: 'sonraki_bakim_km', header: 'Sonraki Bakım KM', render: r => r.sonraki_bakim_km > 0 ? r.sonraki_bakim_km.toLocaleString('tr') : '-' },
    { key: 'sonraki_bakim_tarih', header: 'Sonraki Bakım Tarihi' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm"><Plus size={18} /> Bakım Ekle</button>
      </div>
      <DataGrid columns={columns} data={data} loading={loading} title="Bakım Kayıtları" emptyIcon={<Wrench size={48} className="text-gray-300" />} emptyText="Henüz bakım kaydı yok"
        onEdit={(row) => { setEditingId(row.id); setForm({ truck_id: row.truck_id, tarih: (row.tarih || '').substring(0,10), km: String(row.km || ''), turu: row.turu || 'PERIYODIK_BAKIM', yapilan_islemler: row.yapilan_islemler || '', toplam_tutar: String(row.toplam_tutar || ''), fatura_no: row.fatura_no || '', servis_adi: row.servis_adi || '', sonraki_bakim_km: String(row.sonraki_bakim_km || ''), sonraki_bakim_tarih: (row.sonraki_bakim_tarih || '').substring(0,10) }); setShowModal(true); }}
        onDelete={row => { api.delete(`/api/tenant/maintenance/${row.id}`).then(() => setData(prev => prev.filter(i => i.id !== row.id))); }} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold">{editingId ? 'Bakım Düzenle' : 'Bakım Ekle'}</h3><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Kamyon</label>
                  <select value={form.truck_id} onChange={e => setForm(f => ({ ...f, truck_id: parseInt(e.target.value) || 0 }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm"><option value={0}>Seçiniz</option>{trucks.map(t => <option key={t.id} value={t.id}>{t.plaka}</option>)}</select>
                </div>
                <div><label className="block text-sm font-medium mb-1.5">Tarih</label><input type="date" value={form.tarih} onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">KM</label><input type="number" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bakım Türü</label>
                  <select value={form.turu} onChange={e => setForm(f => ({ ...f, turu: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm">
                    {Object.entries(turuLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Yapılan İşlemler</label><textarea value={form.yapilan_islemler} onChange={e => setForm(f => ({ ...f, yapilan_islemler: e.target.value }))} rows={2} placeholder="Yağ değişimi, filtre..." className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Toplam Tutar (₺)</label><input type="number" step="0.01" value={form.toplam_tutar} onChange={e => setForm(f => ({ ...f, toplam_tutar: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Servis Adı</label><input type="text" value={form.servis_adi} onChange={e => setForm(f => ({ ...f, servis_adi: e.target.value }))} placeholder="Yetkili servis" className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Sonraki Bakım KM</label><input type="number" value={form.sonraki_bakim_km} onChange={e => setForm(f => ({ ...f, sonraki_bakim_km: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Sonraki Bakım Tarihi</label><input type="date" value={form.sonraki_bakim_tarih} onChange={e => setForm(f => ({ ...f, sonraki_bakim_tarih: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting ? <Loader2 size={16} className="animate-spin inline" /> : 'Kaydet'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
