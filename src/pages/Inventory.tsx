import { useState, useEffect } from "react";
import { Product } from "@/data/mockData";
import { useData } from "@/context/DataContext";
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { ExportButton } from "@/components/ExportButton";
import { ImportButton } from "@/components/ImportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonTableRow } from "@/components/SkeletonCard";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

const DEFAULT_CATEGORIES = ["Reed Diffusers", "Humidifiers", "Kitchen Runners", "Ceramic Vases", "Scented Candles"];
const emojis: Record<string, string> = { "Reed Diffusers": "🌿", "Humidifiers": "💧", "Kitchen Runners": "🏡", "Ceramic Vases": "🏺", "Scented Candles": "🕯️" };

const emptyProduct: Omit<Product, 'id'> = { name: '', category: 'Scented Candles', sku: '', price: 0, cost: 0, stock: 0, minStock: 10, description: '', imageEmoji: '🕯️' };

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyProduct);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { setLowStockAlerts, settings } = useSettings();

  const productCategories = Array.from(new Set(products.map(p => p.category)));
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...productCategories]));

  useEffect(() => {
    if (!settings.notifications.lowStock) return;
    const alerts = products
      .filter(p => p.stock <= p.minStock)
      .map(p => ({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        currentStock: p.stock,
        minStock: p.minStock,
        dismissed: false,
        timestamp: Date.now(),
      }));
    setLowStockAlerts(alerts);
  }, [products, settings.notifications.lowStock, setLowStockAlerts]);

  const filtered = products.filter(p =>
    (categoryFilter === 'All' || p.category === categoryFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setCustomCategoryInput(''); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, sku: p.sku, price: p.price, cost: p.cost, stock: p.stock, minStock: p.minStock, description: p.description, imageEmoji: p.imageEmoji });
    setCustomCategoryInput('');
    setDialogOpen(true);
  };

  const save = async () => {
    const finalCategory = customCategoryInput.trim() || form.category;
    if (!form.name || !form.sku) { toast.error("Product name and SKU are required"); return; }
    try {
      const payload = { ...form, category: finalCategory, imageEmoji: emojis[finalCategory] || '📦' };
      if (editing) {
        await updateProduct(editing.id, payload);
        toast.success("Product updated successfully");
      } else {
        await addProduct(payload);
        toast.success("Product added successfully");
      }
      setDialogOpen(false);
      setCustomCategoryInput('');
    } catch (error: any) {
      toast.error(error?.message || "Failed to save product");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Product deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete product");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleExportCSV = () => exportToCSV(products, `inventory_export_${new Date().toISOString().split('T')[0]}`);
  const handleExportPDF = () => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock'];
    const data = products.map(p => [p.name, p.sku, p.category, `${settings.currency} ${p.price.toFixed(2)}`, `${settings.currency} ${p.cost.toFixed(2)}`, p.stock.toString()]);
    exportToPDF(headers, data, 'Inventory List', `inventory_${new Date().toISOString().split('T')[0]}`);
  };
  const handleImportCSV = async (importedData: any[]) => {
    try {
      for (const p of importedData) {
        if (p.name && p.sku) {
          await addProduct({ name: p.name, category: p.category || 'Other', sku: p.sku, price: parseFloat(p.price) || 0, cost: parseFloat(p.cost) || 0, stock: parseInt(p.stock) || 0, minStock: parseInt(p.minStock) || 10, description: p.description || '', imageEmoji: emojis[p.category] || '📦' });
        }
      }
      toast.success("Import completed");
    } catch { toast.error("Import failed partially"); }
  };

  const totalValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const lowStock = products.filter(p => p.stock <= p.minStock).length;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[0,1,2,3,4].map(i => <div key={i} className="bg-muted animate-pulse rounded-xl h-20" />)}
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm"><tbody>{[0,1,2,3,4].map(i => <SkeletonTableRow key={i} cols={8} />)}</tbody></table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">Product Inventory</h1>
          <p className="text-muted-foreground mt-1 text-sm">{products.length} products · Value: {settings.currencySymbol}{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ImportButton onImport={handleImportCSV} expectedHeaders={['name', 'sku', 'price', 'cost', 'stock']} />
          <ExportButton onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />Add Product
          </Button>
        </div>
      </div>

      {/* Category tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {DEFAULT_CATEGORIES.map(cat => {
          const count = products.filter(p => p.category === cat).length;
          return (
            <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? 'All' : cat)}
              className={cn("bg-card border rounded-xl p-3 text-left transition-all hover:shadow-md", categoryFilter === cat ? "border-primary bg-primary/5" : "border-border")}>
              <span className="text-2xl block mb-1">{emojis[cat]}</span>
              <p className="text-xs text-muted-foreground">{cat}</p>
              <p className="text-sm font-semibold">{count} items</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {lowStock > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            {lowStock} low stock
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Margin</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon={Package} title="No products found" description={search ? "Try a different search term." : "Add your first product to get started."} actionLabel="Add Product" onAction={openAdd} />
                </td></tr>
              ) : filtered.map(p => {
                const margin = ((p.price - p.cost) / p.price * 100).toFixed(0);
                const isLow = p.stock <= p.minStock;
                const stockValue = p.stock * p.cost;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{p.imageEmoji}</span>
                        <div>
                          <p className="font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs">{p.category}</span></td>
                    <td className="px-4 py-3 text-right font-medium">{settings.currencySymbol}{p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{settings.currencySymbol}{p.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-1 bg-[hsl(var(--forest)_/_0.12)] text-[hsl(var(--forest))] rounded-full text-xs font-medium">{margin}%</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-muted-foreground">{settings.currencySymbol}{stockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-semibold", isLow ? "text-destructive" : "text-foreground")}>{p.stock}</span>
                      {isLow && <span className="ml-1 text-xs text-destructive">⚠</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="w-8 h-8 p-0"><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)} className="w-8 h-8 p-0 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Product Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lavender Reed Diffuser" />
            </div>
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="RD-001" />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={customCategoryInput ? '__custom__' : form.category} onValueChange={v => { if (v === '__custom__') return; setCustomCategoryInput(''); setForm(f => ({ ...f, category: v })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__custom__">＋ Add new category…</SelectItem>
                </SelectContent>
              </Select>
              <Input className="mt-2" placeholder="Type a new category name…" value={customCategoryInput} onChange={e => setCustomCategoryInput(e.target.value)} />
              {customCategoryInput.trim() && <p className="text-xs text-muted-foreground mt-1">Will save as: <strong>{customCategoryInput.trim()}</strong></p>}
            </div>
            <div className="space-y-1">
              <Label>Selling Price ({settings.currencySymbol})</Label>
              <Input type="number" inputMode="decimal" value={form.price === 0 ? '' : form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value === '' ? 0 : +e.target.value }))} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-1">
              <Label>Cost Price ({settings.currencySymbol})</Label>
              <Input type="number" inputMode="decimal" value={form.cost === 0 ? '' : form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value === '' ? 0 : +e.target.value }))} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-1">
              <Label>Stock Quantity</Label>
              <Input type="number" inputMode="numeric" value={form.stock === 0 ? '' : form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value === '' ? 0 : +e.target.value }))} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="space-y-1">
              <Label>Min. Stock Alert</Label>
              <Input type="number" inputMode="numeric" value={form.minStock === 0 ? '' : form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value === '' ? 0 : +e.target.value }))} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief product description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground">{editing ? 'Save Changes' : 'Add Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title="Delete product?"
        description={`"${deleteTarget?.name}" will be permanently removed from your inventory.`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
