import { useState } from "react";
import { useData } from "@/context/DataContext";
import type { Customer } from "../data/mockData";
import { useSettings } from "@/context/SettingsContext";
import { Plus, Search, Mail, Phone, MapPin, Edit2, X, Users, ChevronLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { EmptyState } from "@/components/EmptyState";
import { SkeletonStatCard } from "@/components/SkeletonCard";

const segmentColors: Record<string, string> = {
  VIP: "bg-yellow-100 text-yellow-800",
  Regular: "bg-blue-100 text-blue-700",
  New: "bg-green-100 text-green-700",
  "At Risk": "bg-red-100 text-red-700",
};

const emptyCustomer: Omit<Customer, 'id'> = {
  name: '', email: '', phone: '', address: '',
  joinDate: new Date().toISOString().split('T')[0],
  totalPurchases: 0, totalSpent: 0, lastPurchase: '', segment: 'New', notes: '',
};

export default function CRM() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, sales, isLoading } = useData();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Omit<Customer, 'id'>>(emptyCustomer);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerIdToDelete, setCustomerIdToDelete] = useState<string | null>(null);

  const filtered = customers.filter(c =>
    (segmentFilter === 'All' || c.segment === segmentFilter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const selected = customers.find(c => c.id === selectedId) || null;
  const customerSales = selected ? sales.filter(s => s.customerId === selected.id) : [];

  const openAdd = () => { setEditingCustomer(null); setForm(emptyCustomer); setDialogOpen(true); };
  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, joinDate: c.joinDate, totalPurchases: c.totalPurchases, totalSpent: c.totalSpent, lastPurchase: c.lastPurchase, segment: c.segment, notes: c.notes });
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      if (editingCustomer) { await updateCustomer(editingCustomer.id, form); toast.success("Customer updated"); }
      else { await addCustomer(form); toast.success("Customer added"); }
      setDialogOpen(false);
    } catch { toast.error("Failed to save customer"); }
  };

  const handleDelete = (id: string) => {
    setCustomerIdToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerIdToDelete) return;
    try {
      await deleteCustomer(customerIdToDelete);
      toast.success("Customer deleted");
      setSelectedId(null);
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to delete customer");
    } finally {
      setCustomerIdToDelete(null);
    }
  };

  const handleExportCSV = () => exportToCSV(customers, `customers_export_${new Date().toISOString().split('T')[0]}`);
  const handleExportPDF = () => {
    exportToPDF(['Name', 'Email', 'Phone', 'Segment', 'Total Spent', 'Orders'], customers.map(c => [c.name, c.email, c.phone, c.segment, `${settings.currency} ${c.totalSpent.toFixed(2)}`, c.totalPurchases.toString()]), 'Customer List', `customers_${new Date().toISOString().split('T')[0]}`);
  };
  const handleImportCSV = async (importedData: any[]) => {
    try {
      const localCustomers = [...customers];
      for (const c of importedData) {
        if (c.name && c.email) {
          const existing = localCustomers.find(lc => lc.name.toLowerCase() === c.name.toLowerCase() || lc.email.toLowerCase() === c.email.toLowerCase());
          if (existing) continue;

          const newCustomer = await addCustomer({ 
            name: c.name, 
            email: c.email, 
            phone: c.phone || '', 
            address: c.address || '', 
            joinDate: c.joinDate || new Date().toISOString().split('T')[0], 
            totalPurchases: parseInt(c.totalPurchases) || 0, 
            totalSpent: parseFloat(c.totalSpent) || 0, 
            lastPurchase: c.lastPurchase || '', 
            segment: (c.segment as Customer['segment']) || 'New', 
            notes: c.notes || '' 
          });
          localCustomers.push(newCustomer);
        }
      }
      toast.success("Import completed");
    } catch { toast.error("Import failed partially"); }
  };

  const segmentCounts = { VIP: customers.filter(c => c.segment === 'VIP').length, Regular: customers.filter(c => c.segment === 'Regular').length, New: customers.filter(c => c.segment === 'New').length, "At Risk": customers.filter(c => c.segment === 'At Risk').length };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}</div>
        <div className="space-y-3">{[0,1,2,3].map(i => <div key={i} className="bg-muted animate-pulse rounded-xl h-20" />)}</div>
      </div>
    );
  }

  // On mobile, when a customer is selected show the detail panel full-screen
  const showDetailMobile = !!selected;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">Customer CRM</h1>
          <p className="text-muted-foreground mt-1 text-sm">{customers.length} customers · {settings.currencySymbol}{customers.reduce((s, c) => s + c.totalSpent, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} lifetime value</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportButton onImport={handleImportCSV} expectedHeaders={['name', 'email', 'phone']} />
          <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button onClick={openAdd} className="bg-primary text-primary-foreground" size="sm"><Plus className="w-4 h-4 mr-2" />Add Customer</Button>
        </div>
      </div>

      {/* Segment tiles — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(segmentCounts) as [string, number][]).map(([seg, count]) => (
          <button key={seg} onClick={() => setSegmentFilter(segmentFilter === seg ? 'All' : seg)}
            className={cn("bg-card border rounded-xl p-3 sm:p-4 text-left transition-all hover:shadow-md", segmentFilter === seg ? "border-primary bg-primary/5" : "border-border")}>
            <p className="text-xl sm:text-2xl font-display font-semibold">{count}</p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block", segmentColors[seg])}>{seg}</span>
          </button>
        ))}
      </div>

      {/* Mobile: show detail panel as overlay when selected */}
      {showDetailMobile && (
        <div className="sm:hidden bg-card rounded-2xl border border-border shadow-[var(--shadow-elevated)] p-4">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="mb-3 -ml-1 text-muted-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" />Back to list
          </Button>
          <CustomerDetail selected={selected!} customerSales={customerSales} settings={settings} segmentColors={segmentColors} onEdit={openEdit} onDelete={handleDelete} onClose={() => setSelectedId(null)} />
        </div>
      )}

      {/* Main layout: list + sidebar on sm+ */}
      <div className={cn("flex gap-4", showDetailMobile && "hidden sm:flex")}>
        {/* Customer List */}
        <div className="flex-1 min-w-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <EmptyState icon={Users} title="No customers found" description={search ? "Try a different search term." : "Add your first customer to get started."} actionLabel="Add Customer" onAction={openAdd} />
            ) : filtered.map(c => (
              <div key={c.id} onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                className={cn("bg-card border rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all", selectedId === c.id ? "border-primary bg-primary/5" : "border-border")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", segmentColors[c.segment])}>{c.segment}</span>
                    <p className="text-sm font-semibold mt-1">{settings.currencySymbol}{c.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{c.totalPurchases} orders</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Detail — sidebar on sm+, hidden on mobile (shown above instead) */}
        {selected && (
          <div className="hidden sm:block w-72 lg:w-80 flex-shrink-0">
            <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-elevated)] p-5 sticky top-20">
              <CustomerDetail selected={selected} customerSales={customerSales} settings={settings} segmentColors={segmentColors} onEdit={openEdit} onDelete={handleDelete} onClose={() => setSelectedId(null)} />
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
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
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">{editingCustomer ? 'Save Changes' : 'Add Customer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Delete Customer
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete this customer? This action will permanently remove the customer record and all associated history. This action cannot be undone.
          </div>
          <DialogFooter className="flex-row gap-3 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
            <Button onClick={confirmDelete} variant="destructive" className="flex-1 sm:flex-none">Delete Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted detail panel to avoid duplication between mobile/desktop renders
function CustomerDetail({ selected, customerSales, settings, segmentColors, onEdit, onDelete, onClose }: {
  selected: Customer;
  customerSales: any[];
  settings: any;
  segmentColors: Record<string, string>;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
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
          <Button size="sm" variant="ghost" onClick={() => onEdit(selected)} className="w-7 h-7 p-0 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(selected.id)} className="w-7 h-7 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="w-7 h-7 p-0 hidden sm:flex text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{selected.email}</span></div>
        <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{selected.phone}</div>
        <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span className="text-xs">{selected.address}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-xl font-display font-semibold">{selected.totalPurchases}</p>
          <p className="text-xs text-muted-foreground">Orders</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-lg font-display font-semibold">{settings.currencySymbol}{selected.totalSpent.toFixed(0)}</p>
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
                <p className="font-semibold">{settings.currencySymbol}{s.total.toFixed(2)}</p>
                <span className={cn("px-1.5 py-0.5 rounded-full", s.status === 'completed' ? "bg-green-100 text-green-700" : s.status === 'pending' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")}>{s.status}</span>
              </div>
            </div>
          )) : <p className="text-xs text-muted-foreground text-center py-2">No purchase history</p>}
        </div>
      </div>
    </>
  );
}
