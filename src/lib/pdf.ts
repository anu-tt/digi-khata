import jsPDF from 'jspdf';
import { KhataEntry, KhataParty, UserProfile } from '../types/khata';

export interface PDFExportOptions {
  profile: UserProfile;
  party: KhataParty;
  entries: KhataEntry[];
  startDate?: string;
  endDate?: string;
  filterType?: 'all' | 'credit' | 'debit';
}

export function generateKhataStatementPDF(options: PDFExportOptions): jsPDF {
  const { profile, party, entries, startDate, endDate, filterType = 'all' } = options;

  // Filter entries
  let filtered = entries.filter((e) => e.partyId === party.id);

  if (startDate) {
    filtered = filtered.filter((e) => e.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((e) => e.date <= endDate);
  }
  if (filterType === 'credit') {
    filtered = filtered.filter((e) => e.type === 'credit');
  } else if (filterType === 'debit') {
    filtered = filtered.filter((e) => e.type === 'debit');
  }

  // Sort chronological for statement calculation
  filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner - Clean Light Slate & Red Accent Theme
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TYTAN KHATABOOK STATEMENT', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TYTAN KHATABOOK — Official Digital Ledger', 14, 21);

  // Business / User Info (top right)
  const businessTitle = profile.businessName || profile.name;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(businessTitle, pageWidth - 14, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Mobile: ${profile.phone}`, pageWidth - 14, 19, { align: 'right' });
  if (profile.address) {
    doc.text(profile.address, pageWidth - 14, 25, { align: 'right' });
  }

  // Party & Statement Meta Info Box
  let yPos = 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const partyLabel = party.type === 'customer' ? 'Customer' : 'Supplier';
  doc.text(`${partyLabel}: ${party.name}`, 18, yPos + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Mobile: ${party.phone || 'N/A'}`, 18, yPos + 14);
  if (party.notes) {
    doc.text(`Notes: ${party.notes}`, 18, yPos + 20);
  }

  // Date range info (right side)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const dateRangeStr = startDate || endDate
    ? `${startDate || 'Start'} se ${endDate || 'Aaj Tak'}`
    : 'All Transactions (Khaate Ki Poori Entry)';
  doc.text(`Statement Period: ${dateRangeStr}`, pageWidth - 18, yPos + 7, { align: 'right' });
  doc.text(`Generated On: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 18, yPos + 14, { align: 'right' });

  yPos += 32;

  // Empty state check
  if (filtered.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('Is date range mein koi entry nahi hai.', pageWidth / 2, yPos + 20, { align: 'center' });
    return doc;
  }

  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(14, yPos, pageWidth - 28, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(14, yPos + 9, pageWidth - 14, yPos + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('Date', 18, yPos + 6);
  doc.text('Description / Vivran', 45, yPos + 6);
  doc.text(party.type === 'supplier' ? 'Jama Kiya (Credit)' : 'Jama (Credit)', 115, yPos + 6, { align: 'right' });
  doc.text(party.type === 'supplier' ? 'Udhar Saman (Debit)' : 'Udhaar (Debit)', 152, yPos + 6, { align: 'right' });
  doc.text('Balance', pageWidth - 18, yPos + 6, { align: 'right' });

  yPos += 13;

  let totalCredit = 0;
  let totalDebit = 0;
  let runningBalance = 0;

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];

    if (party.type === 'customer') {
      if (entry.type === 'credit') {
        totalCredit += entry.amount;
        runningBalance -= entry.amount;
      } else {
        totalDebit += entry.amount;
        runningBalance += entry.amount;
      }
    } else {
      // Supplier: credit is Udhar Saman Liya (increases debt), debit is Jama Kiya (decreases debt)
      if (entry.type === 'credit') {
        totalCredit += entry.amount;
        runningBalance += entry.amount;
      } else {
        totalDebit += entry.amount;
        runningBalance -= entry.amount;
      }
    }

    // Check page overflow
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    // Alternating background
    if (i % 2 === 1) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, yPos - 4, pageWidth - 28, 8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Date
    doc.text(entry.date, 18, yPos);

    // Description (truncate if long)
    const desc = entry.description.length > 35 ? entry.description.slice(0, 32) + '...' : entry.description || '-';
    doc.text(desc, 45, yPos);

    // Jama (Credit)
    if (entry.type === 'credit') {
      doc.setTextColor(5, 150, 105); // Green
      doc.text(`+ Rs. ${entry.amount.toFixed(2)}`, 115, yPos, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('-', 115, yPos, { align: 'right' });
    }

    // Udhaar (Debit)
    if (entry.type === 'debit') {
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`- Rs. ${entry.amount.toFixed(2)}`, 152, yPos, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('-', 152, yPos, { align: 'right' });
    }

    // Running Balance
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    const balPrefix = runningBalance > 0 ? 'Rs. ' : runningBalance < 0 ? '- Rs. ' : 'Rs. ';
    doc.text(`${balPrefix}${Math.abs(runningBalance).toFixed(2)}`, pageWidth - 18, yPos, { align: 'right' });

    yPos += 8;
  }

  // Summary box at bottom
  yPos += 6;
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, yPos, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text(`${party.type === 'supplier' ? 'Total Supplier Payments (Credit)' : 'Total Jama (Credit)'}: Rs. ${totalCredit.toFixed(2)}`, 20, yPos + 8);
  doc.text(`${party.type === 'supplier' ? 'Total Purchases (Debit)' : 'Total Udhaar (Debit)'}: Rs. ${totalDebit.toFixed(2)}`, 20, yPos + 16);

  // Final Net Status
  doc.setFontSize(12);
  let statusText = '';
  if (runningBalance > 0) {
    doc.setTextColor(party.type === 'customer' ? 5 : 220, party.type === 'customer' ? 150 : 38, 38);
    statusText = party.type === 'customer'
      ? `Aapko Lena Hai: Rs. ${runningBalance.toFixed(2)}`
      : `Aapko Dena Hai: Rs. ${runningBalance.toFixed(2)}`;
  } else if (runningBalance < 0) {
    doc.setTextColor(party.type === 'customer' ? 220 : 5, party.type === 'customer' ? 38 : 150, 38);
    statusText = party.type === 'customer'
      ? `Aapko Dena Hai: Rs. ${Math.abs(runningBalance).toFixed(2)}`
      : `Aapko Lena Hai: Rs. ${Math.abs(runningBalance).toFixed(2)}`;
  } else {
    doc.setTextColor(71, 85, 105);
    statusText = 'Hisab Barabar: Rs. 0.00';
  }
  doc.text(statusText, pageWidth - 20, yPos + 12, { align: 'right' });

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Digital Khata: Yeh ek computer dwara banaya gaya khata statement hai. Kisi signature ki aavashyakta nahi hai.',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  return doc;
}
