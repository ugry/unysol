import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, Loader2 } from 'lucide-react';

interface Props {
  userId: number;
  onClose: () => void;
}

export default function PermissionsModal({ userId, onClose }: Props) {
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/api/tenant/user-management/permissions/${userId}`).then(r => {
      setPerms(Array.isArray(r.data) ? r.data : []);
    }).catch(() => setPerms([])).finally(() => setLoading(false));
  }, [userId]);

  const toggle = (key: string, field: string) => {
    setPerms(prev => prev.map(p => p.module_key === key ? { ...p, [field]: !p[field] } : p));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = perms.map(p => ({ module_key: p.module_key, can_view: p.can_view, can_create: p.can_create, can_edit: p.can_edit, can_delete: p.can_delete }));
      await api.put(`/api/tenant/user-management/permissions/${userId}`, payload);
      setSaved(true);
      setTimeout(() => onClose(), 1500);
    } catch {}
    finally { setSaving(false); }
  };

  const categories = [...new Set(perms.map((p: any) => p.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#0f1011] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#f7f8f8]">Modül İzinleri</h3>
          <button onClick={onClose}><X size={20} className="text-[#8a8f98]" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#FF5F03]" size={28} /></div>
        ) : (
          <>
            <p className="text-sm text-[#8a8f98] mb-4">Bu kullanıcının hangi modülleri görüntüleyip değiştirebileceğini seçin.</p>
            {categories.map(cat => {
              const catPerms = perms.filter((p: any) => p.category === cat);
              if (catPerms.length === 0) return null;
              return (
                <div key={cat} className="mb-4">
                  <h4 className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider mb-2 px-1">{cat}</h4>
                  <div className="bg-[#191a1b] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="text-[#8a8f98] border-b border-[rgba(255,255,255,0.06)]"><th className="text-left py-2 px-3 font-medium">Modül</th><th className="text-center py-2 px-2 font-medium w-14">Gör</th><th className="text-center py-2 px-2 font-medium w-14">Ekle</th><th className="text-center py-2 px-2 font-medium w-14">Düzenle</th><th className="text-center py-2 px-2 font-medium w-14">Sil</th></tr></thead>
                      <tbody>
                        {catPerms.map((p: any) => (
                          <tr key={p.module_key} className="border-b border-[rgba(255,255,255,0.03)] last:border-0">
                            <td className="py-2 px-3 text-[#d0d6e0]">{p.module_name}</td>
                            {['can_view','can_create','can_edit','can_delete'].map(f => (
                              <td key={f} className="py-2 px-2 text-center">
                                <input type="checkbox" checked={p[f]} onChange={() => toggle(p.module_key, f)} className="accent-[#FF5F03] w-4 h-4 cursor-pointer" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {saved ? (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">İzinler kaydedildi</div>
            ) : (
              <button onClick={save} disabled={saving} className="mt-4 w-full py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm">{saving ? <Loader2 size={16} className="animate-spin inline" /> : 'İzinleri Kaydet'}</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
