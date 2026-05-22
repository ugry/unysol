import { useState, useEffect, type FormEvent } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Search,
  Truck,
} from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import type { Truck as TruckType } from '@/types';

interface TruckFormData {
  plaka: string;
  marka: string;
  model: string;
  yil: string;
  tracking_source: string;
}

const emptyForm: TruckFormData = {
  plaka: '',
  marka: '',
  model: '',
  yil: '',
  tracking_source: 'PHONE',
};

const trackingLabels: Record<string, string> = {
  PHONE: 'Telefon',
  ESP32_LTE: 'ESP32 LTE',
  MANUEL: 'Manuel',
};

const TRUCK_MANUFACTURERS: Record<string, string[]> = {
  'Ford': ['F-MAX', 'F-MAX L', 'Cargo 1842T', 'Cargo 3542M'],
  'Mercedes-Benz': ['Actros L', 'Actros MP5', 'Arocs', 'Axor', 'Atego'],
  'Scania': ['R450', 'R500', 'S730', 'G410', 'P360'],
  'Volvo': ['FH16', 'FH 540', 'FM 420', 'FMX 500', 'FE 320'],
  'BMC': ['Tuğra', 'Pro 1235', 'Pro 827', 'Megastar', 'Hawk'],
  'MAN': ['TGX 18.510', 'TGS 26.480', 'TGL 12.220', 'TGM 18.290'],
  'Renault Trucks': ['T-High 520', 'T 480', 'C 440', 'K 460', 'D Wide'],
  'Iveco': ['S-Way 530', 'Stralis NP', 'Trakker', 'Eurocargo', 'Daily'],
  'DAF': ['XF 530', 'XG+ 480', 'CF 450', 'LF 290'],
  'Fuso': ['Rosa', 'Canter', 'Fighter', 'Super Great'],
  'Hyundai': ['Xcient Pro', 'Pavise', 'Mighty', 'HD120'],
  'Isuzu': ['Giga', 'Forward', 'Elf', 'D-Max'],
};

const trackingColors: Record<string, string> = {
  PHONE: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
  ESP32_LTE: 'border-green-500/30 text-green-400 bg-green-500/10',
  MANUEL: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
};

const statusLabels: Record<string, string> = {
  true: 'Aktif',
  false: 'Pasif',
};

