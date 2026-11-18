import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BankTransaction } from '../types';

export function formatINR(amount: number, includeDecimals = true): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function truncateHash(hash: string, prefixLen = 10, suffixLen = 8): string {
  if (!hash) return '';
  if (hash.length <= prefixLen + suffixLen + 3) return hash;
  return `${hash.slice(0, prefixLen)}...${hash.slice(-suffixLen)}`;
}

export function exportTransactionsPdf(
  transactions: BankTransaction[],
  customerName: string,
  subtitle = 'Demo Account Statement'
): void {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, 297, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('BLOCKBANK', 14, 13);
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208);
  doc.text(`${subtitle} — Simulated Test Ledger`, 14, 20);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`Account Holder: ${customerName}`, 14, 35);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 41);
  doc.text(`Total Records: ${transactions.length}`, 220, 35);

  const rows = transactions.map((t) => [
    t.id,
    formatDateTime(t.createdAt),
    t.type,
    t.receiverName,
    t.description.slice(0, 42),
    `INR ${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    t.status,
    `#${t.blockNumber} (${truncateHash(t.transactionHash, 8, 6)})`,
  ]);

  autoTable(doc, {
    startY: 47,
    head: [
      [
        'Transaction ID',
        'Date & Time',
        'Type',
        'Counterparty',
        'Description',
        'Amount',
        'Status',
        'Audit Block',
      ],
    ],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [10, 22, 40], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [244, 246, 249] },
  });

  doc.save(`BLOCKBANK_Statement_${Date.now()}.pdf`);
}

export function exportGenericReportPdf(params: {
  title: string;
  subtitle: string;
  columns: string[];
  rows: (string | number)[][];
  filename: string;
}): void {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, 297, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`BLOCKBANK · ${params.title}`, 14, 13);
  doc.setFontSize(9);
  doc.setTextColor(167, 243, 208);
  doc.text(params.subtitle, 14, 20);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Generated At: ${new Date().toLocaleString('en-IN')}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [params.columns],
    body: params.rows.map((r) => r.map(String)),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [244, 246, 249] },
  });

  doc.save(params.filename);
}
