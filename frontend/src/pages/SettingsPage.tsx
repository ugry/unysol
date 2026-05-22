import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Users as UsersIcon,
  Bell,
  Package,
  Crown,
  Save,
  Plus,
  Trash2,
  Moon,
  Globe,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const [companyForm, setCompanyForm] = useState({
    firma_unvani: user?.firma_unvani || '',
    vergi_dairesi: 'Büyük Mükellefler',
    vergi_no: '1234567890',
    adres: 'Organize Sanayi Bölgesi, İstanbul',
    telefon: user?.telefon || '',
    email: user?.email || '',
  });

  const [saved, setSaved] = useState(false);
  const [users] = useState([
    { id: '1', ad_soyad: 'Kemal Aras', email: 'kemal@logisol.com', rol: 'Yönetici' },
    { id: '2', ad_soyad: 'Ayşe Demir', email: 'ayse@logisol.com', rol: 'Operasyon' },
    { id: '3', ad_soyad: 'Can Yıldız', email: 'can@logisol.com', rol: 'Muhasebe' },
  ]);

  const [notifications, setNotifications] = useState({
    sefer_baslangic: true,
    sefer_bitis: true,
    vade_yaklasimi: true,
    bakim_hatirlatmasi: false,
    haftalik_ozet: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Firma Unvanı</label>
              <input
                type="text"
                value={companyForm.firma_unvani}
                onChange={(e) => setCompanyForm({ ...companyForm, firma_unvani: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">E-posta</label>
              <input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Vergi Dairesi</label>
              <input
                type="text"
                value={companyForm.vergi_dairesi}
                onChange={(e) => setCompanyForm({ ...companyForm, vergi_dairesi: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Vergi No</label>
              <input
                type="text"
                value={companyForm.vergi_no}
                onChange={(e) => setCompanyForm({ ...companyForm, vergi_no: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Telefon</label>
              <input
                type="text"
                value={companyForm.telefon}
                onChange={(e) => setCompanyForm({ ...companyForm, telefon: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8a8f98] mb-1.5">Adres</label>
            <input
              type="text"
              value={companyForm.adres}
              onChange={(e) => setCompanyForm({ ...companyForm, adres: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/20 transition-all"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150"
            >
              <Save size={16} />
              {saved ? 'Kaydedildi' : 'Kaydet'}
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
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#f7f8f8] hover:border-gray-400 text-sm font-medium transition-all">
            <Plus size={16} />
            Kullanıcı Ekle
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
            <p className="text-xs text-[#8a8f98] mt-0.5">Hangi durumlarda bildirim almak istediğinizi seçin</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { key: 'sefer_baslangic', label: 'Sefer başladığında' },
            { key: 'sefer_bitis', label: 'Sefer tamamlandığında' },
            { key: 'vade_yaklasimi', label: 'Fatura vadesi yaklaştığında' },
            { key: 'bakim_hatirlatmasi', label: 'Bakım hatırlatması' },
            { key: 'haftalik_ozet', label: 'Haftalık özet raporu' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between bg-[#191a1b] rounded-lg px-4 py-3 border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-[#8a8f98]" />
                <span className="text-sm text-[#f7f8f8]">{item.label}</span>
              </div>
              <button
                onClick={() =>
                  setNotifications({
                    ...notifications,
                    [item.key]: !notifications[item.key as keyof typeof notifications],
                  })
                }
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  notifications[item.key as keyof typeof notifications] ? 'bg-[#FF5F03]' : 'bg-[#555555]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                    notifications[item.key as keyof typeof notifications] ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
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
                <span className="text-sm font-semibold text-[#f7f8f8]">Ücretsiz Plan</span>
                <span className="text-xs bg-[#888888]/15 text-[#8a8f98] px-2 py-0.5 rounded-full">Mevcut</span>
              </div>
              <p className="text-xs text-[#8a8f98]">5 kamyon, 3 kullanıcı, temel raporlama</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-[#8a8f98]">
                <span>Kamyon: <span className="text-[#f7f8f8]">3/5</span></span>
                <span>Kullanıcı: <span className="text-[#f7f8f8]">3/3</span></span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0">
              <Crown size={16} />
              PRO'ya Yükselt
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <h4 className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider mb-2">PRO Plan Özellikleri</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8a8f98]">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Sınırsız kamyon</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Sınırsız kullanıcı</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Gelişmiş raporlama</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Yapay zeka tahminleri</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> WhatsApp otomasyonu</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Öncelikli destek</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
