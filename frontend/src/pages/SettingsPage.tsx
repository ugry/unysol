import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Building2, Users as UsersIcon, Bell, Package, Crown, Save, Plus, Trash2, Settings2, UserCheck, Calendar, Phone, UserPlus } from 'lucide-react';
import AddUserModal from '@/components/AddUserModal';
import PermissionsModal from '@/components/PermissionsModal';

export default function SettingsPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'TENANT_OWNER';

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
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState({ plan: 'FREE', truckCount: 0, truckLimit: 5, userCount: 0, userLimit: 5 });
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPermsFor, setShowPermsFor] = useState<number | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    trip_started: false, trip_completed: false, invoice_due: false, maintenance: false, weekly_summary: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // ── PERSONNEL (Employees) state ──
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [empForm, setEmpForm] = useState({ ad_soyad: '', rol: 'SOFOR', telefon: '', ehliyet_bitis: '', src_bitis: '' });
  const [empLoading, setEmpLoading] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    api.get('/api/tenant/user-management').then(r => {
      if (Array.isArray(r.data)) setUsers(r.data.map((e: any) => ({
        id: String(e.id), ad_soyad: e.ad_soyad || '', email: e.email || '', rol: e.rol || ''
      })));
    }).catch(() => {});

    api.get('/api/tenant/dashboard/summary').then(r => {
      const d = r.data;
      setPlanInfo(prev => ({ ...prev, truckCount: d?.aktif_kamyon || 0 }));
    }).catch(() => {});

    api.get('/api/tenant/billing/status').then(r => {
      if (r.data) setPlanInfo(prev => ({ ...prev, plan: r.data.plan || 'FREE' }));
    }).catch(() => {});

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
      const notifs = r.data?.notifications;
      if (notifs && typeof notifs === 'string') {
        try { const parsed = JSON.parse(notifs); setNotifPrefs(prev => ({ ...prev, ...parsed })); } catch {}
      }
    }).catch(() => {});

    // Fetch employees
    api.get('/api/tenant/employees').then(r => {
      if (Array.isArray(r.data)) setEmployees(r.data);
    }).catch(() => {});
  }, [isOwner]);

  useEffect(() => {
    if (!isOwner) return;
    api.get('/api/tenant/user-management').then(r => {
      if (Array.isArray(r.data)) setPlanInfo(prev => ({ ...prev, userCount: r.data.length }));
    }).catch(() => {});
  }, [users.length, isOwner]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/tenant/settings', {
        vergi_dairesi: companyForm.vergi_dairesi, vergi_no: companyForm.vergi_no,
        adres: companyForm.adres, telefon: companyForm.telefon,
      });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setSaved(false); } finally { setSaving(false); }
  };

  const handleUpgrade = async () => {
    setUpgrading(true); setUpgradeMsg('');
    try {
      const res = await api.post('/api/tenant/stripe/checkout', { plan: 'PRO' });
      const checkoutUrl = res.data?.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        const errMsg = res.data?.error || '';
        setUpgradeMsg(errMsg === 'Stripe yapılandırılmamış'
          ? 'Ödeme sistemi henüz aktif değil. Lütfen daha sonra tekrar deneyin.'
          : 'Ödeme sayfası açılamadı. Lütfen info@unysolar.com adresine yazın.');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || '';
      setUpgradeMsg(errMsg === 'Stripe yapılandırılmamış'
        ? 'Ödeme sistemi henüz aktif değil. Lütfen daha sonra tekrar deneyin.'
        : 'Bağlantı hatası. Lütfen info@unysolar.com adresine yazın.');
    } finally { setUpgrading(false); }
  };

  const handleDeleteUser = (userId: string) => setDeleteUserId(userId);

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;
    try { await api.delete(`/api/tenant/user-management/${deleteUserId}`); setUsers(prev => prev.filter(u => u.id !== deleteUserId)); } catch {}
    setDeleteUserId(null);
  };

  const handleToggleNotification = async (key: string) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated); setNotifSaving(true);
    try { await api.put('/api/tenant/settings/notifications', updated); } catch { setNotifPrefs(notifPrefs); }
    finally { setNotifSaving(false); }
  };

  // ── EMPLOYEE CRUD ──
  const openAddEmployee = () => {
    setEmpForm({ ad_soyad: '', rol: 'SOFOR', telefon: '', ehliyet_bitis: '', src_bitis: '' });
    setEditingEmployee(null);
    setShowAddEmployee(true);
  };

  const openEditEmployee = (emp: any) => {
    setEmpForm({
      ad_soyad: emp.ad_soyad || '',
      rol: emp.rol || 'SOFOR',
      telefon: emp.telefon || '',
      ehliyet_bitis: emp.ehliyet_bitis ? emp.ehliyet_bitis.substring(0, 10) : '',
      src_bitis: emp.src_bitis ? emp.src_bitis.substring(0, 10) : '',
    });
    setEditingEmployee(emp);
    setShowAddEmployee(true);
  };

  const saveEmployee = async () => {
    if (!empForm.ad_soyad.trim()) return;
    setEmpLoading(true);
    try {
      if (editingEmployee) {
        await api.put(`/api/tenant/employees/${editingEmployee.id}`, empForm);
      } else {
        await api.post('/api/tenant/employees', empForm);
      }
      const r = await api.get('/api/tenant/employees');
      if (Array.isArray(r.data)) setEmployees(r.data);
      setShowAddEmployee(false);
    } catch {} finally { setEmpLoading(false); }
  };

  const deleteEmployee = async (id: number) => {
    if (!confirm('Bu personel kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/tenant/employees/${id}`);
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch {}
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

      {/* TENANT_OWNER ONLY: Kullanıcı Yönetimi + Personel Kayıtları */}
      {isOwner && (
        <>
          {/* Kullanıcı Yönetimi (login accounts) */}
          <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center flex-shrink-0">
                <UsersIcon size={20} className="text-[#FF5F03]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f7f8f8]">Kullanıcı Yönetimi</h3>
                <p className="text-xs text-[#8a8f98] mt-0.5">Sisteme giriş yapabilen kullanıcı hesapları</p>
              </div>
            </div>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-[#191a1b] rounded-lg px-4 py-3 border border-[rgba(255,255,255,0.08)]">
                  <div>
                    <span className="text-sm font-medium text-[#f7f8f8]">{u.ad_soyad}</span>
                    <span className="text-xs text-[#8a8f98] block">{u.email} · {u.rol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.rol !== 'TENANT_OWNER' && (
                      <button onClick={() => setShowPermsFor(parseInt(u.id))} className="text-[#8a8f98] hover:text-[#FF5F03] transition-colors p-1.5 rounded-md hover:bg-[#FF5F03]/10" title="İzinleri Yönet">
                        <Settings2 size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDeleteUser(u.id)} className="text-[#8a8f98] hover:text-[#DC2626] transition-colors p-1.5 rounded-md hover:bg-[#DC2626]/10" title="Kullanıcıyı Sil">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-sm text-[#8a8f98] text-center py-4">Henüz kullanıcı eklenmemiş</p>}
              <button onClick={() => setShowAddUser(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[rgba(255,255,255,0.08)] text-[#8a8f98] hover:text-[#f7f8f8] hover:border-gray-400 text-sm font-medium transition-all">
                <Plus size={16} /> Kullanıcı Ekle
              </button>
            </div>
          </div>

          {/* Personel Kayıtları (HR records — merged from EmployeesPage) */}
          <div className="bg-[#08090a] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF5F03]/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={20} className="text-[#FF5F03]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f7f8f8]">Personel Kayıtları</h3>
                  <p className="text-xs text-[#8a8f98] mt-0.5">Şirket personeli (şoför, ofis, yönetici) kayıtları</p>
                </div>
              </div>
              <button onClick={openAddEmployee} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white text-sm font-medium transition-colors">
                <UserPlus size={16} /> Personel Ekle
              </button>
            </div>
            <div className="space-y-2">
              {employees.length === 0 && <p className="text-sm text-[#8a8f98] text-center py-4">Henüz personel kaydı eklenmemiş</p>}
              {employees.map((emp: any) => (
                <div key={emp.id} className="flex items-center justify-between bg-[#191a1b] rounded-lg px-4 py-3 border border-[rgba(255,255,255,0.08)]">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-[#f7f8f8]">{emp.ad_soyad}</span>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-[#8a8f98]">
                      <span className="bg-[#FF5F03]/10 text-[#FF5F03] px-1.5 py-0.5 rounded text-[11px] font-medium">{emp.rol}</span>
                      {emp.telefon && <span className="flex items-center gap-1"><Phone size={10} /> {emp.telefon}</span>}
                      {emp.ehliyet_bitis && <span className="flex items-center gap-1"><Calendar size={10} /> Ehliyet: {emp.ehliyet_bitis.substring(0, 10)}</span>}
                      {emp.src_bitis && <span className="flex items-center gap-1"><Calendar size={10} /> SRC: {emp.src_bitis.substring(0, 10)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                    <button onClick={() => openEditEmployee(emp)} className="text-[#8a8f98] hover:text-[#FF5F03] transition-colors p-1.5 rounded-md hover:bg-[#FF5F03]/10" title="Düzenle">
                      <Settings2 size={14} />
                    </button>
                    <button onClick={() => deleteEmployee(emp.id)} className="text-[#8a8f98] hover:text-[#DC2626] transition-colors p-1.5 rounded-md hover:bg-[#DC2626]/10" title="Sil">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
            { label: 'Sefer başladığında', key: 'trip_started' },
            { label: 'Sefer tamamlandığında', key: 'trip_completed' },
            { label: 'Fatura vadesi yaklaştığında', key: 'invoice_due' },
            { label: 'Bakım hatırlatması', key: 'maintenance' },
            { label: 'Haftalık özet raporu', key: 'weekly_summary' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between bg-[#191a1b] rounded-lg px-4 py-3 border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-[#8a8f98]" />
                <span className="text-sm text-[#f7f8f8]">{item.label}</span>
              </div>
              <button onClick={() => handleToggleNotification(item.key)} disabled={notifSaving}
                className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${notifPrefs[item.key] ? 'bg-[#FF5F03]' : 'bg-[#333]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
                <span className="text-sm font-semibold text-[#f7f8f8]">{planInfo.plan === 'FREE' ? 'Ücretsiz Plan' : planInfo.plan + ' Plan'}</span>
                <span className="text-xs bg-[#888]/15 text-[#8a8f98] px-2 py-0.5 rounded-full">Mevcut</span>
              </div>
              <p className="text-xs text-[#8a8f98]">{planInfo.truckLimit} kamyon, {planInfo.userLimit} kullanıcı</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-[#8a8f98]">
                <span>Kamyon: <span className="text-[#f7f8f8]">{planInfo.truckCount}/{planInfo.truckLimit}</span></span>
                <span>Kullanıcı: <span className="text-[#f7f8f8]">{users.length}/{planInfo.userLimit}</span></span>
              </div>
            </div>
            {planInfo.plan === 'FREE' ? (
              <button onClick={handleUpgrade} disabled={upgrading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0 disabled:opacity-60">
                <Crown size={16} />
                {upgrading ? 'Yönlendiriliyor...' : "PRO'ya Yükselt"}
              </button>
            ) : (
              <span className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5F03]/10 border border-[#FF5F03]/20 text-[#FF5F03] font-medium text-sm flex-shrink-0">
                <Crown size={16} />
                PRO Aktif
              </span>
            )}
          </div>
          {upgradeMsg && <p className="mt-3 text-sm text-[#FF5F03] bg-[#FF5F03]/10 rounded-lg px-4 py-2">{upgradeMsg}</p>}
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

      {/* MODALS */}
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onCreated={(newUser) => {
        setUsers(prev => [...prev, { id: String(newUser.id), ad_soyad: newUser.ad_soyad, email: newUser.email, rol: newUser.rol }]);
        api.get('/api/tenant/user-management').then(r => {
          if (Array.isArray(r.data)) setUsers(r.data.map((e: any) => ({ id: String(e.id), ad_soyad: e.ad_soyad || '', email: e.email || '', rol: e.rol || '' })));
        }).catch(() => {});
      }} />}
      {showPermsFor !== null && <PermissionsModal userId={showPermsFor} onClose={() => setShowPermsFor(null)} />}

      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kullanıcıyı Sil</h3>
            <p className="text-sm text-gray-600 mb-6">Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUserId(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50">İptal</button>
              <button onClick={confirmDeleteUser} className="flex-1 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-medium text-sm">Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Add/Edit Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#141516] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-semibold text-[#f7f8f8] mb-4">
              {editingEmployee ? 'Personel Düzenle' : 'Yeni Personel'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">Ad Soyad</label>
                <input type="text" value={empForm.ad_soyad} onChange={e => setEmpForm({...empForm, ad_soyad: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">Rol</label>
                <select value={empForm.rol} onChange={e => setEmpForm({...empForm, rol: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]">
                  <option value="SOFOR">Şoför</option>
                  <option value="OFIS">Ofis</option>
                  <option value="SEF">Şef</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">Telefon</label>
                <input type="text" value={empForm.telefon} onChange={e => setEmpForm({...empForm, telefon: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">Ehliyet Bitiş</label>
                <input type="date" value={empForm.ehliyet_bitis} onChange={e => setEmpForm({...empForm, ehliyet_bitis: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8a8f98] mb-1">SRC Bitiş</label>
                <input type="date" value={empForm.src_bitis} onChange={e => setEmpForm({...empForm, src_bitis: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddEmployee(false)} className="flex-1 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] text-[#8a8f98] text-sm hover:bg-[#191a1b]">İptal</button>
              <button onClick={saveEmployee} disabled={empLoading}
                className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white text-sm font-medium disabled:opacity-60">
                {empLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
