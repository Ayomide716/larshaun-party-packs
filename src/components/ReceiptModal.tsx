import { useRef } from "react";
import html2canvas from "html2canvas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, X } from "lucide-react";
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
  const taxAmount = subtotal * (settings.taxRate / 100);
  const total = subtotal + taxAmount;

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
        <html><head><title>Receipt – ${sale.id.toUpperCase().slice(0, 8)}</title>
        <style>body{margin:0;display:flex;justify-content:center;background:#f1f5f9}img{max-width:420px;width:100%;display:block}</style>
        </head><body><img src="${imgData}" onload="window.print();window.close()" /></body></html>
      `);
      win.document.close();
    } catch {
      toast.error("Failed to print receipt");
    }
  };

  const handleDownload = async () => {
    try {
      const canvas = await captureReceipt();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `Receipt_${sale.id.toUpperCase().slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Receipt downloaded!");
    } catch {
      toast.error("Failed to download receipt");
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
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Save Image
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
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Sales Receipt</div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #cbd5e1", margin: "16px 0" }} />

            {/* Meta */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ color: "#64748b" }}>Receipt No.</span>
              <span style={{ fontWeight: "600", fontFamily: "monospace", fontSize: "11px" }}>
                #{sale.id.toUpperCase().slice(0, 8)}
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
            {settings.taxRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ color: "#64748b" }}>Tax ({settings.taxRate}%)</span>
                <span>{settings.currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: "700", marginTop: "8px", paddingTop: "8px", borderTop: "2px solid #1e293b" }}>
              <span>Total</span>
              <span style={{ color: "hsl(22 40% 52%)" }}>{settings.currencySymbol}{total.toFixed(2)}</span>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "28px", fontSize: "11px", color: "#94a3b8" }}>
              <div style={{ marginBottom: "4px" }}>✦ Thank you for your purchase ✦</div>
              <div style={{ fontSize: "10px" }}>{settings.businessName}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
