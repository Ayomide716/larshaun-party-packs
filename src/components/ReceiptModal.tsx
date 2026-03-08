import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, X } from "lucide-react";
import type { Sale } from "@/data/mockData";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";

interface ReceiptModalProps {
  sale: Sale | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptModal({ sale, open, onClose }: ReceiptModalProps) {
  const { settings } = useSettings();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const subtotal = sale.products.reduce((s, p) => s + p.price * p.qty, 0);
  const grandTotal = sale.total;
  const taxAmount = grandTotal - subtotal;
  const hasTax = taxAmount > 0.001;
  const displayTaxRate = subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(1) : settings.taxRate.toFixed(1);
  const invoiceLabel = sale.invoiceRef || sale.id.toUpperCase().slice(0, 8);

  const captureReceipt = async (): Promise<HTMLCanvasElement | null> => {
    if (!receiptRef.current) return null;
    return html2canvas(receiptRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  };

  const handlePrint = async () => {
    try {
      const canvas = await captureReceipt();
      if (!canvas) return;
      const imgData = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) { toast.error("Pop-up blocked. Allow pop-ups and try again."); return; }
      win.document.write(`
        <html><head><title>Receipt – ${invoiceLabel}</title>
        <style>body{margin:0;display:flex;justify-content:center;background:#f1f5f9}img{max-width:420px;width:100%;display:block}</style>
        </head><body><img src="${imgData}" onload="window.print();window.close()" /></body></html>
      `);
      win.document.close();
    } catch {
      toast.error("Failed to print receipt");
    }
  };

  const handleDownloadImage = async () => {
    try {
      const canvas = await captureReceipt();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `Receipt_${invoiceLabel}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Receipt downloaded!");
    } catch {
      toast.error("Failed to download receipt");
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: [360, 600] });
      const W = 360;
      const sym = settings.currencySymbol;
      const primaryColor: [number, number, number] = [148, 101, 74]; // warm brown
      const slateColor: [number, number, number] = [100, 116, 139];
      const darkColor: [number, number, number] = [30, 41, 59];

      let y = 32;

      // Business name header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...darkColor);
      doc.text(settings.businessName, W / 2, y, { align: "center" });

      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...slateColor);
      doc.text("Sales Receipt", W / 2, y, { align: "center" });

      if (settings.businessPhone) {
        y += 13;
        doc.text(settings.businessPhone, W / 2, y, { align: "center" });
      }
      if (settings.businessEmail) {
        y += 11;
        doc.text(settings.businessEmail, W / 2, y, { align: "center" });
      }

      // Dashed separator
      y += 14;
      doc.setDrawColor(203, 213, 225);
      doc.setLineDash([3, 3], 0);
      doc.line(20, y, W - 20, y);
      doc.setLineDash([], 0);

      // Meta rows
      const metaRows: [string, string][] = [
        ["Receipt No.", `#${invoiceLabel}`],
        ["Date", sale.date],
        ["Customer", sale.customerName],
        ["Payment", sale.paymentMethod],
        ["Status", sale.status.toUpperCase()],
      ];

      y += 14;
      metaRows.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...slateColor);
        doc.text(label, 20, y);
        doc.setTextColor(...darkColor);
        doc.setFont("helvetica", "bold");
        doc.text(value, W - 20, y, { align: "right" });
        y += 14;
      });

      // Dashed separator
      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.setLineDash([3, 3], 0);
      doc.line(20, y, W - 20, y);
      doc.setLineDash([], 0);
      y += 12;

      // Items header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...slateColor);
      doc.text("ITEM", 20, y);
      doc.text("QTY", 210, y, { align: "center" });
      doc.text("UNIT", 280, y, { align: "right" });
      doc.text("TOTAL", W - 20, y, { align: "right" });
      y += 10;

      // Items
      sale.products.forEach(p => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...darkColor);
        // Wrap long product names
        const nameLines = doc.splitTextToSize(p.productName, 155);
        doc.text(nameLines, 20, y);
        doc.setTextColor(...slateColor);
        doc.text(String(p.qty), 210, y, { align: "center" });
        doc.text(`${sym}${p.price.toFixed(2)}`, 280, y, { align: "right" });
        doc.setTextColor(...darkColor);
        doc.setFont("helvetica", "bold");
        doc.text(`${sym}${(p.price * p.qty).toFixed(2)}`, W - 20, y, { align: "right" });
        y += nameLines.length > 1 ? nameLines.length * 11 + 2 : 14;
      });

      // Dashed separator
      y += 4;
      doc.setDrawColor(203, 213, 225);
      doc.setLineDash([3, 3], 0);
      doc.line(20, y, W - 20, y);
      doc.setLineDash([], 0);
      y += 12;

      // Subtotal
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...slateColor);
      doc.text("Subtotal", 20, y);
      doc.setTextColor(...darkColor);
      doc.text(`${sym}${subtotal.toFixed(2)}`, W - 20, y, { align: "right" });

      if (hasTax) {
        y += 13;
        doc.setTextColor(...slateColor);
        doc.text(`Tax (${displayTaxRate}%)`, 20, y);
        doc.setTextColor(...darkColor);
        doc.text(`${sym}${taxAmount.toFixed(2)}`, W - 20, y, { align: "right" });
      }

      // Grand total
      y += 12;
      doc.setDrawColor(...darkColor);
      doc.setLineWidth(1.5);
      doc.line(20, y, W - 20, y);
      y += 14;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...darkColor);
      doc.text("Total", 20, y);
      doc.setTextColor(...primaryColor);
      doc.text(`${sym}${grandTotal.toFixed(2)}`, W - 20, y, { align: "right" });

      // Footer
      y += 30;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("✦  THANK YOU FOR YOUR PATRONAGE  ✦", W / 2, y, { align: "center" });
      y += 11;
      doc.text(settings.businessName, W / 2, y, { align: "center" });

      // Resize page to content
      doc.internal.pageSize.height = y + 30;

      doc.save(`Receipt_${invoiceLabel}.pdf`);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const statusColor = sale.status === "completed"
    ? "hsl(var(--forest))"
    : sale.status === "pending"
      ? "#d97706"
      : "#dc2626";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-lg">Receipt Preview</DialogTitle>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadImage} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Image
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Receipt — this div is captured by html2canvas */}
        <div className="overflow-y-auto max-h-[70vh] p-4 bg-muted/30">
          <div
            ref={receiptRef}
            style={{
              fontFamily: "'Georgia', serif",
              background: "#ffffff",
              width: "360px",
              margin: "0 auto",
              padding: "32px 28px",
              borderRadius: "4px",
              color: "#1e293b",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "hsl(22 40% 52%)",
                marginBottom: "10px",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "0.5px", color: "#1e293b" }}>
                {settings.businessName}
              </div>
              {settings.businessPhone && (
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>{settings.businessPhone}</div>
              )}
              {settings.businessEmail && (
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>{settings.businessEmail}</div>
              )}
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.5px" }}>Sales Receipt</div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Meta */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>Receipt No.</span>
              <span style={{ fontWeight: "600", fontFamily: "monospace", fontSize: "11px" }}>
                #{invoiceLabel}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>Date</span>
              <span>{sale.date}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>Customer</span>
              <span style={{ fontWeight: "600" }}>{sale.customerName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>Payment</span>
              <span>{sale.paymentMethod}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>Status</span>
              <span style={{ fontWeight: "700", color: statusColor, textTransform: "capitalize" }}>{sale.status}</span>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Items header */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
              <span style={{ flex: 2 }}>Item</span>
              <span style={{ textAlign: "center", width: "30px" }}>Qty</span>
              <span style={{ textAlign: "right", width: "70px" }}>Unit</span>
              <span style={{ textAlign: "right", width: "70px" }}>Total</span>
            </div>

            {/* Items */}
            {sale.products.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px", alignItems: "flex-start" }}>
                <span style={{ flex: 2, paddingRight: "8px", lineHeight: "1.3" }}>{p.productName}</span>
                <span style={{ textAlign: "center", width: "30px", color: "#64748b" }}>{p.qty}</span>
                <span style={{ textAlign: "right", width: "70px", color: "#64748b" }}>
                  {settings.currencySymbol}{p.price.toFixed(2)}
                </span>
                <span style={{ textAlign: "right", width: "70px", fontWeight: "600" }}>
                  {settings.currencySymbol}{(p.price * p.qty).toFixed(2)}
                </span>
              </div>
            ))}

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Subtotal</span>
              <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {hasTax && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Tax ({displayTaxRate}%)</span>
                <span>{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", marginTop: "8px", paddingTop: "8px", borderTop: "2px solid #1e293b" }}>
              <span>Total</span>
              <span style={{ color: "hsl(22 40% 52%)" }}>{settings.currencySymbol}{grandTotal.toFixed(2)}</span>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "28px", fontSize: "11px", color: "#94a3b8" }}>
              <div style={{ marginBottom: "4px" }}>✦ THANK YOU FOR YOUR PATRONAGE ✦</div>
              <div style={{ fontSize: "10px" }}>{settings.businessName}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
