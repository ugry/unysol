import { useState, useEffect } from 'react';
import { Loader2, FileText, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

const statusConfig: Record<string,{label:string;bg:string;text:string}> = {
  BEKLIYOR: {label:'Bekliyor',bg:'bg-yellow-100',text:'text-yellow-700'},
  ONAYLANDI: {label:'Onaylandı',bg:'bg-green-100',text:'text-green-700'},
  REDDEDILDI: {label:'Reddedildi',bg:'bg-red-100',text:'text-red-700'},
  IPTAL: {label:'İptal',bg:'bg-gray-100',text:'text-gray-600'},
};

export default function ProposalsPage() {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [form, setForm] = useState({musteri_id:0,baslik:'',aciklama:'',tutar:0,teklif_tarihi:'',gecerlilik_tarihi:''});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/api/tenant/proposals/'), api.get('/api/tenant/proposals/summary'), api.get('/api/tenant/customers/')])
      .then(([r,s,c]) => { setData(Array.isArray(r.data?.data)?r.data.data:[]); setSummary(s.data?.data||{}); setCustomers(Array.isArray(c.data?.data)?c.data.data:[]); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (editingId) await api.put(`/api/tenant/proposals/${editingId}`, form);
      else await api.post('/api/tenant/proposals/', form);
      setShowModal(false); setEditingId(null); fetchData();
    } catch (err: any) { setError(err?.response?.data?.error||'Hata'); }
    finally { setSubmitting(false); }
  };

  const handleStatus = async (id: number, durum: string) => {
    await api.put(`/api/tenant/proposals/${id}/status`, {durum});
    fetchData();
  };

  const columns: Column<any>[] = [
    { key:'teklif_no', header:'Teklif No', render: r => <span className="text-sm font-medium">{r.teklif_no}</span>, exportRender: r => r.teklif_no },
    { key:'musteri_adi', header:'Müşteri', render: r => <span className="text-sm">{r.musteri_adi||'—'}</span>, exportRender: r => r.musteri_adi },
    { key:'baslik', header:'Başlık', render: r => <span className="text-sm">{r.baslik}</span>, exportRender: r => r.baslik },
    { key:'tutar', header:'Tutar', align:'right', render: r => <span className="text-sm font-medium">{Number(r.tutar).toLocaleString('tr')} ₺</span>, exportRender: r => String(r.tutar) },
    { key:'durum', header:'Durum', render: r => {
      const c = statusConfig[r.durum]||statusConfig.BEKLIYOR;
      return <select value={r.durum} onChange={e => handleStatus(r.id,e.target.value)} className={`text-xs px-2 py-0.5 rounded border-0 ${c.bg} ${c.text}`}>
        <option value="BEKLIYOR">Bekliyor</option><option value="ONAYLANDI">Onaylandı</option><option value="REDDEDILDI">Reddedildi</option><option value="IPTAL">İptal</option>
      </select>;
    }, exportRender: r => r.durum },
    { key:'teklif_tarihi', header:'Tarih', render: r => <span className="text-xs">{r.teklif_tarihi}</span>, exportRender: r => r.teklif_tarihi },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4"><p className="text-xs text-gray-500">Toplam Teklif</p><p className="text-lg font-bold">₺{Number(summary.total||0).toLocaleString('tr')}</p><p className="text-xs text-gray-400">{summary.count||0} adet</p></div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4"><p className="text-xs text-yellow-600">Bekleyen</p><p className="text-lg font-bold text-yellow-700">₺{Number(summary.bekleyen||0).toLocaleString('tr')}</p></div>
        <div className="bg-white border border-green-200 rounded-lg p-4"><p className="text-xs text-green-600">Onaylanan</p><p className="text-lg font-bold text-green-700">₺{Number(summary.onaylanan||0).toLocaleString('tr')}</p></div>
        <div className="bg-white border border-red-200 rounded-lg p-4"><p className="text-xs text-red-600">Reddedilen</p><p className="text-lg font-bold text-red-700">₺{Number(summary.reddedilen||0).toLocaleString('tr')}</p></div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Teklifler</h2>
        <button onClick={() => { setEditingId(null); setForm({musteri_id:0,baslik:'',aciklama:'',tutar:0,teklif_tarihi:'',gecerlilik_tarihi:''}); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">
          <Plus size={18}/>Yeni Teklif</button>
      </div>

      <DataGrid columns={columns} data={data} loading={loading} title="Teklifler"
        onEdit={r => { setEditingId(r.id); setForm({musteri_id:r.musteri_id||0,baslik:r.baslik,aciklama:'',tutar:r.tutar,teklif_tarihi:r.teklif_tarihi||'',gecerlilik_tarihi:r.gecerlilik_tarihi||''}); setShowModal(true); }}
        onDelete={async r => { await api.delete(`/api/tenant/proposals/${r.id}`); fetchData(); }}
        emptyText="Henüz teklif kaydı yok"/>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">{editingId?'Teklif Düzenle':'Yeni Teklif'}</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Müşteri</label>
                <select value={form.musteri_id} onChange={e=>setForm(f=>({...f,musteri_id:Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg border text-sm">
                  <option value={0}>Seçiniz</option>{customers.map((c:any)=><option key={c.id} value={c.id}>{c.firma_unvani||c.ad_soyad||c.id}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Başlık</label><input required value={form.baslik} onChange={e=>setForm(f=>({...f,baslik:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm"/></div>
              <div><label className="block text-sm font-medium mb-1">Açıklama</label><textarea value={form.aciklama} onChange={e=>setForm(f=>({...f,aciklama:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Tutar (₺)</label><input type="number" value={form.tutar||''} onChange={e=>setForm(f=>({...f,tutar:Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg border text-sm"/></div>
                <div><label className="block text-sm font-medium mb-1">Geçerlilik</label><input type="date" value={form.gecerlilik_tarihi} onChange={e=>setForm(f=>({...f,gecerlilik_tarihi:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm"/></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm">İptal</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting?<Loader2 size={16} className="animate-spin mx-auto"/>:editingId?'Güncelle':'Kaydet'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
