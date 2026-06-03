import { useState, useEffect } from 'react';
import { CreditCard, Receipt, ArrowUpRight, CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function BillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/api/tenant/billing/plans'),
      api.get('/api/tenant/billing/invoices'),
    ]).then(([p, i]) => {
      setPlans(Array.isArray(p.data) ? p.data : []);
      setInvoices(Array.isArray(i.data) ? i.data : []);
    }).catch(() => setMsg({ text: 'Fatura bilgileri yüklenemedi', type: 'error' }))
    .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (plan: string) => {
    setUpgrading(true); setMsg({ text: '', type: '' });
    try {
      const res = await api.post('/api/tenant/stripe/checkout', { plan });
      if (res.data?.url) window.location.href = res.data.url;
      else setMsg({ text: 'Ödeme sayfası açılamadı. Lütfen info@unysolar.com adresine yazın.', type: 'error' });
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || '';
      setMsg({ text: errMsg === 'Stripe yapılandırılmamış' ? 'Ödeme sistemi henüz aktif değil.' : 'Bağlantı hatası.', type: 'error' });
    } finally { setUpgrading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz?')) return;
    try {
      await api.post('/api/tenant/billing/cancel');
      setMsg({ text: 'Abonelik iptal edildi. Mevcut dönem sonuna kadar PRO özellikleri kullanılabilir.', type: 'success' });
    } catch { setMsg({ text: 'İptal başarısız. Lütfen info@unysolar.com adresine yazın.', type: 'error' }); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-[#FF5F03]" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {msg.text && (
        <div className={`p-4 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {msg.type === 'error' ? <AlertCircle size={18} className="inline mr-2" /> : <CheckCircle size={18} className="inline mr-2" />}
          {msg.text}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Plan Seçimi</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white border ${plan.name === 'PRO' ? 'border-[#FF5F03] ring-1 ring-[#FF5F03]' : 'border-[rgba(255,255,255,0.08)]'} rounded-xl p-6`}>
              {plan.name === 'PRO' && <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF5F03]/10 text-[#FF5F03] mb-3">Popüler</span>}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2">{plan.price > 0 ? `₺${plan.price}${plan.name === 'PRO' ? '/ay' : ''}` : 'Ücretsiz'}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#8a8f98]">
                {plan.features?.map((f: string) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> {f.replace(/_/g, ' ')}</li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.name === 'FREE' ? (
                  <span className="block text-center py-2.5 rounded-lg bg-[#08090a] border border-[rgba(255,255,255,0.08)] text-[#8a8f98] text-sm font-medium">Mevcut Plan</span>
                ) : (
                  <button onClick={() => handleCheckout(plan.name)} disabled={upgrading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60">
                    {upgrading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
                    {plan.name === 'PRO' ? "PRO'ya Yükselt" : 'Premium\'a Geç'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Fatura Geçmişi</h2>
        {invoices.length === 0 ? (
          <div className="text-center py-10 bg-white border border-[rgba(255,255,255,0.08)] rounded-xl">
            <Receipt size={40} className="text-[#8a8f98] mx-auto mb-3" />
            <p className="text-[#8a8f98]">Henüz fatura kaydı bulunmuyor</p>
          </div>
        ) : (
          <div className="bg-white border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[rgba(255,255,255,0.05)] text-[#8a8f98]"><th className="text-left p-3 font-medium">Fatura No</th><th className="text-left p-3 font-medium">Tarih</th><th className="text-right p-3 font-medium">Tutar</th><th className="text-right p-3 font-medium">Durum</th></tr></thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="p-3">{inv.fatura_no || `#${inv.id}`}</td>
                    <td className="p-3 text-[#8a8f98]">{inv.tarih?.substring(0, 10)}</td>
                    <td className="p-3 text-right">₺{(inv.genel_toplam || inv.tutar || 0).toLocaleString('tr')}</td>
                    <td className="p-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${inv.durum === 'odendi' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {inv.durum === 'odendi' ? 'Ödendi' : inv.durum || 'Bekliyor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-[rgba(255,255,255,0.08)] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <XCircle size={20} className="text-[#DC2626]" />
          <div>
            <h3 className="font-medium">Aboneliği İptal Et</h3>
            <p className="text-sm text-[#8a8f98] mt-1">Mevcut dönem sonuna kadar PRO özellikleri kullanmaya devam edersiniz.</p>
          </div>
          <button onClick={handleCancel} className="ml-auto px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50">
            İptal Et
          </button>
        </div>
      </div>
    </div>
  );
}
