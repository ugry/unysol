import { useState, useEffect, FormEvent } from 'react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import { Plus, X, Loader2, Truck } from 'lucide-react';

interface Trailer { id: number; plaka: string; marka: string; model: string; yil: number; tip: string; muayene_bitis: string; aktif: boolean }
const tipLabels: Record<string, string> = { TENTELI_PERDELI: 'Tenteli/Perdeli', FRIGO: 'Frigo', SAL: 'Sal', LOWBED: 'Lowbed', TANKER: 'Tanker' };

export default function TrailersPage() {
  const [data, setData] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ plaka: '', marka: '', model: '', yil: '', tip: 'TENTELI_PERDELI' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => api.get('/api/tenant/trailers').then(r => setData(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.plaka) { setFormError('Plaka zorunludur'); return; }
    setSubmitting(true);
    try { 
      if (editingId) await api.put(`/api/tenant/trailers/${editingId}`, { ...form, yil: parseInt(form.yil) || 0 });
      else await api.post('/api/tenant/trailers', { ...form, yil: parseInt(form.yil) || 0 });
      setShowModal(false); setEditingId(null); setForm({ plaka: '', marka: '', model: '', yil: '', tip: 'TENTELI_PERDELI' }); fetchData(); }
    catch (err: any) { setFormError(err?.response?.data?.error || 'Kayıt oluşturulamadı'); }
    finally { setSubmitting(false); }
  };

  const columns: Column<Trailer>[] = [
    { key: 'plaka', header: 'Plaka' },
    { key: 'marka', header: 'Marka' },
    { key: 'model', header: 'Model' },
    { key: 'yil', header: 'Yıl' },
    { key: 'tip', header: 'Tip', render: r => <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF5F03]/10 text-[#FF5F03]">{tipLabels[r.tip] || r.tip}</span> },
    { key: 'muayene_bitis', header: 'Muayene Bitiş' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between"><div /><button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm"><Plus size={18} /> Dorse Ekle</button></div>
      <DataGrid columns={columns} data={data} loading={loading} title="Dorse Yönetimi" emptyIcon={<Truck size={48} className="text-gray-300" />} emptyText="Henüz dorse kaydı yok"
        onEdit={(row) => { setEditingId(row.id); setForm({ plaka: row.plaka, marka: row.marka || '', model: row.model || '', yil: String(row.yil || ''), tip: row.tip }); setShowModal(true); }}
        onDelete={(row) => { api.delete(`/api/tenant/trailers/${row.id}`).then(() => setData(prev => prev.filter(i => i.id !== row.id))); }} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold">{editingId ? 'Dorse Düzenle' : 'Dorse Ekle'}</h3><button onClick={() => setShowModal(false)}><X size={20} /></button></div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-sm">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Plaka</label><input type="text" value={form.plaka} onChange={e => setForm(f => ({ ...f, plaka: e.target.value }))} required className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Marka</label><input type="text" value={form.marka} onChange={e => setForm(f => ({ ...f, marka: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Model</label><input type="text" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Yıl</label><input type="number" value={form.yil} onChange={e => setForm(f => ({ ...f, yil: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Tip</label><select value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-gray-50 border text-sm">{Object.entries(tipLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting ? <Loader2 size={16} className="animate-spin inline" /> : 'Kaydet'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