const statusColors: Record<string, string> = {
  true: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  false: 'border-gray-500/30 text-gray-400 bg-gray-500/10',
};

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TruckFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const res = await api.get<TruckType[]>('/api/tenant/trucks');
      setTrucks(res.data);
    } catch {
      setError('Kamyonlar yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const payload = { ...formData, yil: parseInt(formData.yil) || 0 };

    try {
      if (editingId) {
        await api.put(`/api/tenant/trucks/${editingId}`, payload);
      } else {
        await api.post('/api/tenant/trucks', payload);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchTrucks();
    } catch {
      setFormError(editingId ? 'Kamyon güncellenirken bir hata oluştu.' : 'Kamyon eklenirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTruck = (truck: TruckType) => {
    setEditingId(truck.id);
    setFormData({
      plaka: truck.plaka,
      marka: truck.marka,
      model: truck.model,
      yil: String(truck.yil),
      tracking_source: truck.tracking_source,
    });
    setShowModal(true);
  };

  const handleBulkDeleteTrucks = (ids: string[]) => {
    Promise.all(ids.map((id) => api.delete(`/api/tenant/trucks/${id}`).catch(() => {})))
      .finally(() => fetchTrucks());
  };

  const truckColumns: Column<TruckType>[] = [
    { key: 'plaka', header: 'Plaka', sortable: true, render: (t) => <span className="text-sm font-medium text-enterprise-text">{t.plaka}</span>, exportRender: (t) => t.plaka },
    { key: 'marka', header: 'Marka / Model', sortable: true, render: (t) => <span className="text-sm text-enterprise-text-muted">{t.marka} {t.model}</span>, exportRender: (t) => `${t.marka} ${t.model}` },
    { key: 'yil', header: 'Yıl', sortable: true, align: 'right', exportRender: (t) => String(t.yil) },
    { key: 'tracking_source', header: 'Takip', render: (t) => (
      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-md border ${trackingColors[t.tracking_source] || trackingColors.PHONE}`}>
        {trackingLabels[t.tracking_source] || t.tracking_source}
      </span>
    ), exportRender: (t) => trackingLabels[t.tracking_source] || t.tracking_source },
    { key: 'aktif', header: 'Durum', align: 'center', render: (t) => (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${statusColors[String(t.aktif)] || statusColors['false']}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${t.aktif ? 'bg-emerald-400' : 'bg-gray-400'}`} />
        {statusLabels[String(t.aktif)] || 'Pasif'}
      </span>
    ), exportRender: (t) => t.aktif ? 'Aktif' : 'Pasif' },
  ];

  const filteredTrucks = trucks.filter(
    (t) =>
      t.plaka.toLowerCase().includes(search.toLowerCase()) ||
      t.marka.toLowerCase().includes(search.toLowerCase()) ||
      t.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plaka, marka veya model ara..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-[#52525B] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
          />
        </div>
        <button
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0"
        >
          <Plus size={18} />
          Kamyon Ekle
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      <DataGrid<TruckType>
        columns={truckColumns}
        data={filteredTrucks}
        loading={loading}
        title="Kamyonlar"
        onEdit={handleEditTruck}
        onDelete={(t) => {
          const actionPayload = {
            action_type: 'DELETE',
            table_name: 'trucks',
            record_id: String(t.id),
            summary: `Kamyon silindi: ${t.plaka}`,
            record_data: JSON.parse(JSON.stringify(t)),
          };
          api.post('/api/tenant/actions/', actionPayload)
            .then(() => console.log('Action logged'))
            .catch((e) => console.error('Action log failed:', e?.response?.status, e?.response?.data));
          api.delete(`/api/tenant/trucks/${t.id}`).catch(() => {});
          setTrucks((prev) => prev.filter((tr) => tr.id !== t.id));
        }}
        onBulkDelete={handleBulkDeleteTrucks}
        emptyIcon={<Truck size={48} className="text-[#2a2a2a]" />}
        emptyText={search ? 'Aramanızla eşleşen kamyon bulunamadı' : 'Henüz kayıtlı kamyon bulunmuyor'}
      />
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-enterprise-text">
                {editingId ? 'Kamyon Düzenle' : 'Kamyon Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setFormData(emptyForm);
                  setFormError('');
                }}
                className="text-enterprise-text-muted hover:text-enterprise-text transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-500/20 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">
                  Plaka
                </label>
                <input
                  type="text"
                  value={formData.plaka}
                  onChange={(e) =>
                    setFormData({ ...formData, plaka: e.target.value })
                  }
                  required
                  placeholder="34 ABC 123"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text placeholder-[#52525B] text-sm outline-none focus:border-[#072C2C] focus:ring-1 focus:ring-[#072C2C]/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">
                    Marka
                  </label>
                  <select
                    value={formData.marka}
                    onChange={(e) =>
                      setFormData({ ...formData, marka: e.target.value, model: '' })
                    }
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] focus:ring-1 focus:ring-[#072C2C]/30 transition-all cursor-pointer"
                  >
                    <option value="">Seçiniz</option>
                    {Object.keys(TRUCK_MANUFACTURERS).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">
                    Model
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    required
                    disabled={!formData.marka}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] focus:ring-1 focus:ring-[#072C2C]/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Seçiniz</option>
                    {(TRUCK_MANUFACTURERS[formData.marka] || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">
                  Yıl
                </label>
                <input
                  type="number"
                  value={formData.yil}
                  onChange={(e) =>
                    setFormData({ ...formData, yil: e.target.value })
                  }
                  required
                  placeholder="2024"
                  min="1990"
                  max="2026"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text placeholder-[#52525B] text-sm outline-none focus:border-[#072C2C] focus:ring-1 focus:ring-[#072C2C]/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-enterprise-text-secondary mb-1.5">
                  Takip Kaynağı
                </label>
                <select
                  value={formData.tracking_source}
                  onChange={(e) =>
                    setFormData({ ...formData, tracking_source: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-gray-50 border border-enterprise-border-subtle text-enterprise-text text-sm outline-none focus:border-[#072C2C] focus:ring-1 focus:ring-[#072C2C]/30 transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%2371717A\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem',
                  }}
                >
                  <option value="PHONE">Telefon</option>
                  <option value="ESP32_LTE">ESP32 LTE</option>
                  <option value="MANUEL">Manuel</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData(emptyForm);
                    setFormError('');
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-enterprise-border-subtle text-enterprise-text-secondary hover:text-enterprise-text hover:border-gray-300 font-medium text-sm transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#072C2C] hover:bg-[#0A4545] text-white font-medium text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
