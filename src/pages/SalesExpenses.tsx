import { useState } from "react";
import { sales as initialSales, expenses as initialExpenses, Sale, Expense, products, customers } from "@/data/mockData";
import { Plus, Search, DollarSign, TrendingDown, TrendingUp, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const expenseCategories = ["Inventory", "Marketing", "Shipping", "Operations", "Software", "Other"];
const paymentMethods = ["Credit Card", "PayPal", "Bank Transfer", "Cash"];

export default function SalesExpenses() {
  const [sales, setSales] = useState(initialSales);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [search, setSearch] = useState('');
  const [saleDialog, setSaleDialog] = useState(false);
  const [expenseDialog, setExpenseDialog] = useState(false);

  const [saleForm, setSaleForm] = useState({ customerId: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Credit Card', status: 'completed' as Sale['status'], items: [{ productId: '', qty: 1 }] });
  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Inventory', description: '', amount: 0, vendor: '' });

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((s, sale) => s + sale.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const filteredSales = sales.filter(s => s.customerName.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search));
  const filteredExpenses = expenses.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase()));

  const addSaleItem = () => setSaleForm(f => ({ ...f, items: [...f.items, { productId: '', qty: 1 }] }));
  const removeSaleItem = (i: number) => setSaleForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateSaleItem = (i: number, field: string, value: string | number) => setSaleForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const saveSale = () => {
    const customer = customers.find(c => c.id === saleForm.customerId);
    if (!customer) return;
    const saleItems = saleForm.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { productId: item.productId, productName: product?.name || '', qty: item.qty, price: product?.price || 0 };
    }).filter(i => i.productId);
    const total = saleItems.reduce((s, i) => s + i.price * i.qty, 0);
    setSales(prev => [{ id: `s${Date.now()}`, date: saleForm.date, customerId: saleForm.customerId, customerName: customer.name, products: saleItems, total, status: saleForm.status, paymentMethod: saleForm.paymentMethod }, ...prev]);
    setSaleDialog(false);
    setSaleForm({ customerId: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Credit Card', status: 'completed', items: [{ productId: '', qty: 1 }] });
  };

  const saveExpense = () => {
    setExpenses(prev => [{ id: `e${Date.now()}`, ...expenseForm }, ...prev]);
    setExpenseDialog(false);
    setExpenseForm({ date: new Date().toISOString().split('T')[0], category: 'Inventory', description: '', amount: 0, vendor: '' });
  };

  const statusStyle = (status: string) => cn("text-xs px-2 py-0.5 rounded-full font-medium",
    status === 'completed' ? "bg-green-100 text-green-700" :
    status === 'pending' ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700"
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Sales & Expenses</h1>
          <p className="text-muted-foreground mt-1">Track every transaction and expense</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setExpenseDialog(true)} variant="outline"><TrendingDown className="w-4 h-4 mr-2" />Add Expense</Button>
          <Button onClick={() => setSaleDialog(true)} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Record Sale</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-xs text-muted-foreground">Total Revenue</span></div>
          <p className="text-2xl font-display font-semibold text-green-700">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-xs text-muted-foreground">Total Expenses</span></div>
          <p className="text-2xl font-display font-semibold text-red-600">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Net Profit</span></div>
          <p className={cn("text-2xl font-display font-semibold", profit >= 0 ? "text-primary" : "text-destructive")}>${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="sales">Sales ({sales.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
        </div>

        <TabsContent value="sales" className="mt-4">
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{sale.id.toUpperCase()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sale.date}</td>
                      <td className="px-4 py-3 font-medium">{sale.customerName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{sale.products.map(p => `${p.productName} ×${p.qty}`).join(', ')}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sale.paymentMethod}</td>
                      <td className="px-4 py-3"><span className={statusStyle(sale.status)}>{sale.status}</span></td>
                      <td className="px-4 py-3 text-right font-semibold">${sale.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(expense => (
                    <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{expense.date}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs">{expense.category}</span></td>
                      <td className="px-4 py-3 font-medium">{expense.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{expense.vendor}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">${expense.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sale Dialog */}
      <Dialog open={saleDialog} onOpenChange={setSaleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Record New Sale</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Customer</Label>
                <Select value={saleForm.customerId} onValueChange={v => setSaleForm(f => ({ ...f, customerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={saleForm.date} onChange={e => setSaleForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Payment Method</Label>
                <Select value={saleForm.paymentMethod} onValueChange={v => setSaleForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={saleForm.status} onValueChange={v => setSaleForm(f => ({ ...f, status: v as Sale['status'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><Label>Products</Label><Button type="button" size="sm" variant="outline" onClick={addSaleItem}><Plus className="w-3 h-3 mr-1" />Add</Button></div>
              <div className="space-y-2">
                {saleForm.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={item.productId} onValueChange={v => updateSaleItem(i, 'productId', v)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" min={1} value={item.qty} onChange={e => updateSaleItem(i, 'qty', +e.target.value)} className="w-20" />
                    {saleForm.items.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => removeSaleItem(i)} className="w-8 h-8 p-0"><X className="w-3 h-3" /></Button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialog(false)}>Cancel</Button>
            <Button onClick={saveSale} className="bg-primary text-primary-foreground">Save Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Add Expense</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={expenseForm.category} onValueChange={v => setExpenseForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" />
            </div>
            <div className="space-y-1">
              <Label>Vendor</Label>
              <Input value={expenseForm.vendor} onChange={e => setExpenseForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" />
            </div>
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: +e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button>
            <Button onClick={saveExpense} className="bg-primary text-primary-foreground">Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
