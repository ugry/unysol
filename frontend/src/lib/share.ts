export type ShareChannel = 'email' | 'whatsapp' | 'clipboard';

interface ShareOptions {
  channel: ShareChannel;
  subject?: string;
  body: string;
  onSuccess?: () => void;
  onError?: (err: string) => void;
}

export function shareVia(options: ShareOptions) {
  const { channel, subject, body, onSuccess, onError } = options;

  switch (channel) {
    case 'email':
      shareViaEmail(subject || '', body);
      onSuccess?.();
      break;
    case 'whatsapp':
      shareViaWhatsApp(body);
      onSuccess?.();
      break;
    case 'clipboard':
      shareViaClipboard(body).then(
        () => onSuccess?.(),
        () => onError?.('Panoya kopyalanamadı.')
      );
      break;
  }
}

function shareViaEmail(subject: string, body: string) {
  window.open(
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    '_blank'
  );
}

function shareViaWhatsApp(body: string) {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(body)}`,
    '_blank'
  );
}

async function shareViaClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function buildShareBody(
  title: string,
  records: Record<string, unknown>[],
  columns: { key: string; header: string; render?: (row: Record<string, unknown>) => string }[]
): string {
  const lines: string[] = [`${title}\n`];
  for (const record of records) {
    const parts = columns.map((col) => {
      const value = col.render ? col.render(record) : String(record[col.key] ?? '');
      return `${col.header}: ${value}`;
    });
    lines.push(parts.join(' | '));
  }
  return lines.join('\n');
}
