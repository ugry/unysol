import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  KULLANIMDA: { label: 'Kullanımda', bg: 'bg-green-100', text: 'text-green-700' },
  DEPODA: { label: 'Depoda', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  HURDA: { label: 'Hurda', bg: 'bg-red-100', text: 'text-red-700' },
};

export default function TiresPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ truck_id: 0, lastik_no: '', pozisyon: 'SOL_ON', marka: '', model: '', takilma_km: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);

  const fetch = () => {
    setLoading(true);
    Promise.all([api.get('/api/tenant/tires/'), api.get('/api/tenant/trucks/')])
      .then(([r, t]) => {
        setData(Array.isArray(r.data?.data) ? r.data.data : []);
        setTrucks(Array.isArray(t.data?.data) ? t.data.data : []);
      }).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const columns: Column<any>[] = [
    { key: 'plaka', header: 'Araç', render: r => <span className="text-sm">{r.plaka || '—'}</span>, exportRender: r => r.plaka },
    { key: 'lastik_no', header: 'Lastik No', render: r => <span className="text-sm font-medium">{r.lastik_no || '—'}</span>, exportRender: r => r.lastik_no },
    { key: 'pozisyon', header: 'Pozisyon', render: r => <span className="text-xs px-2 py-0.5 rounded bg-[#FF5F03]/10 text-[#FF5F03]">{r.pozisyon}</span>, exportRender: r => r.pozisyon },
    { key: 'marka', header: 'Marka', exportRender: r => r.marka },
    { key: 'takilma_tarihi', header: 'Takılma', render: r => <span className="text-xs">{r.takilma_tarihi || '—'}</span> },
    { key: 'takilma_km', header: 'KM', align: 'right' as const, render: r => <span className="text-sm">{(r.takilma_km || 0).toLocaleString('tr')}</span> },
    {
      key: 'son_durum', header: 'Durum', render: r => {
        const s: string = r.son_durum || 'KULLANIMDA';
        const c = statusMap[s] || { label: s, bg: 'bg-gray-100', text: 'text-gray-600' };
        return <span className={`text-xs px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>;
      }
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); try { await api.post('/api/tenant/tires/', form); setShowModal(false); fetch(); } catch { } finally { setSubmitting(false); } };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lastikler</h2>
        <button onClick={() => { setForm({ truck_id: 0, lastik_no: '', pozisyon: 'SOL_ON', marka: '', model: '', takilma_km: 0 }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm"><Plus size={18} />Yeni Lastik</button>
      </div>
      <DataGrid columns={columns} data={data} loading={loading} title="Lastikler"
        onDelete={async r => { await api.delete(`/api/tenant/tires/${r.id}`); fetch(); }} emptyText="Henüz lastik kaydı yok" />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Yeni Lastik</h3>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Araç</label><select value={form.truck_id} onChange={e => setForm(f => ({ ...f, truck_id: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm"><option value={0}>Seçiniz</option>{trucks.map((t: any) => <option key={t.id} value={t.id}>{t.plaka} {t.marka}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Lastik No</label><input value={form.lastik_no} onChange={e => setForm(f => ({ ...f, lastik_no: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Pozisyon</label><select value={form.pozisyon} onChange={e => setForm(f => ({ ...f, pozisyon: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm"><option>SOL_ON</option><option>SAG_ON</option><option>SOL_ARKA</option><option>SAG_ARKA</option><option>YEDEK</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1">Marka</label><input value={form.marka} onChange={e => setForm(f => ({ ...f, marka: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" /></div><div><label className="block text-sm font-medium mb-1">Model</label><input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" /></div></div>
              <div><label className="block text-sm font-medium mb-1">Takılma KM</label><input type="number" value={form.takilma_km || ''} onChange={e => setForm(f => ({ ...f, takilma_km: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm">İptal</button><button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">Kaydet</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
