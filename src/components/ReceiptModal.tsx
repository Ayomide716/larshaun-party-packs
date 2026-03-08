import jsPDF from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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

  if (!sale) return null;

  const subtotal = sale.products.reduce((s, p) => s + p.price * p.qty, 0);
  const grandTotal = sale.total;
  const taxAmount = grandTotal - subtotal;
  const hasTax = taxAmount > 0.001;
  const displayTaxRate =
    subtotal > 0 ? ((taxAmount / subtotal) * 100).toFixed(1) : settings.taxRate.toFixed(1);
  const receiptLabel = sale.invoiceRef || sale.id.toUpperCase().slice(0, 8);

  const sym = settings.currencySymbol;
  const bizName = settings.businessName;
  const bizPhone = settings.businessPhone || "0707 519 4600";
  const bizEmail = settings.businessEmail || "poshomes@gmail.com";

  const drawDashedLine = (doc: jsPDF, x1: number, y: number, x2: number) => {
    const segLen = 4;
    const gapLen = 3;
    let x = x1;
    let drawing = true;
    doc.setDrawColor(203, 213, 225);
    while (x < x2) {
      const endX = Math.min(x + (drawing ? segLen : gapLen), x2);
      if (drawing) doc.line(x, y, endX, y);
      x = endX;
      drawing = !drawing;
    }
  };

  const handleDownloadPDF = () => {
    try {
      const W = 360;
      // Estimate height: header ~120, meta ~90, items variable, totals ~80, footer ~60
      const itemsHeight = sale.products.reduce((h, p) => {
        const lines = Math.ceil(p.productName.length / 20);
        return h + (lines > 1 ? lines * 11 + 4 : 14);
      }, 0);
      const docHeight = 350 + itemsHeight + (hasTax ? 13 : 0);

      const doc = new jsPDF({ unit: "pt", format: [W, docHeight] });
      const primaryColor: [number, number, number] = [148, 101, 74];
      const slateColor: [number, number, number] = [100, 116, 139];
      const darkColor: [number, number, number] = [30, 41, 59];

      let y = 36;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...darkColor);
      doc.text(bizName, W / 2, y, { align: "center" });

      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...slateColor);
      doc.text("Sales Receipt", W / 2, y, { align: "center" });

      y += 13;
      doc.text(bizPhone, W / 2, y, { align: "center" });
      y += 11;
      doc.text(bizEmail, W / 2, y, { align: "center" });

      y += 16;
      drawDashedLine(doc, 20, y, W - 20);

      const metaRows: [string, string][] = [
        ["Receipt No.", `#${receiptLabel}`],
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

      y += 4;
      drawDashedLine(doc, 20, y, W - 20);
      y += 12;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...slateColor);
      doc.text("ITEM", 20, y);
      doc.text("QTY", 210, y, { align: "center" });
      doc.text("UNIT", 280, y, { align: "right" });
      doc.text("TOTAL", W - 20, y, { align: "right" });
      y += 10;

      sale.products.forEach((p) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...darkColor);
        const nameLines = doc.splitTextToSize(p.productName, 155);
        doc.text(nameLines, 20, y);
        doc.setTextColor(...slateColor);
        doc.text(String(p.qty), 210, y, { align: "center" });
        doc.text(`${sym}${p.price.toFixed(2)}`, 280, y, { align: "right" });
        doc.setTextColor(...darkColor);
        doc.setFont("helvetica", "bold");
        doc.text(`${sym}${(p.price * p.qty).toFixed(2)}`, W - 20, y, { align: "right" });
        y += nameLines.length > 1 ? nameLines.length * 11 + 4 : 14;
      });

      y += 4;
      drawDashedLine(doc, 20, y, W - 20);
      y += 12;

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

      y += 14;
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

      y += 30;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("✦ THANK YOU FOR YOUR PATRONAGE ✦", W / 2, y, { align: "center" });
      y += 11;
      doc.text(bizName, W / 2, y, { align: "center" });

      doc.save(`Receipt_${receiptLabel}.pdf`);
      toast.success("Receipt PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate receipt PDF");
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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-lg">Receipt Preview</DialogTitle>
            <Button size="sm" variant="outline" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" /> Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[72vh] p-4 bg-muted/30">
          <div
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
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "hsl(22, 40%, 52%)",
                  marginBottom: "10px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "0.5px", color: "#1e293b" }}>
                {bizName}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{bizPhone}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{bizEmail}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "5px", letterSpacing: "0.5px" }}>
                Sales Receipt
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Meta */}
            {[
              ["Receipt No.", `#${receiptLabel}`],
              ["Date", sale.date],
              ["Customer", sale.customerName],
              ["Payment", sale.paymentMethod],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                <span style={{ color: "#64748b" }}>{label}</span>
                <span style={{ fontWeight: "600" }}>{value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>Status</span>
              <span style={{ fontWeight: "700", color: statusColor, textTransform: "capitalize" }}>{sale.status}</span>
            </div>

            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Items header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                color: "#94a3b8",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "10px",
              }}
            >
              <span style={{ flex: 2 }}>Item</span>
              <span style={{ textAlign: "center", width: "30px" }}>Qty</span>
              <span style={{ textAlign: "right", width: "70px" }}>Unit</span>
              <span style={{ textAlign: "right", width: "70px" }}>Total</span>
            </div>

            {/* Items */}
            {sale.products.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  marginBottom: "8px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ flex: 2, paddingRight: "8px", lineHeight: "1.3" }}>{p.productName}</span>
                <span style={{ textAlign: "center", width: "30px", color: "#64748b" }}>{p.qty}</span>
                <span style={{ textAlign: "right", width: "70px", color: "#64748b" }}>
                  {sym}{p.price.toFixed(2)}
                </span>
                <span style={{ textAlign: "right", width: "70px", fontWeight: "600" }}>
                  {sym}{(p.price * p.qty).toFixed(2)}
                </span>
              </div>
            ))}

            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Subtotal</span>
              <span>{sym}{subtotal.toFixed(2)}</span>
            </div>
            {hasTax && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Tax ({displayTaxRate}%)</span>
                <span>{sym}{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "15px",
                fontWeight: "700",
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: "2px solid #1e293b",
              }}
            >
              <span>Total</span>
              <span style={{ color: "hsl(22, 40%, 52%)" }}>{sym}{grandTotal.toFixed(2)}</span>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "28px", fontSize: "11px", color: "#94a3b8" }}>
              <div style={{ marginBottom: "4px" }}>✦ THANK YOU FOR YOUR PATRONAGE ✦</div>
              <div style={{ fontSize: "10px" }}>{bizName}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
