import { useState, useEffect, type FormEvent } from 'react';
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Search,
  Users,
  Star,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

interface Employee {
  id: string;
  ad_soyad: string;
  rol: string;
  telefon: string;
  ehliyet_bitis: string;
  src_bitis: string;
  performans: number;
  aylik_km?: number;
  aylik_sefer?: number;
  ort_yakit?: number;
  trafik_cezasi?: number;
  maas?: number;
  [key: string]: unknown;
}

interface EmployeeFormData {
  ad_soyad: string;
  rol: string;
  telefon: string;
  ehliyet_bitis: string;
  src_bitis: string;
}

const emptyForm: EmployeeFormData = {
  ad_soyad: '',
  rol: 'sofor',
  telefon: '',
  ehliyet_bitis: '',
  src_bitis: '',
};

const mockEmployees: Employee[] = [
  {
    id: '1',
    ad_soyad: 'Mehmet Yılmaz',
    rol: 'Şoför',
    telefon: '0532 111 22 33',
    ehliyet_bitis: '2027-05-15',
    src_bitis: '2025-12-20',
    performans: 92,
    aylik_km: 8500,
    aylik_sefer: 12,
    ort_yakit: 28.5,
    trafik_cezasi: 0,
    maas: 18000,
  },
  {
    id: '2',
    ad_soyad: 'Ali Demir',
    rol: 'Şoför',
    telefon: '0533 222 33 44',
    ehliyet_bitis: '2024-07-10',
    src_bitis: '2025-08-15',
    performans: 88,
    aylik_km: 7200,
    aylik_sefer: 10,
    ort_yakit: 31.2,
    trafik_cezasi: 1500,
    maas: 17500,
  },
  {
    id: '3',
    ad_soyad: 'Ahmet Kaya',
    rol: 'Şoför',
    telefon: '0535 333 44 55',
    ehliyet_bitis: '2026-03-22',
    src_bitis: '2024-06-01',
    performans: 85,
    aylik_km: 6800,
    aylik_sefer: 9,
    ort_yakit: 29.8,
    trafik_cezasi: 3200,
    maas: 17000,
  },
  {
    id: '4',
    ad_soyad: 'Mustafa Şahin',
    rol: 'Operasyon Sorumlusu',
    telefon: '0537 444 55 66',
    ehliyet_bitis: '-',
    src_bitis: '-',
    performans: 95,
    maas: 22000,
  },
  {
    id: '5',
    ad_soyad: 'Hasan Çelik',
    rol: 'Şoför',
    telefon: '0539 555 66 77',
    ehliyet_bitis: '2025-11-18',
    src_bitis: '2026-04-10',
    performans: 90,
    aylik_km: 7900,
    aylik_sefer: 11,
    ort_yakit: 27.3,
    trafik_cezasi: 0,
    maas: 18500,
  },
];

const getExpiryStatus = (dateStr: string) => {
  if (dateStr === '-' || !dateStr) return null;
  const now = new Date();
  const expiry = new Date(dateStr);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays;
};

