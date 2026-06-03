import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, Loader2, X, Check, XCircle } from 'lucide-react';
import api from '@/lib/api';

export default function AccessManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPerms, setShowPerms] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({ ad_soyad: '', email: '', password: '', rol: 'OFFICE', telefon: '' });

  const [permissions, setPermissions] = useState<Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>>({});

  const roles = ['OFFICE', 'DRIVER', 'ACCOUNTANT'];

  const fetchUsers = () => {
    api.get('/api/tenant/user-management/').then(r => {
      if (Array.isArray(r.data)) setUsers(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/api/tenant/user-management/', form);
      setShowAdd(false);
      setForm({ ad_soyad: '', email: '', password: '', rol: 'OFFICE', telefon: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Kullanıcı oluşturulamadı');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/tenant/user-management/${deleteId}`);
      setDeleteId(null);
      fetchUsers();
    } catch { alert('Silme başarısız'); }
  };

  const handleShowPermissions = async (userId: number) => {
    setShowPerms(userId);
    try {
      const r = await api.get(`/api/tenant/user-management/permissions/${userId}`);
      if (r.data) setPermissions(r.data);
    } catch { alert('İzinler yüklenemedi'); }
  };

  const handleSavePermissions = async () => {
    if (!showPerms) return; setSaving(true);
    try {
      await api.put(`/api/tenant/user-management/permissions/${showPerms}`, permissions);
      setShowPerms(null);
    } catch { alert('İzinler kaydedilemedi'); } finally { setSaving(false); }
  };

  const togglePerm = (key: string, col: string) => {
    setPermissions(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { can_view: false, can_create: false, can_edit: false, can_delete: false }), [col]: !(prev[key]?.[col as keyof typeof prev[string]] || false) }
    }));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-[#FF5F03]" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Erişim Yönetimi</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">
          <Plus size={18} /> Kullanıcı Ekle
        </button>
      </div>

      <div className="bg-white border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.05)] text-[#8a8f98]">
              <th className="text-left p-3 font-medium">Ad Soyad</th>
              <th className="text-left p-3 font-medium">E-posta</th>
              <th className="text-left p-3 font-medium">Rol</th>
              <th className="text-right p-3 font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[rgba(255,255,255,0.03)]">
                <td className="p-3">{u.ad_soyad}</td>
                <td className="p-3 text-[#8a8f98]">{u.email}</td>
                <td className="p-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF5F03]/10 text-[#FF5F03]">{u.rol}</span>
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  <button onClick={() => handleShowPermissions(u.id)} className="p-1.5 rounded-lg hover:bg-[#191a1b] text-[#8a8f98] hover:text-[#f7f8f8]" title="İzinler">
                    <Shield size={16} />
                  </button>
                  <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#8a8f98] hover:text-red-600" title="Sil">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-[#8a8f98]">Henüz kullanıcı kaydı yok</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAdd(false)}>
          <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Yeni Kullanıcı</h3>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-[#8a8f98]" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={form.ad_soyad} onChange={e => setForm(p => ({...p, ad_soyad: e.target.value}))} placeholder="Ad Soyad" className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40" required />
              <input value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="E-posta" type="email" className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40" required />
              <input value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="Şifre" type="password" className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40" required />
              <select value={form.rol} onChange={e => setForm(p => ({...p, rol: e.target.value}))} className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input value={form.telefon} onChange={e => setForm(p => ({...p, telefon: e.target.value}))} placeholder="Telefon" className="w-full px-3 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-[#f7f8f8] text-sm outline-none focus:border-[#FF5F03]/40" />
              <button type="submit" disabled={saving} className="w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleteId(null)}>
          <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Kullanıcıyı Sil</h3>
            <p className="text-sm text-[#8a8f98] mb-4">Bu işlem geri alınamaz. Emin misiniz?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-lg bg-[#191a1b] border border-[rgba(255,255,255,0.08)] text-sm">İptal</button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPerms(null)}>
          <div className="bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Modül İzinleri</h3>
              <button onClick={() => setShowPerms(null)}><X size={18} className="text-[#8a8f98]" /></button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8a8f98] border-b border-[rgba(255,255,255,0.05)]">
                  <th className="text-left p-2 font-medium">Modül</th>
                  <th className="text-center p-2 font-medium w-16">Gör</th>
                  <th className="text-center p-2 font-medium w-16">Oluştur</th>
                  <th className="text-center p-2 font-medium w-16">Düzenle</th>
                  <th className="text-center p-2 font-medium w-16">Sil</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissions).map(([key, val]) => (
                  <tr key={key} className="border-b border-[rgba(255,255,255,0.03)]">
                    <td className="p-2 capitalize">{key.replace(/_/g, ' ')}</td>
                    {(['can_view','can_create','can_edit','can_delete'] as const).map(col => (
                      <td key={col} className="p-2 text-center">
                        <button onClick={() => togglePerm(key, col)} className="p-1 rounded">
                          {val[col] ? <Check size={16} className="text-green-500" /> : <XCircle size={16} className="text-[#333]" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleSavePermissions} disabled={saving} className="mt-4 w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'İzinleri Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
