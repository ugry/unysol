import { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

const durumConfig: Record<string,{label:string;bg:string;text:string}> = {
  AKTIF: {label:'Aktif',bg:'bg-green-100',text:'text-green-700'},
  SURESI_DOLDU: {label:'Süresi Doldu',bg:'bg-red-100',text:'text-red-700'},
  FESIH: {label:'Fesih',bg:'bg-gray-100',text:'text-gray-600'},
};
const turLabels: Record<string,string> = {NAKLIYE:'Nakliye',DEPO:'Depo',GENEL:'Genel',DIGER:'Diğer'};

export default function ContractsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [form, setForm] = useState({musteri_id:0,baslik:'',tur:'NAKLIYE',tutar:0,baslangic_tarihi:'',bitis_tarihi:'',aciklama:''});
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchData = () => { setLoading(true); Promise.all([api.get('/api/tenant/contracts/'),api.get('/api/tenant/customers/')]).then(([r,c])=>{setData(Array.isArray(r.data?.data)?r.data.data:[]);setCustomers(Array.isArray(c.data?.data)?c.data.data:[])}).finally(()=>setLoading(false)); };
  useEffect(()=>{fetchData()},[]);

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); try { if(editingId) await api.put(`/api/tenant/contracts/${editingId}`,form); else await api.post('/api/tenant/contracts/',form); setShowModal(false); setEditingId(null); fetchData(); } catch {} finally { setSubmitting(false); } };

  const columns: Column<any>[] = [
    { key:'sozlesme_no', header:'Sözleşme No', render: r => <span className="text-sm font-medium">{r.sozlesme_no||'—'}</span>, exportRender: r=>r.sozlesme_no },
    { key:'musteri_adi', header:'Müşteri', render: r => <span className="text-sm">{r.musteri_adi||'—'}</span>, exportRender: r=>r.musteri_adi },
    { key:'baslik', header:'Başlık', render: r => <span className="text-sm">{r.baslik}</span>, exportRender: r=>r.baslik },
    { key:'tur', header:'Tür', render: r => <span className="text-xs px-2 py-0.5 rounded bg-[#FF5F03]/10 text-[#FF5F03]">{turLabels[r.tur]||r.tur}</span>, exportRender: r=>r.tur },
    { key:'tutar', header:'Tutar', align:'right', render: r => <span className="text-sm font-medium">{Number(r.tutar).toLocaleString('tr')} ₺</span>, exportRender: r=>String(r.tutar) },
    { key:'durum', header:'Durum', render: r => { const c=durumConfig[r.durum]||durumConfig.AKTIF; return <span className={`text-xs px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>; }, exportRender: r=>r.durum },
    { key:'baslangic_tarihi', header:'Başlangıç', render: r => <span className="text-xs">{r.baslangic_tarihi||'—'}</span>, exportRender: r=>r.baslangic_tarihi },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sözleşmeler</h2>
        <button onClick={()=>{setEditingId(null);setForm({musteri_id:0,baslik:'',tur:'NAKLIYE',tutar:0,baslangic_tarihi:'',bitis_tarihi:'',aciklama:''});setShowModal(true)}} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm"><Plus size={18}/>Yeni Sözleşme</button>
      </div>
      <DataGrid columns={columns} data={data} loading={loading} title="Sözleşmeler" onEdit={r=>{setEditingId(r.id);setForm({musteri_id:r.musteri_id||0,baslik:r.baslik||'',tur:r.tur||'NAKLIYE',tutar:r.tutar||0,baslangic_tarihi:r.baslangic_tarihi||'',bitis_tarihi:r.bitis_tarihi||'',aciklama:''});setShowModal(true)}} onDelete={async r=>{await api.delete(`/api/tenant/contracts/${r.id}`);fetchData()}} emptyText="Henüz sözleşme kaydı yok"/>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"><form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl"><h3 className="text-lg font-semibold mb-4">{editingId?'Sözleşme Düzenle':'Yeni Sözleşme'}</h3>
          <div className="space-y-3">
            <div><label className="block text-sm font-medium mb-1">Müşteri</label><select value={form.musteri_id} onChange={e=>setForm(f=>({...f,musteri_id:Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg border text-sm"><option value={0}>Seçiniz</option>{customers.map((c:any)=><option key={c.id} value={c.id}>{c.firma_unvani||c.ad_soyad||c.id}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Başlık</label><input required value={form.baslik} onChange={e=>setForm(f=>({...f,baslik:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium mb-1">Tür</label><select value={form.tur} onChange={e=>setForm(f=>({...f,tur:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm">{Object.entries(turLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Tutar (₺)</label><input type="number" value={form.tutar||''} onChange={e=>setForm(f=>({...f,tutar:Number(e.target.value)}))} className="w-full px-3 py-2 rounded-lg border text-sm"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium mb-1">Başlangıç</label><input type="date" value={form.baslangic_tarihi} onChange={e=>setForm(f=>({...f,baslangic_tarihi:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm"/></div><div><label className="block text-sm font-medium mb-1">Bitiş</label><input type="date" value={form.bitis_tarihi} onChange={e=>setForm(f=>({...f,bitis_tarihi:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm"/></div></div>
            <div><label className="block text-sm font-medium mb-1">Açıklama</label><textarea value={form.aciklama} onChange={e=>setForm(f=>({...f,aciklama:e.target.value}))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2}/></div>
          </div>
          <div className="flex gap-3 mt-5"><button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm">İptal</button><button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting?<Loader2 size={16} className="animate-spin mx-auto"/>:editingId?'Güncelle':'Kaydet'}</button></div>
        </form></div>
      )}
    </div>
  );
}
