import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Truck, UserCheck, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/lib/api';

const COLORS = ['#FF5F03','#3b82f6','#16A34A','#a855f7','#DC2626','#eab308','#06b6d4','#ec4899','#78716c','#f97316'];

const monthNames: Record<string,string> = {'01':'Oca','02':'Şub','03':'Mar','04':'Nis','05':'May','06':'Haz','07':'Tem','08':'Ağu','09':'Eyl','10':'Eki','11':'Kas','12':'Ara'};
function formatMonth(m: string) { if (m.length===7) return `${monthNames[m.substring(5,7)]||''} '${m.substring(2,4)}`; return m; }

const now = new Date();
const defaultStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
const defaultEnd = now.toISOString().split('T')[0];

export default function ReportsPage() {
  const [tab, setTab] = useState<'revenue'|'truck'|'driver'|'categories'>('revenue');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [summary, setSummary] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [truckData, setTruckData] = useState<any[]>([]);
  const [driverData, setDriverData] = useState<any[]>([]);
  const [catData, setCatData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/tenant/reports/summary?start=${start}&end=${end}`),
      api.get(`/api/tenant/reports/revenue-expenses?start=${start}&end=${end}`),
      api.get(`/api/tenant/reports/profit-per-truck?start=${start}&end=${end}`),
      api.get(`/api/tenant/reports/profit-per-driver?start=${start}&end=${end}`),
      api.get(`/api/tenant/reports/category-breakdown?start=${start}&end=${end}`),
    ]).then(([s, r, tr, dr, cr]) => {
      setSummary(s.data?.data || {});
      setRevenueData(r.data?.data || []);
      setTruckData(tr.data?.data || []);
      setDriverData(dr.data?.data || []);
      setCatData(cr.data?.data || []);
    }).finally(() => setLoading(false));
  }, [start, end]);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map((r: any) => keys.map(k => `"${r[k]||''}"`).join(','))].join('\n');
    const b = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=filename; a.click();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#FF5F03]" size={36}/></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4">
        <span className="text-sm text-[#8a8f98]">Dönem:</span>
        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="px-3 py-1.5 rounded bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-[#d0d6e0]" />
        <span className="text-[#8a8f98]">—</span>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="px-3 py-1.5 rounded bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-[#d0d6e0]" />
        <div className="flex-1"/>
        <button onClick={() => exportCSV(tab==='revenue'?revenueData:tab==='truck'?truckData:tab==='driver'?driverData:catData,'unysol-rapor.csv')} className="px-3 py-1.5 rounded bg-[#16A34A] hover:bg-[#15803D] text-white text-sm">CSV İndir</button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4"><p className="text-xs text-[#8a8f98]">Toplam Gelir</p><p className="text-lg font-bold text-[#16A34A]">₺{Number(summary.total_revenue||0).toLocaleString('tr')}</p></div>
          <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4"><p className="text-xs text-[#8a8f98]">Toplam Gider</p><p className="text-lg font-bold text-[#DC2626]">₺{Number(summary.total_expenses||0).toLocaleString('tr')}</p></div>
          <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4"><p className="text-xs text-[#8a8f98]">Net Kâr</p><p className="text-lg font-bold text-[#FF5F03]">₺{Number(summary.total_profit||0).toLocaleString('tr')}</p></div>
          <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-4"><p className="text-xs text-[#8a8f98]">Sefer / Araç</p><p className="text-lg font-bold text-[#f7f8f8]">{summary.total_trips||0} / {summary.active_trucks||0}</p></div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{k:'revenue',l:'Gelir/Gider'},{k:'truck',l:'Araç Kâr'},{k:'driver',l:'Şoför'},{k:'categories',l:'Kategoriler'}].map(tb => (
          <button key={tb.k} onClick={() => setTab(tb.k as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===tb.k ? 'bg-[#FF5F03] text-white' : 'text-[#8a8f98] hover:text-[#f7f8f8] bg-[rgba(255,255,255,0.04)]'}`}>{tb.l}</button>
        ))}
      </div>

      {/* Revenue Chart */}
      {tab === 'revenue' && (
        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Aylık Gelir / Gider</h3>
          <div className="h-72">
            <ResponsiveContainer><BarChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/><XAxis dataKey="month" tickFormatter={formatMonth} stroke="#888" fontSize={12}/><YAxis stroke="#888" fontSize={12} tickFormatter={v=>`₺${(Number(v)/1000).toFixed(0)}K`}/><Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:8,color:'#fafafa'}} formatter={(v:any)=>[`₺${Number(v).toLocaleString('tr')}`,undefined]}/><Legend/><Bar dataKey="revenue" name="Gelir" fill="#16A34A" radius={[4,4,0,0]}/><Bar dataKey="expenses" name="Gider" fill="#DC2626" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Truck Profit */}
      {tab === 'truck' && truckData.length > 0 && (
        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Araç Bazlı Kâr Analizi</h3>
          <div className="h-72">
            <ResponsiveContainer><BarChart data={truckData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a"/><XAxis type="number" stroke="#888" fontSize={12} tickFormatter={v=>`₺${(Number(v)/1000).toFixed(0)}K`}/><YAxis dataKey="plaka" type="category" stroke="#888" fontSize={12} width={80}/><Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:8,color:'#fafafa'}} formatter={(v:any)=>[`₺${Number(v).toLocaleString('tr')}`,undefined]}/><Bar dataKey="profit" name="Kâr" fill="#FF5F03" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Driver */}
      {tab === 'driver' && driverData.length > 0 && (
        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Şoför Performansı</h3>
          <div className="h-72">
            <ResponsiveContainer><BarChart data={driverData}><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/><XAxis dataKey="name" stroke="#888" fontSize={12} angle={-20} textAnchor="end" height={60}/><YAxis stroke="#888" fontSize={12} tickFormatter={v=>`₺${(Number(v)/1000).toFixed(0)}K`}/><Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:8,color:'#fafafa'}} formatter={(v:any)=>[`₺${Number(v).toLocaleString('tr')}`,undefined]}/><Bar dataKey="total_revenue" name="Toplam Gelir" fill="#3b82f6" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Pie */}
      {tab === 'categories' && catData.length > 0 && (
        <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#f7f8f8] mb-4">Gider Kategorileri</h3>
          <div className="h-72">
            <ResponsiveContainer><PieChart><Pie data={catData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({category,total}:any)=>`${category}: ₺${Number(total).toLocaleString('tr')}`}><Legend/>{catData.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie></PieChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Empty state */}
      {tab === 'truck' && truckData.length === 0 && <p className="text-sm text-[#8a8f98] text-center py-10">Bu dönemde araç verisi bulunamadı.</p>}
      {tab === 'driver' && driverData.length === 0 && <p className="text-sm text-[#8a8f98] text-center py-10">Bu dönemde şoför verisi bulunamadı.</p>}
    </div>
  );
}
