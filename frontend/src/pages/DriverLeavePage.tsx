import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import { Plus, X, Loader2, Calendar } from 'lucide-react';

interface Leave { id: number; user_id: number; ad_soyad: string; baslangic: string; bitis: string; turu: string; onay_durumu: string; aciklama: string }
interface Employee { id: number; ad_soyad: string }
const turuLabels: Record<string, string> = { YILLIK_IZIN: 'Yıllık İzin', HASTA: 'Hasta', UCRETSIZ: 'Ücretsiz', DIGER: 'Diğer' };
const durumLabels: Record<string, string> = { BEKLIYOR: 'Bekliyor', ONAYLANDI: 'Onaylandı', RED: 'Red' };

export default function DriverLeavePage() {
  const [data, setData] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ user_id: 0, baslangic: '', bitis: '', turu: 'YILLIK_IZIN', aciklama: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchData = () => {
    api.get('/api/tenant/driver-leave').then(r => setData(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
    api.get('/api/tenant/employees').then(r => setEmployees(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.user_id || !form.baslangic || !form.bitis) { setFormError('Personel, başlangıç ve bitiş tarihi zorunludur'); return; }
    setSubmitting(true);
    try { if (editingId) await api.put(`/api/tenant/driver-leave/${editingId}`, form); else await api.post('/api/tenant/driver-leave', form); setShowModal(false); setEditingId(null); setForm({ user_id: 0, baslangic: '', bitis: '', turu: 'YILLIK_IZIN', aciklama: '' }); fetchData(); }
    catch (err: any) { setFormError(err?.response?.data?.error || 'Kayıt oluşturulamadı'); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (id: number, durum: string) => {
    await api.put(`/api/tenant/driver-leave/${id}`, { onay_durumu: durum });
    setData(prev => prev.map(i => i.id === id ? { ...i, onay_durumu: durum } : i));
  };

  const columns: Column<Leave>[] = [
    { key: 'ad_soyad', header: 'Personel' },
    { key: 'baslangic', header: 'Başlangıç', render: r => (r.baslangic || '').substring(0, 10) },
    { key: 'bitis', header: 'Bitiş', render: r => (r.bitis || '').substring(0, 10) },
    { key: 'turu', header: 'Tür', render: r => <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF5F03]/10 text-[#FF5F03]">{turuLabels[r.turu] || r.turu}</span> },
    { key: 'onay_durumu', header: 'Durum', render: r => (
      <div className="flex items-center gap-2">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.onay_durumu === 'ONAYLANDI' ? 'bg-emerald-500/15 text-emerald-400' : r.onay_durumu === 'RED' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>{durumLabels[r.onay_durumu] || r.onay_durumu}</span>
        {r.onay_durumu === 'BEKLIYOR' && (
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); handleApprove(r.id, 'ONAYLANDI'); }} className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">Onayla</button>
            <button onClick={(e) => { e.stopPropagation(); handleApprove(r.id, 'RED'); }} className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Reddet</button>
          </div>
        )}
      </div>
    )},
    { key: 'aciklama', header: 'Açıklama' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between"><div /><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm"><Plus size={18} /> İzin Ekle</button></div>
      <DataGrid columns={columns} data={data} loading={loading} title="İzin Takvimi" emptyIcon={<Calendar size={48} className="text-gray-300" />} emptyText="Henüz izin kaydı yok"
        onEdit={(row) => { setEditingId(row.id); setForm({ user_id: row.user_id, baslangic: (row.baslangic || '').substring(0,10), bitis: (row.bitis || '').substring(0,10), turu: row.turu, aciklama: row.aciklama || '' }); setShowModal(true); }}
        onDelete={row => { api.delete(`/api/tenant/driver-leave/${row.id}`).then(() => setData(prev => prev.filter(i => i.id !== row.id))); }} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold">{editingId ? 'İzin Düzenle' : 'İzin Ekle'}</h3><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Personel</label><select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: parseInt(e.target.value) || 0 }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm"><option value={0}>Seçiniz</option>{employees.map(e => <option key={e.id} value={e.id}>{e.ad_soyad}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Başlangıç</label><input type="date" value={form.baslangic} onChange={e => setForm(f => ({ ...f, baslangic: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Bitiş</label><input type="date" value={form.bitis} onChange={e => setForm(f => ({ ...f, bitis: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Tür</label><select value={form.turu} onChange={e => setForm(f => ({ ...f, turu: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm">{Object.entries(turuLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-1.5">Açıklama</label><input type="text" value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting ? <Loader2 size={16} className="animate-spin inline" /> : 'Kaydet'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
