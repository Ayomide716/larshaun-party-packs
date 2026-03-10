import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale } from '@/data/mockData';

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = (
  headers: string[],
  data: any[][],
  title: string,
  filename: string
) => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 40,
    theme: 'striped',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
    },
  });

  doc.save(`${filename}.pdf`);
};

export const generateInvoicePDF = (sale: Sale, currencyCode: string = 'NGN', businessDetails?: any) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(24);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('INVOICE', 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500

  // Business Details
  let yPos = 20;
  doc.text(businessDetails?.businessName || 'Larshaun party packs', 140, yPos);
  doc.text(businessDetails?.address || 'Lagos, Nigeria', 140, yPos + 5);
  doc.text(businessDetails?.city || 'HQ Office', 140, yPos + 10);
  doc.text(businessDetails?.email || 'hello@larshaunpartypacks.com', 140, yPos + 15);

  // Invoice Details
  yPos = 45;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text('Bill To:', 14, yPos);

  doc.setFontSize(10);
  doc.text(sale.customerName, 14, yPos + 7);

  doc.text(`Invoice Number: INV-${sale.id.toUpperCase().slice(0, 8)}`, 140, yPos);
  doc.text(`Date: ${sale.date}`, 140, yPos + 5);
  doc.text(`Payment Method: ${sale.paymentMethod}`, 140, yPos + 10);
  doc.text(`Status: ${sale.status.toUpperCase()}`, 140, yPos + 15);

  // Items Table
  const tableData = sale.products.map(p => [
    p.productName,
    p.qty.toString(),
    `${currencyCode} ${p.price.toFixed(2)}`,
    `${currencyCode} ${(p.price * p.qty).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: yPos + 30,
    head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [241, 245, 249], // Slate 100
      textColor: [15, 23, 42], // Slate 900
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 140, finalY);
  doc.text('Total:', 140, finalY + 7);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`${currencyCode} ${sale.total.toFixed(2)}`, 180, finalY, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('', 'bold');
  doc.text(`${currencyCode} ${sale.total.toFixed(2)}`, 180, finalY + 7, { align: 'right' });

  // Footer
  doc.setFont('', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });

  doc.save(`Invoice_${sale.id.toUpperCase().slice(0, 8)}.pdf`);
};
