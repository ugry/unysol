import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

export default function PayslipsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employee_id: 0, donem: new Date().toISOString().slice(0, 7), brut_maas: 0, sgk_kesinti: 0, vergi_kesinti: 0, diger_kesinti: 0, aciklama: '' });
  const [sub, setSub] = useState(false);
  const [emps, setEmps] = useState<any[]>([]);

  const fetch = () => {
    setLoading(true);
    Promise.all([api.get('/api/tenant/payslips/'), api.get('/api/tenant/employees/')])
      .then(([r, e]) => { setData(Array.isArray(r.data?.data) ? r.data.data : []); setEmps(Array.isArray(e.data?.data) ? e.data.data : []); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const cols: Column<any>[] = [
    { key: 'employee_name', header: 'Personel', render: r => <span className="text-sm">{r.employee_name || '—'}</span>, exportRender: r => r.employee_name },
    { key: 'donem', header: 'Dönem', render: r => <span className="text-sm font-medium">{r.donem}</span>, exportRender: r => r.donem },
    { key: 'brut_maas', header: 'Brüt', align: 'right' as const, render: r => <span className="text-sm">{Number(r.brut_maas).toLocaleString('tr')} ₺</span>, exportRender: r => String(r.brut_maas) },
    { key: 'sgk_kesinti', header: 'SGK', align: 'right' as const, render: r => <span className="text-xs text-red-600">-{Number(r.sgk_kesinti).toLocaleString('tr')} ₺</span>, exportRender: r => String(r.sgk_kesinti) },
    { key: 'vergi_kesinti', header: 'Vergi', align: 'right' as const, render: r => <span className="text-xs text-red-600">-{Number(r.vergi_kesinti).toLocaleString('tr')} ₺</span>, exportRender: r => String(r.vergi_kesinti) },
    { key: 'net_maas', header: 'Net', align: 'right' as const, render: r => <span className="text-sm font-bold text-green-600">{Number(r.net_maas).toLocaleString('tr')} ₺</span>, exportRender: r => String(r.net_maas) },
  ];

  const net = form.brut_maas - form.sgk_kesinti - form.vergi_kesinti - form.diger_kesinti;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bordro</h2>
        <button onClick={() => { setForm({ employee_id: 0, donem: new Date().toISOString().slice(0, 7), brut_maas: 0, sgk_kesinti: 0, vergi_kesinti: 0, diger_kesinti: 0, aciklama: '' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm"><Plus size={18} />Yeni Bordro</button>
      </div>
      <DataGrid columns={cols} data={data} loading={loading} title="Bordro"
        onDelete={async r => { await api.delete(`/api/tenant/payslips/${r.id}`); fetch(); }} emptyText="Henüz bordro kaydı yok" />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form onSubmit={async e => { e.preventDefault(); setSub(true); try { await api.post('/api/tenant/payslips/', form); setShowModal(false); fetch(); } catch { } finally { setSub(false); } }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Yeni Bordro</h3>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Personel</label><select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm"><option value={0}>Seçiniz</option>{emps.map((e: any) => <option key={e.id} value={e.id}>{e.ad_soyad}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Dönem</label><input type="month" value={form.donem} onChange={e => setForm(f => ({ ...f, donem: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Brüt Maaş</label><input type="number" value={form.brut_maas || ''} onChange={e => setForm(f => ({ ...f, brut_maas: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-medium mb-1">SGK</label><input type="number" value={form.sgk_kesinti || ''} onChange={e => setForm(f => ({ ...f, sgk_kesinti: Number(e.target.value) }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">Vergi</label><input type="number" value={form.vergi_kesinti || ''} onChange={e => setForm(f => ({ ...f, vergi_kesinti: Number(e.target.value) }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></div>
                <div><label className="block text-xs font-medium mb-1">Diğer</label><input type="number" value={form.diger_kesinti || ''} onChange={e => setForm(f => ({ ...f, diger_kesinti: Number(e.target.value) }))} className="w-full px-2 py-1.5 rounded-lg border text-sm" /></div>
              </div>
              {form.brut_maas > 0 && <div className="bg-gray-50 rounded-lg p-3 text-center"><span className="text-sm text-gray-500">Net Maaş: </span><span className="text-lg font-bold text-green-600">₺{net.toLocaleString('tr')}</span></div>}
              <div><label className="block text-sm font-medium mb-1">Açıklama</label><input value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5"><button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm">İptal</button><button type="submit" disabled={sub} className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">Kaydet</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
