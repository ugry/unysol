import { useState, useEffect } from 'react';
import {
  Plus, X, Search, FileText, AlertTriangle,
  Clock, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import DataGrid, { type Column } from '@/components/DataGrid';
import type {
  Invoice, InvoiceCreatePayload, InvoiceItemCreatePayload,
  InvoiceUpdatePayload, PaymentCreatePayload, PaginatedInvoices,
  AgingReportRow, InvoiceRecurrenceRecord, TCMBKur
} from '@/types';

// ============================================================
// CONFIG
// ============================================================
const YONTEMLER = ['havale', 'eft', 'nakit', 'kredi_karti', 'cek', 'senet', 'diger'];
const FREKANSLAR = ['HAFTALIK', 'AYLIK', '3_AYLIK', '6_AYLIK', 'YILLIK'];
const PARABIRIMLERI = ['TRY', 'USD', 'EUR', 'GBP'];
const KDV_ORANLARI = [0, 1, 8, 10, 20];

const durumConfig: Record<string, { label: string; bg: string; text: string }> = {
  taslak: { label: 'Taslak', bg: 'bg-gray-100', text: 'text-gray-600' },
  onayda: { label: 'Onayda', bg: 'bg-blue-100', text: 'text-blue-700' },
  onaylandi: { label: 'Onaylandı', bg: 'bg-green-100', text: 'text-green-700' },
  gonderildi: { label: 'Gönderildi', bg: 'bg-purple-100', text: 'text-purple-700' },
  odendi: { label: 'Ödendi', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  iptal: { label: 'İptal', bg: 'bg-red-100', text: 'text-red-700' },
};

const odemeDurumConfig: Record<string, { label: string; bg: string; text: string }> = {
  bekleyen: { label: 'Bekleyen', bg: 'bg-amber-100', text: 'text-amber-700' },
  kismi_odendi: { label: 'Kısmi Ödendi', bg: 'bg-orange-100', text: 'text-orange-700' },
  odendi: { label: 'Ödendi', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  gecikti: { label: 'Gecikti', bg: 'bg-red-100', text: 'text-red-700' },
  vadesi_gecti: { label: 'Vadesi Geçti', bg: 'bg-red-200', text: 'text-red-800' },
  iptal: { label: 'İptal', bg: 'bg-gray-100', text: 'text-gray-600' },
};

const ebelgeConfig: Record<string, { label: string; bg: string; text: string }> = {
  YOK: { label: '-', bg: 'bg-gray-50', text: 'text-gray-400' },
  E_FATURA: { label: 'E-Fatura', bg: 'bg-blue-100', text: 'text-blue-700' },
  E_ARSIV: { label: 'E-Arşiv', bg: 'bg-teal-100', text: 'text-teal-700' },
};

// ============================================================
// HELPERS
// ============================================================
function itemTutar(it: InvoiceItemCreatePayload): number {
  const miktar = it.miktar || 0;
  const birimFiyat = it.birim_fiyat || 0;
  const hamTutar = miktar * birimFiyat;
  const iskonto = it.iskonto_oran > 0 ? hamTutar * it.iskonto_oran / 100 : (it.iskonto_tutar || 0);
  return hamTutar - iskonto;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function InvoicesPage() {
  const [view, setView] = useState<'list' | 'aging' | 'recurrences'>('list');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-2 border-b border-enterprise-border pb-3">
        {[
          { key: 'list' as const, label: 'Faturalar' },
          { key: 'aging' as const, label: 'Vade Analizi' },
          { key: 'recurrences' as const, label: 'Tekrarlayan' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === tab.key
                ? 'bg-[#FF5F03] text-white'
                : 'text-enterprise-text-muted hover:text-enterprise-text hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'list' && <InvoiceListView />}
      {view === 'aging' && <AgingView />}
      {view === 'recurrences' && <RecurrencesView />}
    </div>
  );
}

// ============================================================
// INVOICE LIST VIEW
// ============================================================
function InvoiceListView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('page_size', '500');
      if (search) params.set('musteri', search);
      const res = await api.get<PaginatedInvoices>(`/api/tenant/invoices?${params}`);
      setInvoices(res.data.data);
    } catch {
      setError('Faturalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setShowCreate(true);
  };

  const handleStatusChange = async (id: number, durum: string) => {
    await api.put(`/api/tenant/invoices/${id}/status`, { durum }).catch(() => {});
    fetchInvoices();
  };

  const handleSendEFatura = async (inv: Invoice) => {
    try {
      const res = await api.post(`/api/tenant/invoices/${inv.id}/e-fatura`, { ebelge_tip: 'E_ARSIV' });
      alert(`e-Arşiv gönderildi!\nETTN: ${res.data.ettn}`);
      fetchInvoices();
    } catch { alert('e-Fatura gönderimi başarısız'); }
  };

  const handlePDF = async (inv: Invoice) => {
    try {
      const res = await api.get(`/api/tenant/invoices/${inv.id}/pdf`, {
        params: { include_logo: true, include_qr: true }, responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `${inv.fatura_no}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('PDF oluşturulamadı'); }
  };

  const dc = (d: string) => durumConfig[d] ?? durumConfig.taslak;
  const odc = (d: string) => odemeDurumConfig[d] ?? odemeDurumConfig.bekleyen;
  const ec = (d: string) => ebelgeConfig[d] ?? ebelgeConfig.YOK;

  // Filter by search locally (DataGrid handles sorting/pagination internally)
  const filtered = search
    ? invoices.filter((inv) => {
        const s = search.toLowerCase();
        return (
          (inv.fatura_no || '').toLowerCase().includes(s) ||
          (inv.musteri || '').toLowerCase().includes(s)
        );
      })
    : invoices;

  // ============================================================
  // COLUMNS - same pattern as TrucksPage/TripsPage/CustomersPage
  // ============================================================
  const invoiceColumns: Column<Invoice>[] = [
    {
      key: 'fatura_no',
      header: 'Fatura No',
      sortable: true,
      render: (inv) => {
        const isOverdue = inv.odeme_durumu === 'vadesi_gecti' || inv.odeme_durumu === 'gecikti';
        return (
          <span className={`text-sm font-medium ${isOverdue ? 'text-[#DC2626]' : 'text-enterprise-text'}`}>
            {isOverdue && <AlertTriangle size={14} className="inline mr-1 text-[#DC2626]" />}
            {inv.fatura_no}
          </span>
        );
      },
      exportRender: (inv) => inv.fatura_no,
    },
    {
      key: 'musteri',
      header: 'Müşteri',
      sortable: true,
      exportRender: (inv) => inv.musteri || '',
    },
    {
      key: 'tarih',
      header: 'Tarih',
      sortable: true,
      exportRender: (inv) => inv.tarih || '',
    },
    {
      key: 'vade',
      header: 'Vade',
      sortable: true,
      render: (inv) => {
        const isOverdue = inv.odeme_durumu === 'vadesi_gecti' || inv.odeme_durumu === 'gecikti';
        return (
          <span className={`text-sm ${isOverdue ? 'text-[#DC2626] font-medium' : 'text-enterprise-text-muted'}`}>
            {inv.vade || '-'}
          </span>
        );
      },
      exportRender: (inv) => inv.vade || '',
    },
    {
      key: 'genel_toplam',
      header: 'Tutar',
      sortable: true,
      align: 'right' as const,
      render: (inv) => (
        <span className="text-sm text-enterprise-text font-semibold">
          ₺{(inv.genel_toplam ?? 0).toLocaleString('tr-TR')}
        </span>
      ),
      exportRender: (inv) => `₺${(inv.genel_toplam ?? 0).toLocaleString('tr-TR')}`,
    },
    {
      key: 'kalan',
      header: 'Kalan',
      sortable: true,
      align: 'right' as const,
      render: (inv) => {
        const k = inv.kalan ?? 0;
        if (k <= 0) return <span className="text-sm text-gray-400">—</span>;
        return <span className="text-sm font-medium text-[#DC2626]">₺{k.toLocaleString('tr-TR')}</span>;
      },
      exportRender: (inv) => inv.kalan ? `₺${inv.kalan.toLocaleString('tr-TR')}` : '0',
    },
    {
      key: 'durum',
      header: 'Durum',
      sortable: true,
      align: 'center' as const,
      render: (inv) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${dc(inv.durum || '').bg} ${dc(inv.durum || '').text} border-current/30`}>
          {dc(inv.durum || '').label}
        </span>
      ),
      exportRender: (inv) => dc(inv.durum || '').label,
    },
    {
      key: 'odeme_durumu',
      header: 'Ödeme',
      sortable: true,
      align: 'center' as const,
      render: (inv) => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${odc(inv.odeme_durumu || '').bg} ${odc(inv.odeme_durumu || '').text} border-current/30`}>
          {odc(inv.odeme_durumu || '').label}
        </span>
      ),
      exportRender: (inv) => odc(inv.odeme_durumu || '').label,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar — same pattern as TrucksPage */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fatura no veya müşteri ara..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-white border border-enterprise-border text-enterprise-text placeholder-[#52525B] text-sm outline-none focus:border-[#FF5F03] focus:ring-1 focus:ring-[#FF5F03]/30 transition-all"
          />
        </div>
        <button
          onClick={() => { setEditInvoice(null); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white font-medium text-sm transition-all duration-150 flex-shrink-0"
        >
          <Plus size={18} />
          Yeni Fatura
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={16} /></button>
        </div>
      )}

      <DataGrid
        columns={invoiceColumns}
        data={filtered}
        loading={loading}
        title="Faturalar"
        pageSizeOptions={[100, 200, 300]}
        onEdit={handleEdit}
        onDelete={(inv) => {
          api.delete(`/api/tenant/invoices/${inv.id}`).catch(() => {});
          setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
        }}
        onBulkDelete={(ids) => {
          ids.forEach((id) => api.delete(`/api/tenant/invoices/${id}`).catch(() => {}));
          setInvoices((prev) => prev.filter((i) => !ids.includes(String(i.id))));
        }}
        onRowClick={(inv) => { setSelectedInvoice(inv); setShowDetail(true); }}
        emptyIcon={<FileText size={48} className="text-gray-300" />}
        emptyText={search ? 'Aramanızla eşleşen fatura bulunamadı' : 'Henüz fatura kaydı yok'}
      />

      {/* Modals */}
      {showCreate && (
        <InvoiceFormModal
          invoice={editInvoice}
          onClose={() => { setShowCreate(false); setEditInvoice(null); }}
          onSaved={() => { setShowCreate(false); setEditInvoice(null); fetchInvoices(); }}
        />
      )}
      {showDetail && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => { setShowDetail(false); setSelectedInvoice(null); }}
        />
      )}
      {showPayment && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => { setShowPayment(false); setSelectedInvoice(null); }}
          onPaid={() => { setShowPayment(false); fetchInvoices(); }}
        />
      )}
    </div>
  );
}
function InvoiceFormModal({ invoice, onClose, onSaved }: {
  invoice: Invoice | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<InvoiceCreatePayload>({
    customer_id: invoice?.customer_id ?? 0,
    musteri: invoice?.musteri ?? '',
    tarih: invoice?.tarih ?? new Date().toISOString().split('T')[0],
    vade: invoice?.vade ?? new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
    para_birimi: invoice?.para_birimi ?? 'TRY',
    kur: invoice?.kur ?? 1,
    iskonto_oran: invoice?.iskonto_oran ?? 0,
    iskonto_tutar: invoice?.iskonto_tutar ?? 0,
    tevkifat: invoice?.tevkifat ?? 0,
    items: (invoice?.items ?? []).map((it, i) => ({
      sira: i + 1,
      urun_adi: it.urun_adi,
      aciklama: it.aciklama ?? '',
      miktar: it.miktar,
      birim: it.birim,
      birim_fiyat: it.birim_fiyat,
      kdv_oran: it.kdv_oran,
      iskonto_oran: it.iskonto_oran,
      iskonto_tutar: it.iskonto_tutar,
    })),
    notlar: invoice?.notlar ?? '',
    tip: invoice?.tip ?? 'SATIS',
  });
  const [rates, setRates] = useState<TCMBKur[]>([]);
  const [customers, setCustomers] = useState<{ id: number; firma_unvani: string }[]>([]);
  const [customerSearch, setCustomerSearch] = useState(invoice?.musteri ?? '');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    api.get('/api/tenant/invoices/tcbm-rates').then(r => setRates(r.data)).catch(() => {});
    api.get('/api/tenant/customers').then(r => {
      setCustomers(Array.isArray(r.data) ? r.data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.para_birimi !== 'TRY' && form.kur === 1) {
      const rate = rates.find(r => r.currency === form.para_birimi);
      if (rate) setForm(f => ({ ...f, kur: rate.rate }));
    }
  }, [form.para_birimi, rates]);

  const addItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { sira: f.items.length+1, urun_adi: '', aciklama: '', miktar: 1, birim: 'ADET', birim_fiyat: 0, kdv_oran: 20, iskonto_oran: 0, iskonto_tutar: 0 }],
    }));
  };

  const removeItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sira: i+1 })) }));
  };

  const updateItem = (idx: number, field: keyof InvoiceItemCreatePayload, value: string | number) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  };

  const calcTotals = () => {
    let ara = 0, kdv = 0;
    form.items.forEach(it => {
      const tutar = (it.miktar||0) * (it.birim_fiyat||0);
      const isk = it.iskonto_oran > 0 ? tutar * it.iskonto_oran / 100 : (it.iskonto_tutar||0);
      const sonTutar = tutar - isk;
      ara += sonTutar;
      kdv += sonTutar * (it.kdv_oran||20) / 100;
    });
    const isk = form.iskonto_oran > 0 ? ara * form.iskonto_oran / 100 : (form.iskonto_tutar||0);
    const finalAra = ara - isk;
    const genel = finalAra + kdv - (form.tevkifat||0);
    return { ara_toplam: finalAra, kdv, genel_toplam: genel };
  };

  const totals = calcTotals();

  const handleSubmit = async () => {
    try {
      if (invoice) {
        await api.put(`/api/tenant/invoices/${invoice.id}`, {
          ...form,
          items: form.items,
        } as InvoiceUpdatePayload);
      } else {
        await api.post('/api/tenant/invoices', form);
      }
      onSaved();
    } catch {
      alert('Kaydetme başarısız');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-enterprise-border w-full max-w-3xl my-8">
        <div className="p-6 border-b border-enterprise-border flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold">{invoice ? 'Faturayı Düzenle' : 'Yeni Fatura'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri</label>
              <input
                type="text"
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value);
                  setForm(f => ({ ...f, musteri: e.target.value }));
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm"
                placeholder="Müşteri ara veya seç..."
              />
              {showCustomerDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-enterprise-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customers
                    .filter(c => !customerSearch || c.firma_unvani.toLowerCase().includes(customerSearch.toLowerCase()))
                    .slice(0, 20)
                    .map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setForm(f => ({ ...f, customer_id: c.id, musteri: c.firma_unvani }));
                          setCustomerSearch(c.firma_unvani);
                          setShowCustomerDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                          form.customer_id === c.id ? 'bg-[#FF5F03]/10 text-[#FF5F03] font-medium' : 'text-enterprise-text'
                        }`}
                      >
                        {c.firma_unvani}
                      </button>
                    ))}
                  {customers.filter(c => !customerSearch || c.firma_unvani.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400">Müşteri bulunamadı. İsimle devam edilecek.</div>
                  )}
                </div>
              )}
              {form.customer_id > 0 && (
                <p className="text-xs text-green-600 mt-0.5">Seçili: ID #{form.customer_id}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tarih</label>
                <input type="date" value={form.tarih} onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vade</label>
                <input type="date" value={form.vade} onChange={e => setForm(f => ({ ...f, vade: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Para Birimi</label>
              <select value={form.para_birimi} onChange={e => setForm(f => ({ ...f, para_birimi: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm">
                {PARABIRIMLERI.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kur</label>
              <input type="number" step="0.0001" value={form.kur} onChange={e => setForm(f => ({ ...f, kur: +e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">İskonto %</label>
              <input type="number" step="0.01" value={form.iskonto_oran} onChange={e => setForm(f => ({ ...f, iskonto_oran: +e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tevkifat</label>
              <input type="number" step="0.01" value={form.tevkifat} onChange={e => setForm(f => ({ ...f, tevkifat: +e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Kalemler</h3>
              <button onClick={addItem} className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200">+ Kalem Ekle</button>
            </div>
            <div className="space-y-2">
              {form.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1 items-center p-2 rounded-lg border border-gray-100 bg-gray-50/50">
                  <input type="text" value={it.urun_adi} onChange={e => updateItem(idx, 'urun_adi', e.target.value)}
                    className="col-span-3 px-2 py-1.5 rounded border border-gray-200 text-xs" placeholder="Ürün adı" />
                  <input type="number" step="0.01" value={it.miktar} onChange={e => updateItem(idx, 'miktar', +e.target.value)}
                    className="col-span-1 px-2 py-1.5 rounded border border-gray-200 text-xs text-center" />
                  <select value={it.birim} onChange={e => updateItem(idx, 'birim', e.target.value)}
                    className="col-span-1 px-1 py-1.5 rounded border border-gray-200 text-xs">
                    {['ADET', 'KG', 'LT', 'MT', 'SAAT', 'GUN', 'SEFER'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input type="number" step="0.01" value={it.birim_fiyat} onChange={e => updateItem(idx, 'birim_fiyat', +e.target.value)}
                    className="col-span-2 px-2 py-1.5 rounded border border-gray-200 text-xs" placeholder="Birim fiyat" />
                  <select value={it.kdv_oran} onChange={e => updateItem(idx, 'kdv_oran', +e.target.value)}
                    className="col-span-1 px-1 py-1.5 rounded border border-gray-200 text-xs">
                    {KDV_ORANLARI.map(k => <option key={k} value={k}>%{k}</option>)}
                  </select>
                  <input type="number" step="0.01" value={it.iskonto_oran} onChange={e => updateItem(idx, 'iskonto_oran', +e.target.value)}
                    className="col-span-1 px-2 py-1.5 rounded border border-gray-200 text-xs" placeholder="İsk%"/>
                  <span className="col-span-2 text-xs font-medium text-right">
                    ₺{itemTutar(it).toLocaleString('tr-TR')}
                  </span>
                  <button onClick={() => removeItem(idx)} className="col-span-1 p-1 rounded hover:bg-red-100 text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 flex justify-end gap-8 text-sm">
            <div className="text-right space-y-1">
              <p className="text-gray-500">Ara Toplam: <span className="font-medium text-gray-700">₺{totals.ara_toplam.toLocaleString('tr-TR')}</span></p>
              <p className="text-gray-500">KDV: <span className="font-medium text-gray-700">₺{totals.kdv.toLocaleString('tr-TR')}</span></p>
              <p className="text-lg font-bold text-[#FF5F03]">Genel Toplam: ₺{totals.genel_toplam.toLocaleString('tr-TR')}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notlar</label>
            <textarea value={form.notlar} onChange={e => setForm(f => ({ ...f, notlar: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" rows={2} />
          </div>
        </div>
        <div className="p-4 border-t border-enterprise-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-enterprise-border text-sm hover:bg-gray-50">İptal</button>
          <button onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-[#FF5F03] hover:bg-[#E55600] text-white text-sm font-medium">
            {invoice ? 'Güncelle' : 'Fatura Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAYMENT MODAL
// ============================================================
function PaymentModal({ invoice, onClose, onPaid }: { invoice: Invoice; onClose: () => void; onPaid: () => void }) {
  const [tutar, setTutar] = useState(invoice.kalan);
  const [yontem, setYontem] = useState('havale');
  const [refNo, setRefNo] = useState('');

  const handleSubmit = async () => {
    try {
      await api.post(`/api/tenant/invoices/${invoice.id}/payments`, {
        tutar, yontem, referans_no: refNo, tarih: new Date().toISOString(), aciklama: '',
      } as PaymentCreatePayload);
      onPaid();
    } catch {
      alert('Ödeme kaydedilemedi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-enterprise-border w-full max-w-sm p-6">
        <h3 className="font-semibold text-lg mb-1">Ödeme Ekle</h3>
        <p className="text-sm text-gray-500 mb-4">{invoice.fatura_no} - Kalan: ₺{invoice.kalan.toLocaleString('tr-TR')}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tutar</label>
            <input type="number" step="0.01" value={tutar} onChange={e => setTutar(+e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Yöntem</label>
            <select value={yontem} onChange={e => setYontem(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm">
              {YONTEMLER.map(y => <option key={y} value={y}>{y.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Referans No</label>
            <input type="text" value={refNo} onChange={e => setRefNo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-enterprise-border text-sm" placeholder="Dekont no, çek no..." />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-enterprise-border text-sm">İptal</button>
          <button onClick={handleSubmit} className="flex-1 py-2 rounded-lg bg-[#FF5F03] text-white text-sm font-medium">Ödemeyi Kaydet</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INVOICE DETAIL MODAL
// ============================================================
function InvoiceDetailModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-enterprise-border w-full max-w-2xl my-8">
        <div className="p-6 border-b border-enterprise-border flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold">{invoice.fatura_no}</h2>
            <p className="text-sm text-gray-500">{invoice.musteri}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Tarih:</span> {invoice.tarih}</div>
            <div><span className="text-gray-500">Vade:</span> {invoice.vade}</div>
            <div><span className="text-gray-500">Para:</span> {invoice.para_birimi} (Kur: {invoice.kur})</div>
            <div><span className="text-gray-500">E-Belge:</span> {invoice.ebelge_tip} / {invoice.ebelge_durum}</div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="py-2">Ürün/Hizmet</th>
                <th className="py-2 text-center">Miktar</th>
                <th className="py-2 text-right">Birim Fiyat</th>
                <th className="py-2 text-center">KDV%</th>
                <th className="py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map(it => (
                <tr key={it.id} className="border-b border-gray-50">
                  <td className="py-2">{it.urun_adi}</td>
                  <td className="py-2 text-center">{it.miktar} {it.birim}</td>
                  <td className="py-2 text-right">₺{it.birim_fiyat.toLocaleString('tr-TR')}</td>
                  <td className="py-2 text-center">%{it.kdv_oran}</td>
                  <td className="py-2 text-right">₺{(it.tutar || 0).toLocaleString('tr-TR')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end gap-8 text-sm border-t pt-3">
            <div className="text-right space-y-1">
              <p className="text-gray-500">Ara Toplam: ₺{(invoice.ara_toplam || 0).toLocaleString('tr-TR')}</p>
              <p className="text-gray-500">KDV: ₺{(invoice.kdv || 0).toLocaleString('tr-TR')}</p>
              <p className="font-bold">Genel Toplam: ₺{(invoice.genel_toplam || 0).toLocaleString('tr-TR')}</p>
              <p className="text-gray-500">Ödenen: ₺{(invoice.toplam_odenen || 0).toLocaleString('tr-TR')}</p>
              <p className="font-bold text-red-600">Kalan: ₺{(invoice.kalan || 0).toLocaleString('tr-TR')}</p>
            </div>
          </div>

          {/* Payments */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Ödemeler</h3>
              <div className="space-y-1">
                {invoice.payments.map(p => (
                  <div key={p.id} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                    <span>{p.yontem.toUpperCase()} {p.referans_no && `(#${p.referans_no})`}</span>
                    <span>{p.tarih?.split('T')[0]}</span>
                    <span className="font-medium">₺{p.tutar.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AGING REPORT VIEW
// ============================================================
function AgingView() {
  const [data, setData] = useState<AgingReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AgingReportRow[]>('/api/tenant/invoices/aging')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  const totals = data.reduce((acc, r) => ({
    vadesi_gecmemis: acc.vadesi_gecmemis + r.vadesi_gecmemis,
    gun_1_30: acc.gun_1_30 + r.gun_1_30,
    gun_31_60: acc.gun_31_60 + r.gun_31_60,
    gun_61_90: acc.gun_61_90 + r.gun_61_90,
    gun_90_ustu: acc.gun_90_ustu + r.gun_90_ustu,
    toplam: acc.toplam + r.toplam,
  }), { vadesi_gecmemis: 0, gun_1_30: 0, gun_31_60: 0, gun_61_90: 0, gun_90_ustu: 0, toplam: 0 });

  return (
    <div className="bg-white border border-enterprise-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-600">
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3 text-right">Vadesi Geçmemiş</th>
              <th className="px-4 py-3 text-right">1-30 Gün</th>
              <th className="px-4 py-3 text-right">31-60 Gün</th>
              <th className="px-4 py-3 text-right">61-90 Gün</th>
              <th className="px-4 py-3 text-right">90+ Gün</th>
              <th className="px-4 py-3 text-right font-bold">Toplam</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{row.musteri}</td>
                <td className="px-4 py-2 text-right">₺{row.vadesi_gecmemis.toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2 text-right">₺{row.gun_1_30.toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2 text-right">₺{row.gun_31_60.toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2 text-right">₺{row.gun_61_90.toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2 text-right text-red-600">₺{row.gun_90_ustu.toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2 text-right font-bold">₺{row.toplam.toLocaleString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold text-sm">
              <td className="px-4 py-3">TOPLAM</td>
              <td className="px-4 py-3 text-right">₺{totals.vadesi_gecmemis.toLocaleString('tr-TR')}</td>
              <td className="px-4 py-3 text-right">₺{totals.gun_1_30.toLocaleString('tr-TR')}</td>
              <td className="px-4 py-3 text-right">₺{totals.gun_31_60.toLocaleString('tr-TR')}</td>
              <td className="px-4 py-3 text-right">₺{totals.gun_61_90.toLocaleString('tr-TR')}</td>
              <td className="px-4 py-3 text-right text-red-600">₺{totals.gun_90_ustu.toLocaleString('tr-TR')}</td>
              <td className="px-4 py-3 text-right">₺{totals.toplam.toLocaleString('tr-TR')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// RECURRENCES VIEW
// ============================================================
function RecurrencesView() {
  const [records, setRecords] = useState<InvoiceRecurrenceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecurrences = () => {
    setLoading(true);
    api.get<InvoiceRecurrenceRecord[]>('/api/tenant/invoices/recurrences')
      .then(r => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecurrences(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Silinsin mi?')) return;
    await api.delete(`/api/tenant/invoices/recurrences/${id}`);
    fetchRecurrences();
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Yükleniyor...</div>;

  return (
    <div className="space-y-3">
      {records.length === 0 ? (
        <div className="bg-white border border-enterprise-border rounded-xl p-10 text-center text-gray-400">
          <Clock size={48} className="mx-auto mb-3" />
          <p className="text-sm">Henüz tekrarlayan fatura tanımlanmadı</p>
        </div>
      ) : records.map(rec => (
        <div key={rec.id} className="bg-white border border-enterprise-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{rec.musteri}</p>
            <p className="text-sm text-gray-500">
              {rec.frekans} | Sonraki: {rec.sonraki_tarih}
              {rec.bitis_tarihi && <> | Bitiş: {rec.bitis_tarihi}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rec.aktif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {rec.aktif ? 'Aktif' : 'Pasif'}
            </span>
            <button onClick={() => handleDelete(rec.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// CREDIT NOTE HELPER
// ============================================================
async function handleCreditNote(invoice: Invoice, onDone: () => void) {
  if (!confirm(`${invoice.fatura_no} için iade faturası oluşturulsun mu?`)) return;
  try {
    await api.post(`/api/tenant/invoices/${invoice.id}/credit-note`);
    alert('İade faturası oluşturuldu');
    onDone();
  } catch {
    alert('İade faturası oluşturulamadı');
  }
}
