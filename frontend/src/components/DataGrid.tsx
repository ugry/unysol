import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  Send,
  Mail,
  Copy,
  Check,
  Square,
  CheckSquare,
  MinusSquare,
  AlertTriangle,
  X,
} from 'lucide-react';
import { exportData, type ExportFormat } from '@/lib/export';
import { shareVia, buildShareBody } from '@/lib/share';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  exportRender?: (row: T) => string;
  hidden?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  title?: string;
  loading?: boolean;
  error?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  pageSizeOptions?: number[];
  accentColor?: string;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
}

const PAGE_SIZE_OPTIONS = [50, 100, 200];

export default function DataGrid<T>({
  columns,
  data,
  keyField = 'id',
  title = 'Veri',
  loading = false,
  error = '',
  onEdit,
  onDelete,
  onBulkDelete,
  onRowClick,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  accentColor = '#FF5F03',
  emptyIcon,
  emptyText = 'Henüz kayıt bulunmuyor',
}: DataGridProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSizeOptions[0] || 50);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showBulkShare, setShowBulkShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<string[] | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const bulkShareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
      if (bulkShareRef.current && !bulkShareRef.current.contains(e.target as Node)) {
        setShowBulkShare(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const visibleColumns = columns.filter((c) => !c.hidden);

  // Sort
  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = (a as any)[sortKey] ?? '';
    const bVal = (b as any)[sortKey] ?? '';
    const cmp = String(aVal).localeCompare(String(bVal), 'tr', { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const pageData = sorted.slice(startIdx, startIdx + perPage);

  // Selection
  const pageIds = new Set(pageData.map((r) => String((r as any)[keyField])));
  const selectedOnPage = [...selected].filter((id) => pageIds.has(id));

  const allOnPageSelected = pageData.length > 0 && selectedOnPage.length === pageData.length;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleExport = (format: ExportFormat) => {
    const exportDataItems = selected.size > 0
      ? data.filter((r) => selected.has(String((r as any)[keyField])))
      : data;
    exportData({
      filename: title.toLowerCase().replace(/\s+/g, '_'),
      format,
      title,
      data: exportDataItems as Record<string, unknown>[],
      columns: visibleColumns.map((c) => ({
        key: c.key,
        header: c.header,
        render: c.exportRender
          ? (row: Record<string, unknown>) => c.exportRender!(row as T)
          : undefined,
      })),
    });
    setShowExport(false);
  };

  const handleShare = (channel: 'email' | 'whatsapp' | 'clipboard', rows: T[]) => {
    if (channel === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    const body = buildShareBody(
      title,
      rows as Record<string, unknown>[],
      visibleColumns.map((c) => ({
        key: c.key,
        header: c.header,
        render: c.exportRender
          ? (row: Record<string, unknown>) => c.exportRender!(row as T)
          : undefined,
      }))
    );
    shareVia({
      channel,
      subject: title,
      body,
    });
    setShowShare(false);
    setShowBulkShare(false);
  };

  const exportFormats: { format: ExportFormat; label: string }[] = [
    { format: 'csv', label: 'CSV' },
    { format: 'xlsx', label: 'Excel' },
    { format: 'pdf', label: 'PDF' },
  ];

  const selectedRows = data.filter((r) => selected.has(String((r as any)[keyField])));

  // Pagination pages to show
  const renderPageButtons = () => {
    const buttons: React.ReactNode[] = [];
    const range = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - range && i <= safePage + range)) {
        buttons.push(
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
              i === safePage
                ? 'text-white'
                : 'text-enterprise-text-muted hover:text-enterprise-text hover:bg-gray-100'
            }`}
            style={i === safePage ? { backgroundColor: accentColor } : undefined}
          >
            {i}
          </button>
        );
      } else if (
        (i === safePage - range - 1 && i > 1) ||
        (i === safePage + range + 1 && i < totalPages)
      ) {
        buttons.push(
          <span key={`dots-${i}`} className="text-gray-400 text-xs px-1">
            ...
          </span>
        );
      }
    }
    return buttons;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-enterprise-border border-t-[#FF5F03] animate-spin" />
          <span className="text-sm text-enterprise-text-muted">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-sm flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-[#DC2626]/30 flex items-center justify-center text-[10px] font-bold">!</span>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {/* Selection count */}
          {selected.size > 0 && (
            <span className="text-xs text-enterprise-text-muted mr-2">
              {selected.size} seçili
            </span>
          )}

          {/* Edit selected (single selection only) */}
          {onEdit && selected.size === 1 && (
            <button
              onClick={() => {
                const selRow = data.find((r) => selected.has(String((r as any)[keyField])));
                if (selRow) onEdit(selRow);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-enterprise-text bg-white border border-enterprise-border hover:bg-gray-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Düzenle
            </button>
          )}

          {/* Share selected */}
          {selected.size > 0 && (
            <div className="relative" ref={bulkShareRef}>
              <button
                onClick={() => setShowBulkShare(!showBulkShare)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-enterprise-text bg-white border border-enterprise-border hover:bg-gray-50 transition-colors"
              >
                <Share2 size={13} />
                Paylaş
              </button>
              {showBulkShare && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-enterprise-border rounded-lg shadow-xl py-1 min-w-[160px] z-30">
                  {[
                    { channel: 'email' as const, icon: Mail, label: 'E-posta ile Gönder' },
                    { channel: 'whatsapp' as const, icon: Send, label: 'WhatsApp ile Gönder' },
                    { channel: 'clipboard' as const, icon: copied ? Check : Copy, label: copied ? 'Kopyalandı' : 'Panoya Kopyala' },
                  ].map(({ channel, icon: Icon, label }) => (
                    <button
                      key={channel}
                      onClick={() => handleShare(channel, selectedRows)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-enterprise-text hover:bg-gray-100 transition-colors text-left"
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delete selected — single row only, no bulk delete */}
          {selected.size === 1 && onDelete && (
            <button
              onClick={() => {
                const selRow = data.find((r) => selected.has(String((r as any)[keyField])));
                if (selRow) setConfirmDelete(selRow);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#DC2626] bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Sil
            </button>
          )}

          {/* Export */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport(!showExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-enterprise-text bg-white border border-enterprise-border hover:bg-gray-50 transition-colors"
            >
              <Download size={13} />
              Dışa Aktar
              <ChevronDown size={12} />
            </button>
            {showExport && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-enterprise-border rounded-lg shadow-xl py-1 min-w-[140px] z-30">
                {exportFormats.map(({ format, label }) => (
                  <button
                    key={format}
                    onClick={() => handleExport(format)}
                    className="w-full text-left px-3 py-2 text-sm text-enterprise-text hover:bg-gray-100 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Per-page selector + row count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {data.length} kayıt
          </span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1.5 rounded-md bg-white border border-enterprise-border text-xs text-enterprise-text outline-none focus:border-[#FF5F03] transition-colors cursor-pointer"
            style={{ outlineColor: accentColor }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size} / sayfa</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-enterprise-text-muted gap-3 bg-white border border-enterprise-border rounded-xl">
          {emptyIcon || (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#2a2a2a]">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          )}
          <p className="text-sm">{emptyText}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-enterprise-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-enterprise-border">
                    <th className="w-10 px-3 py-3">
                      <button
                        onClick={toggleAllOnPage}
                        className="text-gray-400 hover:text-enterprise-text transition-colors"
                      >
                        {allOnPageSelected ? (
                          <CheckSquare size={16} />
                        ) : someOnPageSelected ? (
                          <MinusSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable !== false && handleSort(col.key)}
                        className={`text-xs font-medium text-enterprise-text-muted uppercase tracking-wider px-4 py-3 whitespace-nowrap ${
                          col.sortable !== false ? 'cursor-pointer hover:text-enterprise-text select-none' : ''
                        } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                        style={col.width ? { width: col.width } : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.header}
                          {sortKey === col.key && (
                            sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {pageData.map((row) => {
                    const id = String((row as any)[keyField]);
                    const isSel = selected.has(id);
                    return (
                      <tr
                        key={id}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          onRowClick?.(row);
                        }}
                        className={`hover:bg-gray-100 transition-colors ${
                          isSel ? 'bg-white/[0.02]' : ''
                        } ${onRowClick ? 'cursor-pointer' : ''}`}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleOne(id)}
                            className="text-gray-400 hover:text-enterprise-text transition-colors"
                          >
                            {isSel ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        {visibleColumns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 whitespace-nowrap ${
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {col.render
                              ? col.render(row)
                              : <span className="text-sm text-enterprise-text">{String((row as any)[col.key] ?? '-')}</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {pageData.map((row) => {
              const id = String((row as any)[keyField]);
              const isSel = selected.has(id);
              const displayCols = visibleColumns.slice(0, 3);
              return (
                <div
                  key={id}
                  className={`bg-white border border-enterprise-border rounded-xl overflow-hidden ${
                    isSel ? 'ring-1' : ''
                  }`}
                  style={isSel ? { borderColor: accentColor } : undefined}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleOne(id); }}
                          className="text-gray-400 hover:text-enterprise-text transition-colors"
                        >
                          {isSel ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                        {displayCols.slice(0, 1).map((col) => (
                          <span key={col.key} className="text-sm font-semibold text-enterprise-text">
                            {col.render ? col.render(row) : String((row as any)[col.key] ?? '-')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {displayCols.slice(1).map((col) => (
                        <div key={col.key} className="flex justify-between text-xs">
                          <span className="text-gray-400">{col.header}</span>
                          <span className="text-enterprise-text">
                            {col.render ? col.render(row) : String((row as any)[col.key] ?? '-')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">
                {startIdx + 1}–{Math.min(startIdx + perPage, data.length)} / {data.length}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage === 1}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-enterprise-text-muted hover:text-enterprise-text hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                {renderPageButtons()}
                <button
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage === totalPages}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-enterprise-text-muted hover:text-enterprise-text hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Single Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-enterprise-text">Silme Onayı</h3>
                <p className="text-sm text-enterprise-text-secondary mt-0.5">Bu işlem geri alınamaz. Silmek istediğinize emin misiniz?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-lg border border-enterprise-border-subtle text-enterprise-text-secondary hover:text-enterprise-text hover:border-gray-300 font-medium text-sm transition-all"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (confirmDelete && onDelete) {
                    onDelete(confirmDelete);
                  }
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#DC2626]/10 hover:bg-[#DC2626]/20 border border-[#DC2626]/20 text-[#DC2626] font-medium text-sm transition-all"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-enterprise-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-enterprise-text">Toplu Silme Onayı</h3>
                <p className="text-sm text-enterprise-text-secondary mt-0.5">
                  {confirmBulkDelete.length} öğe silinecek. Bu işlem geri alınamaz. Emin misiniz?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmBulkDelete(null); }}
                className="flex-1 py-2.5 rounded-lg border border-enterprise-border-subtle text-enterprise-text-secondary hover:text-enterprise-text hover:border-gray-300 font-medium text-sm transition-all"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (confirmBulkDelete && onBulkDelete) {
                    onBulkDelete(confirmBulkDelete);
                  }
                  setConfirmBulkDelete(null);
                  setSelected(new Set());
                }}
                className="flex-1 py-2.5 rounded-lg bg-[#DC2626]/10 hover:bg-[#DC2626]/20 border border-[#DC2626]/20 text-[#DC2626] font-medium text-sm transition-all"
              >
                {confirmBulkDelete.length} Öğeyi Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