const employeeColumns: Column<Employee>[] = [
  {
    key: 'ad_soyad',
    header: 'Ad Soyad',
    sortable: true,
    render: (row) => <span className="text-sm font-medium text-enterprise-text">{row.ad_soyad}</span>,
    exportRender: (row) => row.ad_soyad,
  },
  {
    key: 'rol',
    header: 'Rol',
    sortable: true,
    exportRender: (row) => row.rol,
  },
  {
    key: 'telefon',
    header: 'Telefon',
    sortable: true,
    exportRender: (row) => row.telefon,
  },
  {
    key: 'ehliyet_bitis',
    header: 'Ehliyet Bitiş',
    sortable: true,
    render: (row) => {
      const days = getExpiryStatus(row.ehliyet_bitis);
      const urgent = days !== null && days < 30;
      return (
        <span className={`text-sm ${urgent ? 'text-[#DC2626] font-medium' : 'text-enterprise-text'}`}>
          {row.ehliyet_bitis}
          {urgent && <AlertTriangle size={12} className="inline ml-1 text-[#DC2626]" />}
        </span>
      );
    },
    exportRender: (row) => row.ehliyet_bitis,
  },
  {
    key: 'src_bitis',
    header: 'SRC Bitiş',
    sortable: true,
    render: (row) => {
      const days = getExpiryStatus(row.src_bitis);
      const urgent = days !== null && days < 30;
      return (
        <span className={`text-sm ${urgent ? 'text-[#DC2626] font-medium' : 'text-enterprise-text'}`}>
          {row.src_bitis}
          {urgent && <AlertTriangle size={12} className="inline ml-1 text-[#DC2626]" />}
        </span>
      );
    },
    exportRender: (row) => row.src_bitis,
  },
  {
    key: 'performans',
    header: 'Performans',
    sortable: true,
    align: 'center' as const,
    render: (row) => (
      <div className="flex items-center justify-center gap-1">
        <Star size={14} className="text-amber-500 fill-[#f59e0b]" />
        <span className="text-sm font-medium text-enterprise-text">{row.performans}</span>
      </div>
    ),
    exportRender: (row) => String(row.performans),
  },
  {
    key: 'aylik_km',
    header: 'Aylık KM',
    sortable: true,
    align: 'right' as const,
    render: (row) => <span className="text-sm text-enterprise-text">{row.aylik_km?.toLocaleString('tr-TR') ?? '-'}</span>,
    exportRender: (row) => row.aylik_km != null ? String(row.aylik_km) : '-',
  },
  {
    key: 'aylik_sefer',
    header: 'Aylık Sefer',
    sortable: true,
    align: 'right' as const,
    render: (row) => <span className="text-sm text-enterprise-text">{row.aylik_sefer ?? '-'}</span>,
    exportRender: (row) => row.aylik_sefer != null ? String(row.aylik_sefer) : '-',
  },
  {
    key: 'ort_yakit',
    header: 'Ort. Yakıt',
    sortable: true,
    align: 'right' as const,
    render: (row) => <span className="text-sm text-enterprise-text">{row.ort_yakit != null ? `${row.ort_yakit} L/100km` : '-'}</span>,
    exportRender: (row) => row.ort_yakit != null ? `${row.ort_yakit} L/100km` : '-',
  },
  {
    key: 'trafik_cezasi',
    header: 'Trafik Cezası',
    sortable: true,
    align: 'right' as const,
    render: (row) => (
      <span className={`text-sm ${row.trafik_cezasi ? 'text-[#DC2626]' : 'text-enterprise-text'}`}>
        {row.trafik_cezasi != null ? `₺${row.trafik_cezasi.toLocaleString('tr-TR')}` : '-'}
      </span>
    ),
    exportRender: (row) => row.trafik_cezasi != null ? `₺${row.trafik_cezasi.toLocaleString('tr-TR')}` : '-',
  },
  {
    key: 'maas',
    header: 'Maaş',
    sortable: true,
    align: 'right' as const,
    render: (row) => (
      <span className="text-sm text-[#16A34A] font-medium">
        {row.maas != null ? `₺${row.maas.toLocaleString('tr-TR')}` : '-'}
      </span>
    ),
    exportRender: (row) => row.maas != null ? `₺${row.maas.toLocaleString('tr-TR')}` : '-',
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Employee[]>('/api/tenant/employees')
      .then((res) => {
        if (!cancelled) setEmployees(res.data);
      })
      .catch(() => {
        if (!cancelled) setEmployees(mockEmployees);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/api/tenant/employees/${editingId}`, formData);
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingId ? { ...emp, ...formData } : emp
          )
        );
      } else {
        const res = await api.post<Employee>('/api/tenant/employees', formData);
        if (res.data) {
          setEmployees((prev) => [...prev, res.data]);
        }
        // Re-fetch to ensure list is up-to-date
        const refreshed = await api.get<Employee[]>('/api/tenant/employees');
        if (refreshed.data) setEmployees(refreshed.data);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch {
      setFormError('Personel kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.ad_soyad.toLowerCase().includes(search.toLowerCase()) ||
    emp.rol.toLowerCase().includes(search.toLowerCase()) ||
    emp.telefon.includes(search)
  );

  const handleEdit = (emp: Employee) => {
    setFormData({
      ad_soyad: emp.ad_soyad,
      rol: emp.rol,
      telefon: emp.telefon,
      ehliyet_bitis: emp.ehliyet_bitis,
      src_bitis: emp.src_bitis,
    });
    setEditingId(emp.id);
    setShowModal(true);
  };

  const handleDelete = async (emp: Employee) => {
    try {
      await api.delete(`/api/tenant/employees/${emp.id}`);
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
    } catch {
      // silently fail — DataGrid shows undo toast
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, rol veya telefon ara..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0"
        >
          <Plus size={18} />
          Personel Ekle
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <DataGrid
        columns={employeeColumns}
        data={filteredEmployees}
        loading={loading}
        title="Personel"
        emptyIcon={<Users size={48} className="text-[#2a2a2a]" />}
        emptyText={search ? 'Aramanızla eşleşen personel bulunamadı' : 'Henüz personel kaydı yok'}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={(ids) => {
          setEmployees((prev) => prev.filter((e) => !ids.includes(e.id)));
        }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">{editingId ? 'Personel Düzenle' : 'Personel Ekle'}</h3>
              <button
                onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); setFormError(''); }}
                className="text-enterprise-text-muted hover:text-enterprise-text transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-sm">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  value={formData.ad_soyad}
                  onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                  required
                  placeholder="Mehmet Yılmaz"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all cursor-pointer"
                >
                  <option value="sofor">Şoför</option>
                  <option value="operasyon">Operasyon Sorumlusu</option>
                  <option value="yonetici">Yönetici</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Telefon</label>
                <input
                  type="text"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  required
                  placeholder="0532 111 22 33"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text placeholder-[#555555] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">Ehliyet Bitiş</label>
                  <input
                    type="date"
                    value={formData.ehliyet_bitis}
                    onChange={(e) => setFormData({ ...formData, ehliyet_bitis: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-muted mb-1.5">SRC Bitiş</label>
                  <input
                    type="date"
                    value={formData.src_bitis}
                    onChange={(e) => setFormData({ ...formData, src_bitis: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-100 border border-enterprise-border text-enterprise-text text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); setFormData(emptyForm); setFormError(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-enterprise-border text-enterprise-text-muted hover:text-enterprise-text hover:border-gray-400 font-medium text-sm transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
