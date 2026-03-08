import { useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, X } from "lucide-react";
import type { Sale } from "@/data/mockData";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";

interface InvoiceModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

export function InvoiceModal({ sale, open, onClose }: InvoiceModalProps) {
  const { settings } = useSettings();
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const subtotal = sale.products.reduce((s, p) => s + p.price * p.qty, 0);
  const grandTotal = sale.total;
  const taxAmount = grandTotal - subtotal;
  const hasTax = taxAmount > 0.001;
  const displayTaxRate = subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(1) : settings.taxRate.toFixed(1);
  const invoiceNumber = sale.invoiceRef || `INV-${sale.id.toUpperCase().slice(0, 8)}`;

  const sym = settings.currencySymbol;
  const bizName = settings.businessName;
  const bizPhone = settings.businessPhone || "0707 519 4600";
  const bizEmail = settings.businessEmail || "poshomes@gmail.com";

  const handleDownloadImage = async () => {
    try {
      if (!invoiceRef.current) return;
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `Invoice_${invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Invoice image downloaded!");
    } catch {
      toast.error("Failed to download invoice image");
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = 595;
      const darkColor: [number, number, number] = [15, 23, 42];
      const slateColor: [number, number, number] = [100, 116, 139];
      const primaryColor: [number, number, number] = [148, 101, 74];
      const lightBg: [number, number, number] = [241, 245, 249];

      // Header background strip
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, W, 80, "F");

      // Business name (white)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(bizName, 40, 38);

      // "INVOICE" label top-right
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", W - 40, 38, { align: "right" });

      // Business contact under name
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(230, 220, 215);
      doc.text(`${bizPhone}  |  ${bizEmail}`, 40, 58);

      // Invoice number under INVOICE
      doc.setFontSize(10);
      doc.text(invoiceNumber, W - 40, 58, { align: "right" });

      let y = 108;

      // Bill To & Invoice Details side by side
      doc.setFillColor(...lightBg);
      doc.roundedRect(30, y - 12, 240, 70, 4, 4, "F");
      doc.roundedRect(W - 270, y - 12, 240, 70, 4, 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...slateColor);
      doc.text("BILL TO", 44, y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...darkColor);
      doc.text(sale.customerName, 44, y + 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...slateColor);
      doc.text(`Date: ${sale.date}`, 44, y + 28);
      doc.text(`Payment: ${sale.paymentMethod}`, 44, y + 40);

      // Right box
      const rx = W - 266;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...slateColor);
      doc.text("INVOICE DETAILS", rx, y);

      const detailRows = [
        ["Invoice No.", invoiceNumber],
        ["Date", sale.date],
        ["Status", sale.status.toUpperCase()],
        ["Payment", sale.paymentMethod],
      ];
      detailRows.forEach(([label, val], i) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...slateColor);
        doc.text(label, rx, y + 14 + i * 12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkColor);
        doc.text(val, rx + 230, y + 14 + i * 12, { align: "right" });
      });

      y += 84;

      // Items table
      const tableData = sale.products.map((p) => [
        p.productName,
        p.qty.toString(),
        `${sym}${p.price.toFixed(2)}`,
        `${sym}${(p.price * p.qty).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]],
        body: tableData,
        margin: { left: 30, right: 30 },
        theme: "plain",
        headStyles: {
          fillColor: darkColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
          cellPadding: 8,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 8,
          textColor: darkColor,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "center", cellWidth: 50 },
          2: { halign: "right", cellWidth: 90 },
          3: { halign: "right", cellWidth: 90 },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 16;

      // Totals section (right-aligned box)
      const totalsX = W - 220;
      doc.setFillColor(...lightBg);
      const boxH = hasTax ? 76 : 56;
      doc.roundedRect(totalsX - 10, y, 200, boxH, 4, 4, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...slateColor);
      doc.text("Subtotal", totalsX, y + 18);
      doc.setTextColor(...darkColor);
      doc.text(`${sym}${subtotal.toFixed(2)}`, W - 38, y + 18, { align: "right" });

      if (hasTax) {
        doc.setTextColor(...slateColor);
        doc.text(`Tax (${displayTaxRate}%)`, totalsX, y + 36);
        doc.setTextColor(...darkColor);
        doc.text(`${sym}${taxAmount.toFixed(2)}`, W - 38, y + 36, { align: "right" });
      }

      const totalY = hasTax ? y + 56 : y + 40;
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.line(totalsX - 10, totalY - 6, W - 28, totalY - 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...primaryColor);
      doc.text("TOTAL", totalsX, totalY + 10);
      doc.text(`${sym}${grandTotal.toFixed(2)}`, W - 38, totalY + 10, { align: "right" });

      // Footer
      const footerY = 790;
      doc.setDrawColor(...lightBg);
      doc.setLineWidth(1);
      doc.line(30, footerY, W - 30, footerY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slateColor);
      doc.text("Thank you for your business!", 30, footerY + 14);
      doc.text(bizName, W - 30, footerY + 14, { align: "right" });

      doc.save(`Invoice_${invoiceNumber}.pdf`);
      toast.success("Invoice PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice PDF");
    }
  };

  const statusColor =
    sale.status === "completed"
      ? "#16a34a"
      : sale.status === "pending"
      ? "#d97706"
      : "#dc2626";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-lg">Invoice Preview</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadImage} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Image
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[75vh] p-4 bg-muted/30">
          <div
            ref={invoiceRef}
            style={{
              fontFamily: "'Inter', 'Helvetica', sans-serif",
              background: "#ffffff",
              width: "680px",
              margin: "0 auto",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "hsl(22 40% 52%)",
                padding: "28px 36px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: "#fff", letterSpacing: "-0.3px" }}>
                  {bizName}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", marginTop: "6px" }}>
                  {bizPhone} &nbsp;|&nbsp; {bizEmail}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "26px", fontWeight: "800", color: "#fff", letterSpacing: "2px" }}>INVOICE</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", marginTop: "4px", fontFamily: "monospace" }}>
                  {invoiceNumber}
                </div>
              </div>
            </div>

            {/* Info bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                padding: "20px 36px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div>
                <div style={{ fontSize: "9px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>Bill To</div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{sale.customerName}</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>Payment: {sale.paymentMethod}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>Invoice Details</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "3px" }}>
                  Date: <span style={{ color: "#0f172a", fontWeight: "600" }}>{sale.date}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  Status:{" "}
                  <span style={{ color: statusColor, fontWeight: "700", textTransform: "capitalize" }}>
                    {sale.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div style={{ padding: "0 36px 24px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
                <thead>
                  <tr style={{ background: "#0f172a" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "#fff", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                      Description
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "10px", fontWeight: "700", color: "#fff", letterSpacing: "0.8px", textTransform: "uppercase", width: "60px" }}>
                      Qty
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "10px", fontWeight: "700", color: "#fff", letterSpacing: "0.8px", textTransform: "uppercase", width: "110px" }}>
                      Unit Price
                    </th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "10px", fontWeight: "700", color: "#fff", letterSpacing: "0.8px", textTransform: "uppercase", width: "110px" }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.products.map((p, i) => (
                    <tr
                      key={i}
                      style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#1e293b" }}>{p.productName}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>{p.qty}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12px", color: "#64748b" }}>
                        {sym}{p.price.toFixed(2)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#1e293b" }}>
                        {sym}{(p.price * p.qty).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <div style={{ width: "220px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                    <span style={{ color: "#64748b" }}>Subtotal</span>
                    <span style={{ color: "#1e293b" }}>{sym}{subtotal.toFixed(2)}</span>
                  </div>
                  {hasTax && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span style={{ color: "#64748b" }}>Tax ({displayTaxRate}%)</span>
                      <span style={{ color: "#1e293b" }}>{sym}{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                      fontWeight: "700",
                      marginTop: "8px",
                      paddingTop: "10px",
                      borderTop: "2px solid hsl(22 40% 52%)",
                    }}
                  >
                    <span style={{ color: "#0f172a" }}>Total</span>
                    <span style={{ color: "hsl(22, 40%, 52%)" }}>{sym}{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 36px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>Thank you for your business!</span>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>{bizName}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
