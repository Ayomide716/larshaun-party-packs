import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";
import type { Expense } from "@/data/mockData";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";

interface ExpenseVoucherModalProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  Inventory: "#0e7490",
  Marketing: "#7c3aed",
  Shipping: "#0369a1",
  Operations: "#b45309",
  Software: "#15803d",
  Other: "#475569",
};

export function ExpenseVoucherModal({ expense, open, onClose }: ExpenseVoucherModalProps) {
  const { settings } = useSettings();
  const voucherRef = useRef<HTMLDivElement>(null);

  if (!expense) return null;

  const catColor = categoryColors[expense.category] ?? "#475569";
  const voucherLabel = expense.voucherRef || (expense.id?.toUpperCase().slice(0, 8) ?? "EXP");

  const captureVoucher = async (): Promise<HTMLCanvasElement | null> => {
    if (!voucherRef.current) return null;
    return html2canvas(voucherRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  };

  const handlePrint = async () => {
    try {
      const canvas = await captureVoucher();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `Expense_${voucherLabel}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Voucher downloaded!");
    } catch {
      toast.error("Failed to download voucher");
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: [360, 500] });
      const W = 360;
      const sym = settings.currencySymbol;
      const slateColor: [number, number, number] = [100, 116, 139];
      const darkColor: [number, number, number] = [30, 41, 59];
      const accentColor: [number, number, number] = [148, 101, 74];

      const drawDashedLine = (x1: number, y1: number, x2: number) => {
        const segLen = 4; const gapLen = 3;
        let x = x1; let drawing = true;
        doc.setDrawColor(203, 213, 225);
        while (x < x2) {
          const endX = Math.min(x + (drawing ? segLen : gapLen), x2);
          if (drawing) doc.line(x, y1, endX, y1);
          x = endX; drawing = !drawing;
        }
      };

      let y = 32;

      // Business name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...darkColor);
      doc.text(settings.businessName, W / 2, y, { align: "center" });

      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...slateColor);
      doc.text(settings.businessPhone || "0707 519 4600", W / 2, y, { align: "center" });
      y += 11;
      doc.text(settings.businessEmail || "poshomes@gmail.com", W / 2, y, { align: "center" });
      y += 11;
      doc.text("Expense Voucher", W / 2, y, { align: "center" });

      // Category badge area
      y += 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...accentColor);
      doc.text(expense.category.toUpperCase(), W / 2, y, { align: "center" });

      y += 14;
      drawDashedLine(20, y, W - 20);
      y += 14;

      const rows: [string, string][] = [
        ["Voucher No.", `#${voucherLabel}`],
        ["Date", expense.date],
        ["Vendor", expense.vendor || "—"],
        ["Description", expense.description],
      ];

      rows.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...slateColor);
        doc.text(label, 20, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...darkColor);
        const lines = doc.splitTextToSize(value, 180);
        doc.text(lines, W - 20, y, { align: "right" });
        y += lines.length > 1 ? lines.length * 12 + 2 : 14;
      });

      y += 4;
      drawDashedLine(20, y, W - 20);
      y += 14;

      // Total
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...slateColor);
      doc.text("Total Amount", 20, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...accentColor);
      doc.text(`${sym}${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, W - 20, y, { align: "right" });

      // Footer
      y += 30;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Authorised expense record", W / 2, y, { align: "center" });
      y += 11;
      doc.text(`${settings.businessName} · Internal Finance Document`, W / 2, y, { align: "center" });

      doc.internal.pageSize.height = y + 30;
      doc.save(`Expense_${voucherLabel}.pdf`);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownload = async () => {
    try {
      const canvas = await captureVoucher();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `Expense_${voucherLabel}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Voucher downloaded!");
    } catch {
      toast.error("Failed to download voucher");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-lg">Expense Voucher</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} className="gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Image
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] p-4 bg-muted/30">
          <div
            ref={voucherRef}
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
              <div style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "0.5px" }}>
                {settings.businessName}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                {settings.businessPhone || "0707 519 4600"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                {settings.businessEmail || "poshomes@gmail.com"}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", letterSpacing: "0.5px" }}>Expense Voucher</div>
            </div>

            {/* Category badge */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "999px",
                background: catColor + "18",
                color: catColor,
                fontSize: "11px",
                fontWeight: "700",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}>{expense.category}</span>
            </div>

            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "0 0 16px" }} />

            {/* Meta rows */}
            {[
              ["Voucher No.", `#${voucherLabel}`],
              ["Date", expense.date],
              ["Vendor", expense.vendor || "—"],
              ["Description", expense.description],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ color: "#64748b", flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: label === "Description" ? "400" : "600", textAlign: "right", color: "#1e293b" }}>{value}</span>
              </div>
            ))}

            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Amount */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>Total Amount</span>
              <span style={{ fontSize: "20px", fontWeight: "800", color: catColor }}>
                {settings.currencySymbol}{expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "28px", fontSize: "11px", color: "#94a3b8" }}>
              <div style={{ marginBottom: "4px" }}>Authorised expense record</div>
              <div style={{ fontSize: "10px" }}>{settings.businessName} · Internal Finance Document</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
