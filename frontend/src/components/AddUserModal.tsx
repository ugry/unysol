import { useState } from 'react';
import api from '@/lib/api';
import { X, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddUserModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({ ad_soyad: '', email: '', password: '', rol: 'DRIVER', telefon: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.ad_soyad || !form.email || !form.password) { setError('Ad soyad, e-posta ve şifre zorunludur'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/tenant/user-management', form);
      onCreated();
      onClose();
    } catch (err: any) { setError(err?.response?.data?.error || 'Kullanıcı oluşturulamadı'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[#f7f8f8]">Kullanıcı Ekle</h3>
          <button onClick={onClose}><X size={20} className="text-[#8a8f98]" /></button>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Ad Soyad</label><input type="text" value={form.ad_soyad} onChange={e => setForm({...form, ad_soyad: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" /></div>
          <div><label className="block text-sm font-medium text-[#8a8f98] mb-1.5">E-posta</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" /></div>
          <div><label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Şifre</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" /></div>
          <div><label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Rol</label><select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] cursor-pointer"><option value="DRIVER">Şoför</option><option value="OFFICE">Ofis</option><option value="ACCOUNTANT">Muhasebeci</option></select></div>
          <div><label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Telefon</label><input type="text" value={form.telefon} onChange={e => setForm({...form, telefon: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" /></div>
          <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{submitting ? <Loader2 size={16} className="animate-spin inline" /> : 'Kullanıcı Ekle'}</button>
        </form>
      </div>
    </div>
  );
}
