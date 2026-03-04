import { useState } from "react";
import { customers as initialCustomers, sales, Customer } from "@/data/mockData";
import { Plus, Search, Mail, Phone, MapPin, Star, TrendingUp, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/ExportButton";
import { ImportButton } from "@/components/ImportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

const segmentColors: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800",
  Regular: "bg-blue-100 text-blue-700",
  New: "bg-green-100 text-green-700",
  "At Risk": "bg-red-100 text-red-700",
};

const emptyCustomer: Omit<Customer, 'id'> = {
  name: '', email: '', phone: '', address: '', joinDate: new Date().toISOString().split('T')[0],
  totalPurchases: 0, totalSpent: 0, lastPurchase: '', segment: 'New', notes: '',
};

export default function CRM() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, 'id'>>(emptyCustomer);

  const filtered = customers.filter(c =>
    (segmentFilter === 'All' || c.segment === segmentFilter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = customers.find(c => c.id === selectedId) || null;
  const customerSales = selected ? sales.filter(s => s.customerId === selected.id) : [];

  const openAdd = () => { setEditingCustomer(null); setForm(emptyCustomer); setDialogOpen(true); };
  const openEdit = (c: Customer) => { setEditingCustomer(c); setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, joinDate: c.joinDate, totalPurchases: c.totalPurchases, totalSpent: c.totalSpent, lastPurchase: c.lastPurchase, segment: c.segment, notes: c.notes }); setDialogOpen(true); };

  const save = () => {
    if (editingCustomer) {
      setCustomers(cs => cs.map(c => c.id === editingCustomer.id ? { ...c, ...form } : c));
    } else {
      setCustomers(cs => [{ ...form, id: `c${Date.now()}` }, ...cs]);
    }
    setDialogOpen(false);
  };

  const handleExportCSV = () => {
    exportToCSV(customers, `customers_export_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'Email', 'Phone', 'Segment', 'Total Spent', 'Orders'];
    const data = customers.map(c => [
      c.name,
      c.email,
      c.phone,
      c.segment,
      `₦${c.totalSpent.toFixed(2)}`,
      c.totalPurchases.toString()
    ]);
    exportToPDF(headers, data, 'Customer List', `customers_${new Date().toISOString().split('T')[0]}`);
  };

  const handleImportCSV = (importedData: any[]) => {
    const validCustomers = importedData
      .filter(c => c.name && c.email)
      .map(c => ({
        id: `c${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        address: c.address || '',
        joinDate: c.joinDate || new Date().toISOString().split('T')[0],
        totalPurchases: parseInt(c.totalPurchases) || 0,
        totalSpent: parseFloat(c.totalSpent) || 0,
        lastPurchase: c.lastPurchase || '',
        segment: c.segment || 'New',
        notes: c.notes || ''
      })) as Customer[];
    setCustomers(prev => [...prev, ...validCustomers]);
  };

  const segmentCounts = { VIP: customers.filter(c => c.segment === 'VIP').length, Regular: customers.filter(c => c.segment === 'Regular').length, New: customers.filter(c => c.segment === 'New').length, "At Risk": customers.filter(c => c.segment === 'At Risk').length };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Customer CRM</h1>
          <p className="text-muted-foreground mt-1">{customers.length} customers · ₦{customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} lifetime value</p>
        </div>
        <div className="flex gap-2">
          <ImportButton
            onImport={handleImportCSV}
            expectedHeaders={['name', 'email', 'phone']}
          />
          <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button onClick={openAdd} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
        </div>
      </div>

      {/* Segment Summary */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(segmentCounts) as [string, number][]).map(([seg, count]) => (
          <button key={seg} onClick={() => setSegmentFilter(segmentFilter === seg ? 'All' : seg)}
            className={cn("bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md", segmentFilter === seg ? "border-primary bg-primary/5" : "border-border")}>
            <p className="text-2xl font-display font-semibold">{count}</p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block", segmentColors[seg])}>{seg}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Customer List */}
        <div className="flex-1 min-w-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                className={cn("bg-card border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all", selectedId === c.id ? "border-primary bg-primary/5" : "border-border")}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", segmentColors[c.segment])}>{c.segment}</span>
                    <p className="text-sm font-semibold mt-1">₦{c.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{c.totalPurchases} orders</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Detail */}
        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-elevated)] p-5 sticky top-20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold">
                    {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">{selected.name}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", segmentColors[selected.segment])}>{selected.segment}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(selected)} className="w-7 h-7 p-0"><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)} className="w-7 h-7 p-0"><X className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" />{selected.email}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{selected.phone}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span className="text-xs">{selected.address}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xl font-display font-semibold">{selected.totalPurchases}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-lg font-display font-semibold">₦{selected.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Lifetime</p>
                </div>
              </div>

              {selected.notes && (
                <div className="mt-4 p-3 bg-accent rounded-lg">
                  <p className="text-xs font-medium text-accent-foreground mb-1">Notes</p>
                  <p className="text-xs text-muted-foreground">{selected.notes}</p>
                </div>
              )}

              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Purchase History</p>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {customerSales.length > 0 ? customerSales.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs py-1.5 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium">{s.date}</p>
                        <p className="text-muted-foreground">{s.products.length} item{s.products.length > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₦{s.total.toFixed(2)}</p>
                        <span className={cn("px-1.5 py-0.5 rounded-full", s.status === 'completed' ? "bg-green-100 text-green-700" : s.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")}>{s.status}</span>
                      </div>
                    </div>
                  )) : <p className="text-xs text-muted-foreground text-center py-2">No purchase history</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Full Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Join Date</Label><Input type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Segment</Label>
              <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v as Customer['segment'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="VIP">VIP</SelectItem><SelectItem value="Regular">Regular</SelectItem><SelectItem value="New">New</SelectItem><SelectItem value="At Risk">At Risk</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">{editingCustomer ? 'Save Changes' : 'Add Customer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
