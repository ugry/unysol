import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ColumnExport {
  key: string;
  header: string;
  render?: (row: Record<string, unknown>) => string;
}

interface ExportOptions {
  filename: string;
  format: ExportFormat;
  data: Record<string, unknown>[];
  columns: ColumnExport[];
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

function flattenRow(
  row: Record<string, unknown>,
  columns: ColumnExport[]
): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const col of columns) {
    flat[col.header] = col.render
      ? col.render(row)
      : String(row[col.key] ?? '');
  }
  return flat;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportData(options: ExportOptions) {
  const { filename, format, data, columns, title, orientation } = options;
  const rows = data.map((row) => flattenRow(row, columns));
  const headers = columns.map((c) => c.header);

  switch (format) {
    case 'csv':
      exportCSV(rows, headers, filename);
      break;
    case 'xlsx':
      exportXLSX(rows, headers, filename, title);
      break;
    case 'pdf':
      exportPDF(rows, headers, filename, title, orientation);
      break;
  }
}

function exportCSV(rows: Record<string, string>[], headers: string[], filename: string) {
  const csvRows = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h] ?? '';
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    });
    csvRows.push(values.join(','));
  }
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  downloadBlob(blob, `${filename}.csv`);
}

function exportXLSX(
  rows: Record<string, string>[],
  headers: string[],
  filename: string,
  title?: string
) {
  const sheetData = [headers];
  for (const row of rows) {
    sheetData.push(headers.map((h) => row[h] ?? ''));
  }
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  if (ws['!cols']) ws['!cols'] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  const sheetName = title?.slice(0, 31) || 'Sayfa1';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function exportPDF(
  rows: Record<string, string>[],
  headers: string[],
  filename: string,
  title?: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
) {
  const doc = new jsPDF({ orientation, unit: 'mm' });

  if (title) {
    doc.setFontSize(14);
    doc.text(title, 14, 15);
  }

  const body = rows.map((row) => headers.map((h) => row[h] ?? ''));

  autoTable(doc, {
    head: [headers],
    body,
    startY: title ? 22 : 14,
    margin: { horizontal: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left',
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [7, 44, 44],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [17, 24, 39],
    },
    alternateRowStyles: {
      fillColor: [237, 234, 222],
    },
    theme: 'striped',
  });

  doc.save(`${filename}.pdf`);
}
