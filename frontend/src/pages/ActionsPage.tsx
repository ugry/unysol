import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X, Clock, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';

interface Action {
  id: number;
  action_type: string;
  table_name: string;
  record_id: string;
  summary: string;
  record_data?: any;
  created_at: string;
}

const actionTypeConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CREATE: { label: 'Oluşturma', bg: 'bg-[#16A34A]/15', text: 'text-[#16A34A]', border: 'border-[#16A34A]/30' },
  UPDATE: { label: 'Güncelleme', bg: 'bg-[#3b82f6]/15', text: 'text-blue-600', border: 'border-[#3b82f6]/30' },
  DELETE: { label: 'Silme', bg: 'bg-[#DC2626]/15', text: 'text-[#DC2626]', border: 'border-[#DC2626]/30' },
  BULK_DELETE: { label: 'Toplu Silme', bg: 'bg-[#DC2626]/15', text: 'text-[#DC2626]', border: 'border-[#DC2626]/30' },
};

export default function ActionsPage() {
  const [data, setData] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reverting, setReverting] = useState<number | null>(null);

  const fetchActions = () => {
    api.get<Action[]>('/api/tenant/actions/?limit=200')
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length > 0) setData(r.data);
      })
      .catch(() => setError('İşlem kayıtları yüklenemedi.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchActions();
  }, []);

  const handleRevert = async (action: Action) => {
    if (reverting) return;
    setReverting(action.id);
    try {
      await api.post(`/api/tenant/actions/${action.id}/revert`);
      setError('');
      const r = await api.get<Action[]>('/api/tenant/actions/?limit=200');
      if (Array.isArray(r.data)) setData(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Geri alma başarısız.');
    } finally {
      setReverting(null);
    }
  };

  const columns: Column<Action>[] = [
    {
      key: 'created_at',
      header: 'Tarih',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-enterprise-text">
          {new Date(row.created_at).toLocaleString('tr-TR')}
        </span>
      ),
      exportRender: (row) => new Date(row.created_at).toLocaleString('tr-TR'),
    },
    {
      key: 'action_type',
      header: 'İşlem',
      sortable: true,
      render: (row) => {
        const cfg = actionTypeConfig[row.action_type] || actionTypeConfig.CREATE;
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.label}
          </span>
        );
      },
      exportRender: (row) => actionTypeConfig[row.action_type]?.label || row.action_type,
    },
    {
      key: 'table_name',
      header: 'Tablo',
      sortable: true,
      exportRender: (row) => row.table_name,
    },
    {
      key: 'record_id',
      header: 'Kayıt',
      sortable: true,
      render: (row) => <span className="text-sm text-enterprise-text-muted">{row.record_id || '—'}</span>,
      exportRender: (row) => row.record_id || '',
    },
    {
      key: 'summary',
      header: 'Özet',
      sortable: true,
      render: (row) => <span className="text-sm text-enterprise-text">{row.summary || '—'}</span>,
      exportRender: (row) => row.summary || '',
    },
    {
      key: 'revert',
      header: '',
      align: 'center',
      render: (row) =>
        row.action_type === 'DELETE' || row.action_type === 'BULK_DELETE' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRevert(row);
            }}
            disabled={reverting === row.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#16A34A] bg-[#16A34A]/10 hover:bg-[#16A34A]/20 border border-[#16A34A]/20 transition-colors disabled:opacity-50"
          >
            {reverting === row.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
            Geri Al
          </button>
        ) : (
          <span className="text-xs text-enterprise-text-muted">—</span>
        ),
      exportRender: () => '',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-500/20 text-[#DC2626] text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <DataGrid
        columns={columns}
        data={data}
        loading={loading}
        title="İşlem Kayıtları"
        emptyIcon={<Clock size={48} className="text-[#2a2a2a]" />}
        emptyText="Henüz işlem kaydı yok"
      />
    </div>
  );
}
