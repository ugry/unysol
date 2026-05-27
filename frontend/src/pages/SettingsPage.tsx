import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  Building2, Users as UsersIcon, Bell, Package, Crown, Save, Plus, Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const [companyForm, setCompanyForm] = useState({
    firma_unvani: user?.firma_unvani || '',
    vergi_dairesi: '',
    vergi_no: '',
    adres: '',
    telefon: '',
    email: user?.email || '',
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<{ id: string; ad_soyad: string; email: string; rol: string }[]>([]);
  const [planInfo, setPlanInfo] = useState({ plan: 'FREE', truckCount: 0, truckLimit: 5, userCount: 0, userLimit: 5 });
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    // Fetch employees
    api.get('/api/tenant/employees').then(r => {
      if (Array.isArray(r.data)) setUsers(r.data.map((e: any) => ({
        id: String(e.id), ad_soyad: e.ad_soyad || '', email: e.email || '', rol: e.rol || ''
      })));
    }).catch(() => {});

    // Fetch dashboard summary for plan + counts
    api.get('/api/tenant/dashboard/summary').then(r => {
      const d = r.data;
      setPlanInfo(prev => ({
        ...prev, truckCount: d?.aktif_kamyon || 0
      }));
    }).catch(() => {});

    // Fetch settings for company form
    api.get('/api/tenant/settings').then(r => {
      const s = r.data?.settings;
      if (s && Array.isArray(s)) {
        const map: Record<string, string> = {};
        s.forEach((kv: any) => { map[kv.key || kv.anahtar] = kv.value || kv.deger; });
        setCompanyForm(prev => ({
          ...prev,
          vergi_dairesi: map['vergi_dairesi'] || '',
          vergi_no: map['vergi_no'] || '',
          adres: map['adres'] || '',
          telefon: map['telefon'] || '',
        }));
      }
    }).catch(() => {});
  }, []);

  // Fetch plan info from admin endpoint
  useEffect(() => {
    api.get('/api/tenant/employees').then(r => {
      if (Array.isArray(r.data)) setPlanInfo(prev => ({ ...prev, userCount: r.data.length }));
    }).catch(() => {});
  }, [users.length]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/tenant/settings', {
        vergi_dairesi: companyForm.vergi_dairesi,
        vergi_no: companyForm.vergi_no,
        adres: companyForm.adres,
        telefon: companyForm.telefon,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await api.post('/api/tenant/stripe/checkout', { plan: 'PRO' });
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch {
      // Stripe not configured — scroll to contact
      alert('PRO plana yükseltmek için info@unysolar.com adresine yazabilirsiniz.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Firma Bilgileri */}
      <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-[#FF5F03]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f7f8f8]">Firma Bilgileri</h3>
            <p className="text-xs text-[#8a8f98] mt-0.5">Fatura ve resmi işlemlerde kullanılacak bilgiler</p>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Firma Ünvanı</label>
              <input type="text" value={companyForm.firma_unvani}
                onChange={(e) => setCompanyForm({ ...companyForm, firma_unvani: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">E-posta</label>
              <input type="email" value={companyForm.email} disabled
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#8a8f98] text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Vergi Dairesi</label>
              <input type="text" value={companyForm.vergi_dairesi}
                onChange={(e) => setCompanyForm({ ...companyForm, vergi_dairesi: e.target.value })}
                placeholder="Vergi dairesi adı" className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#666] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Vergi No</label>
              <input type="text" value={companyForm.vergi_no}
                onChange={(e) => setCompanyForm({ ...companyForm, vergi_no: e.target.value })}
                placeholder="Vergi numarası" className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#666] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Telefon</label>
              <input type="text" value={companyForm.telefon}
                onChange={(e) => setCompanyForm({ ...companyForm, telefon: e.target.value })}
                placeholder="Telefon numarası" className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#666] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Adres</label>
            <input type="text" value={companyForm.adres}
              onChange={(e) => setCompanyForm({ ...companyForm, adres: e.target.value })}
              placeholder="Firma adresi" className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] placeholder-[#666] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 disabled:opacity-60">
              <Save size={16} />
              {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {/* Kullanıcı Yönetimi */}
      <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center flex-shrink-0">
            <UsersIcon size={20} className="text-[#FF5F03]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f7f8f8]">Kullanıcı Yönetimi</h3>
            <p className="text-xs text-[#8a8f98] mt-0.5">Sisteme erişimi olan kullanıcılar</p>
          </div>
        </div>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-[#191a1b] rounded-lg px-4 py-3 border border-[rgba(255,255,255,0.08)]">
              <div>
                <span className="text-sm font-medium text-[#f7f8f8]">{u.ad_soyad}</span>
                <span className="text-xs text-[#8a8f98] block">{u.email} · {u.rol}</span>
              </div>
              <button className="text-[#8a8f98] hover:text-[#DC2626] transition-colors p-1.5 rounded-md hover:bg-[#DC2626]/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-[#8a8f98] text-center py-4">Henüz kullanıcı eklenmemiş</p>}
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#f7f8f8] hover:border-gray-400 text-sm font-medium transition-all">
            <Plus size={16} /> Kullanıcı Ekle
          </button>
        </div>
      </div>

      {/* Bildirim Tercihleri */}
      <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center flex-shrink-0">
            <Bell size={20} className="text-[#FF5F03]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f7f8f8]">Bildirim Tercihleri</h3>
            <p className="text-xs text-[#8a8f98] mt-0.5">Hangi durumlarda bildirim almak istediğinizi seçin (yakında aktif)</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Sefer başladığında' },
            { label: 'Sefer tamamlandığında' },
            { label: 'Fatura vadesi yaklaştığında' },
            { label: 'Bakım hatırlatması' },
            { label: 'Haftalık özet raporu' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between bg-[#191a1b] rounded-lg px-4 py-3 border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-[#8a8f98]" />
                <span className="text-sm text-[#8a8f98]">{item.label}</span>
              </div>
              <span className="text-xs text-[#62666d] bg-[#8a8f98]/10 px-2 py-0.5 rounded">Yakında</span>
            </div>
          ))}
        </div>
      </div>

      {/* Paket Bilgisi */}
      <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-[#FF5F03]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f7f8f8]">Paket Bilgisi</h3>
            <p className="text-xs text-[#8a8f98] mt-0.5">Mevcut paketiniz ve kullanım detayları</p>
          </div>
        </div>
        <div className="bg-[#191a1b] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-[#f7f8f8]">{planInfo.plan === 'FREE' ? 'Ücretsiz Plan' : planInfo.plan + ' Plan'}</span>
                <span className="text-xs bg-[#888888]/15 text-[#8a8f98] px-2 py-0.5 rounded-full">Mevcut</span>
              </div>
              <p className="text-xs text-[#8a8f98]">{planInfo.truckLimit} kamyon, {planInfo.userLimit} kullanıcı</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-[#8a8f98]">
                <span>Kamyon: <span className="text-[#f7f8f8]">{planInfo.truckCount}/{planInfo.truckLimit}</span></span>
                <span>Kullanıcı: <span className="text-[#f7f8f8]">{users.length}/{planInfo.userLimit}</span></span>
              </div>
            </div>
            {planInfo.plan === 'FREE' && (
              <button onClick={handleUpgrade} disabled={upgrading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0 disabled:opacity-60">
                <Crown size={16} />
                {upgrading ? 'Yönlendiriliyor...' : "PRO'ya Yükselt"}
              </button>
            )}
          </div>
          {planInfo.plan === 'FREE' && (
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <h4 className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider mb-2">PRO Plan Özellikleri</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8a8f98]">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> 10 kamyon</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> 15 kullanıcı</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> e-Fatura / e-Arşiv</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> CRM + Personel + Gider</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Tahmin Motoru</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> E-posta + Telefon Desteği</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
