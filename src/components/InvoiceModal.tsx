import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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
  const previewRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const subtotal = sale.products.reduce((s, p) => s + p.price * p.qty, 0);
  const grandTotal = sale.total;
  const taxAmount = grandTotal - subtotal;
  const hasTax = taxAmount > 0.001;
  const displayTaxRate =
    subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(1) : settings.taxRate.toFixed(1);
  const invoiceNumber = sale.invoiceRef || `INV-${sale.id.toUpperCase().slice(0, 8)}`;

  const sym = settings.currencySymbol;
  const bizName = settings.businessName;
  const bizPhone = settings.businessPhone || "0707 519 4600";
  const bizEmail = settings.businessEmail || "poshomes@gmail.com";

  const statusColor =
    sale.status === "completed" ? "#16a34a" : sale.status === "pending" ? "#d97706" : "#dc2626";

  const handleDownloadImage = async () => {
    try {
      if (!previewRef.current) return;
      const canvas = await html2canvas(previewRef.current, {
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
      const W = 595.28;
      const darkColor: [number, number, number] = [15, 23, 42];
      const slateColor: [number, number, number] = [100, 116, 139];
      const primaryColor: [number, number, number] = [148, 101, 74];
      const lightBg: [number, number, number] = [241, 245, 249];

      // ── Header strip ──────────────────────────────────────
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, W, 82, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(bizName, 40, 36);

      doc.setFontSize(26);
      doc.text("INVOICE", W - 40, 36, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(230, 215, 205);
      doc.text(`${bizPhone}  |  ${bizEmail}`, 40, 56);
      doc.text(invoiceNumber, W - 40, 56, { align: "right" });

      // ── Info cards ────────────────────────────────────────
      let y = 106;
      const cardW = 240;

      doc.setFillColor(...lightBg);
      doc.roundedRect(30, y, cardW, 72, 4, 4, "F");
      doc.roundedRect(W - 270, y, cardW, 72, 4, 4, "F");

      // Left: Bill To
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateColor);
      doc.text("BILL TO", 44, y + 16);

      doc.setFontSize(13);
      doc.setTextColor(...darkColor);
      doc.text(sale.customerName, 44, y + 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...slateColor);
      doc.text(`Payment: ${sale.paymentMethod}`, 44, y + 46);
      doc.text(`Date: ${sale.date}`, 44, y + 58);

      // Right: Invoice details
      const rx = W - 266;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateColor);
      doc.text("INVOICE DETAILS", rx, y + 16);

      const details: [string, string][] = [
        ["Invoice No.", invoiceNumber],
        ["Status", sale.status.toUpperCase()],
        ["Date", sale.date],
      ];
      details.forEach(([label, val], i) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...slateColor);
        doc.text(label, rx, y + 30 + i * 13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkColor);
        doc.text(val, rx + cardW - 8, y + 30 + i * 13, { align: "right" });
      });

      y += 90;

      // ── Items table ───────────────────────────────────────
      const tableData = sale.products.map((p) => [
        p.productName,
        String(p.qty),
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
          cellPadding: { top: 9, bottom: 9, left: 10, right: 10 },
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
          textColor: darkColor,
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { halign: "center", cellWidth: 50 },
          2: { halign: "right", cellWidth: 95 },
          3: { halign: "right", cellWidth: 95 },
        },
      });

      y = (doc as any).lastAutoTable.finalY + 20;

      // ── Totals box ────────────────────────────────────────
      const boxLines = hasTax ? 3 : 2;
      const boxH = boxLines * 22 + 24;
      const boxX = W - 230;
      doc.setFillColor(...lightBg);
      doc.roundedRect(boxX - 10, y, 205, boxH, 4, 4, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...slateColor);
      doc.text("Subtotal", boxX, y + 18);
      doc.setTextColor(...darkColor);
      doc.text(`${sym}${subtotal.toFixed(2)}`, W - 38, y + 18, { align: "right" });

      if (hasTax) {
        doc.setTextColor(...slateColor);
        doc.text(`Tax (${displayTaxRate}%)`, boxX, y + 40);
        doc.setTextColor(...darkColor);
        doc.text(`${sym}${taxAmount.toFixed(2)}`, W - 38, y + 40, { align: "right" });
      }

      const totalLineY = y + (hasTax ? 54 : 36);
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.line(boxX - 10, totalLineY, W - 28, totalLineY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...primaryColor);
      doc.text("TOTAL", boxX, totalLineY + 16);
      doc.text(`${sym}${grandTotal.toFixed(2)}`, W - 38, totalLineY + 16, { align: "right" });

      // ── Footer ────────────────────────────────────────────
      const pageH = (doc.internal.pageSize as any).height;
      const footerY = Math.max(y + boxH + 40, pageH - 30);

      doc.setDrawColor(...lightBg);
      doc.setLineWidth(1);
      doc.line(30, footerY - 10, W - 30, footerY - 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slateColor);
      doc.text("Thank you for your business!", 30, footerY + 4);
      doc.text(bizName, W - 30, footerY + 4, { align: "right" });

      doc.save(`Invoice_${invoiceNumber}.pdf`);
      toast.success("Invoice PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice PDF");
    }
  };

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
            ref={previewRef}
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
              background: "#ffffff",
              width: "680px",
              margin: "0 auto",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "hsl(22, 40%, 52%)",
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
                  {bizPhone}&nbsp;&nbsp;|&nbsp;&nbsp;{bizEmail}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "26px", fontWeight: "800", color: "#fff", letterSpacing: "2px" }}>
                  INVOICE
                </div>
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
                <div style={{ fontSize: "9px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Bill To
                </div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                  {sale.customerName}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                  Payment: {sale.paymentMethod}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                  Invoice Details
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "3px" }}>
                  Invoice No:&nbsp;
                  <span style={{ color: "#0f172a", fontWeight: "600", fontFamily: "monospace" }}>
                    {invoiceNumber}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "3px" }}>
                  Date:&nbsp;<span style={{ color: "#0f172a", fontWeight: "600" }}>{sale.date}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  Status:&nbsp;
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
                    {["Description", "Qty", "Unit Price", "Amount"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          fontSize: "10px",
                          fontWeight: "700",
                          color: "#fff",
                          letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          textAlign: i === 0 ? "left" : i === 1 ? "center" : "right",
                          width: i === 1 ? "60px" : i >= 2 ? "110px" : undefined,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sale.products.map((p, i) => (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontSize: "12px", color: "#1e293b" }}>
                        {p.productName}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                        {p.qty}
                      </td>
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
                      borderTop: "2px solid hsl(22, 40%, 52%)",
                    }}
                  >
                    <span style={{ color: "#0f172a" }}>Total</span>
                    <span style={{ color: "hsl(22, 40%, 52%)" }}>
                      {sym}{grandTotal.toFixed(2)}
                    </span>
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
