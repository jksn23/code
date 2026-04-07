import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatRp = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const downloadInvoicePdf = (invoice) => {
  if (!invoice) return;

  const doc = new jsPDF();
  const nominalMenang = Number(invoice.transaksi?.nominalMenang || 0);
  const nilaiLimit = Number(invoice.aset?.nilaiLimit || 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('INVOICE PEMBAYARAN LELANG', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`No. Invoice: ${invoice.invoiceNumber || '-'}`, 14, 26);
  doc.text(`Tanggal Terbit: ${formatDateTime(invoice.invoiceGeneratedAt)}`, 14, 32);
  doc.text(`Jatuh Tempo: ${formatDateTime(invoice.paymentDueDate)}`, 14, 38);

  autoTable(doc, {
    startY: 46,
    theme: 'grid',
    head: [['Informasi', 'Detail']],
    body: [
      ['Aset', invoice.aset?.nama || '-'],
      ['Kategori', invoice.aset?.kategori || '-'],
      ['Pemenang', invoice.pemenang?.nama || '-'],
      ['Email Pemenang', invoice.pemenang?.email || '-'],
      ['Penjual', invoice.penjual?.nama || '-'],
      ['Rekening Tujuan', `${invoice.penjual?.rekeningBank || '-'} / ${invoice.penjual?.nomorRekening || '-'}`],
      ['Status Pembayaran', invoice.statusPembayaran || '-'],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229] },
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    theme: 'grid',
    head: [['Rincian Tagihan', 'Nilai']],
    body: [
      ['Nilai Limit SPK', formatRp(nilaiLimit)],
      ['Harga Menang Lelang', formatRp(nominalMenang)],
      ['Total yang Harus Dibayar', formatRp(nominalMenang)],
    ],
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  const footerY = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(10);
  doc.text('Catatan:', 14, footerY);
  const notes = doc.splitTextToSize(
    invoice.catatanPembayaran ||
      'Harap unggah bukti pembayaran melalui sistem sebelum jatuh tempo. Admin akan memverifikasi pembayaran sebelum barang dikonfirmasi diterima.',
    180
  );
  doc.text(notes, 14, footerY + 6);

  doc.save(`invoice_lelang_${invoice.lelangId}.pdf`);
};
