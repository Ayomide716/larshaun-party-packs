import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { Settings, Bell, Building2, DollarSign, Package, Mail, CheckCircle2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
];

export default function SettingsPage() {
  const { settings, updateSettings, lowStockAlerts, reorderRequests, requestReorder, clearReorder, dismissAlert } = useSettings();
  const [saved, setSaved] = useState(false);
  const [localName, setLocalName] = useState(settings.businessName);
  const [localPhone, setLocalPhone] = useState(settings.businessPhone);
  const [localEmail, setLocalEmail] = useState(settings.businessEmail);
  const [localTax, setLocalTax] = useState(String(settings.taxRate));

  useEffect(() => {
    setLocalName(settings.businessName);
    setLocalPhone(settings.businessPhone);
    setLocalEmail(settings.businessEmail);
    setLocalTax(String(settings.taxRate));
  }, [settings.businessName, settings.businessPhone, settings.businessEmail, settings.taxRate]);

  const handleSaveBusiness = () => {
    updateSettings({ businessName: localName, businessPhone: localPhone, businessEmail: localEmail, taxRate: parseFloat(localTax) || 0 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeLowStock = lowStockAlerts.filter(a => !a.dismissed);

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your business preferences and notifications</p>
      </div>

      {/* Business Info */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Business Information</h2>
        </div>
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Business Name</Label>
            <Input value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Your business name" />
          </div>

          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <Input value={localPhone} onChange={e => setLocalPhone(e.target.value)} placeholder="e.g. 0707 519 4600" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Business Email</Label>
            <Input type="email" value={localEmail} onChange={e => setLocalEmail(e.target.value)} placeholder="e.g. hello@business.com" />
          </div>

          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={val => {
                const found = CURRENCIES.find(c => c.code === val);
                if (found) updateSettings({ currency: found.code, currencySymbol: found.symbol });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} — {c.label} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={localTax}
              onChange={e => setLocalTax(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSaveBusiness} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</> : "Save Changes"}
          </Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
        </div>
        <Separator />

        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Low Stock In-App Alerts</p>
              <p className="text-xs text-muted-foreground mt-0.5">Show a banner when a product drops below its minimum stock level</p>
            </div>
            <Switch
              checked={settings.notifications.lowStock}
              onCheckedChange={v => updateSettings({ notifications: { ...settings.notifications, lowStock: v } })}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Low Stock Email Alerts</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receive an email when any product needs reordering</p>
            </div>
            <Switch
              checked={settings.notifications.lowStockEmail}
              onCheckedChange={v => updateSettings({ notifications: { ...settings.notifications, lowStockEmail: v } })}
            />
          </div>

          {settings.notifications.lowStockEmail && (
            <div className="space-y-1.5 ml-0">
              <Label>Alert Email Address</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    className="pl-9"
                    placeholder="alerts@yourbusiness.com"
                    value={settings.notifications.lowStockEmailAddress}
                    onChange={e => updateSettings({ notifications: { ...settings.notifications, lowStockEmailAddress: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Daily Summary Report</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get a daily digest of sales and inventory</p>
            </div>
            <Switch
              checked={settings.notifications.dailyReport}
              onCheckedChange={v => updateSettings({ notifications: { ...settings.notifications, dailyReport: v } })}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Weekly Performance Report</p>
              <p className="text-xs text-muted-foreground mt-0.5">Receive a weekly analytics summary every Monday</p>
            </div>
            <Switch
              checked={settings.notifications.weeklyReport}
              onCheckedChange={v => updateSettings({ notifications: { ...settings.notifications, weeklyReport: v } })}
            />
          </div>
        </div>
      </section>

      {/* Reorder Workflow */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Reorder Workflow</h2>
        </div>
        <Separator />

        {activeLowStock.length === 0 && reorderRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No pending reorder requests · All stock levels are healthy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeLowStock.map(alert => {
              const ordered = reorderRequests.includes(alert.productId);
              return (
                <div key={alert.productId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.productName}</p>
                    <p className="text-xs text-muted-foreground">{alert.sku} · {alert.currentStock} left / min {alert.minStock}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ordered ? (
                      <>
                        <span className="text-xs text-[hsl(var(--forest))] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />Reorder Sent
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => clearReorder(alert.productId)}>
                          <X className="w-3 h-3 mr-1" />Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => requestReorder(alert.productId)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Request Reorder
                      </Button>
                    )}
                    <button onClick={() => dismissAlert(alert.productId)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
