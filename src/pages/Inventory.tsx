import { useState, useEffect } from "react";
import { products as initialProducts, Product } from "@/data/mockData";
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

const categories = ["Reed Diffusers", "Humidifiers", "Kitchen Runners", "Ceramic Vases", "Scented Candles"];
const emojis: Record<string, string> = { "Reed Diffusers": "🌿", "Humidifiers": "💧", "Kitchen Runners": "🏡", "Ceramic Vases": "🏺", "Scented Candles": "🕯️" };

const emptyProduct: Omit<Product, 'id'> = { name: '', category: 'Scented Candles', sku: '', price: 0, cost: 0, stock: 0, minStock: 10, description: '', imageEmoji: '🕯️' };

export default function Inventory() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyProduct);
  const { setLowStockAlerts, settings } = useSettings();

  // Sync low-stock alerts whenever products change
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

  const openAdd = () => { setEditing(null); setForm(emptyProduct); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, category: p.category, sku: p.sku, price: p.price, cost: p.cost, stock: p.stock, minStock: p.minStock, description: p.description, imageEmoji: p.imageEmoji }); setDialogOpen(true); };

  const save = () => {
    if (editing) {
      setProducts(ps => ps.map(p => p.id === editing.id ? { ...p, ...form, imageEmoji: emojis[form.category] || '📦' } : p));
    } else {
      setProducts(ps => [...ps, { ...form, id: `p${Date.now()}`, imageEmoji: emojis[form.category] || '📦' }]);
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => setProducts(ps => ps.filter(p => p.id !== id));

  const totalValue = products.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const lowStock = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Product Inventory</h1>
          <p className="text-muted-foreground mt-1">{products.length} products · Inventory value: ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />Add Product
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {categories.map(cat => {
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
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
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
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Margin</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const margin = ((p.price - p.cost) / p.price * 100).toFixed(0);
                const isLow = p.stock <= p.minStock;
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
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs">{p.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">${p.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-1 bg-[hsl(var(--forest)_/_0.12)] text-[hsl(var(--forest))] rounded-full text-xs font-medium">{margin}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-semibold", isLow ? "text-destructive" : "text-foreground")}>{p.stock}</span>
                      {isLow && <span className="ml-1 text-xs text-destructive">⚠</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="w-8 h-8 p-0">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="w-8 h-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
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
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Selling Price ($)</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Cost Price ($)</Label>
              <Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: +e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Stock Quantity</Label>
              <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Min. Stock Alert</Label>
              <Input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: +e.target.value }))} />
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
    </div>
  );
}
