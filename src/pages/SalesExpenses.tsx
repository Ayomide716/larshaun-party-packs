import { useState } from "react";
import { useData } from "@/context/DataContext";
import type { Sale, Expense } from "../data/mockData";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import { Plus, Search, DollarSign, TrendingDown, TrendingUp, Receipt, FileText, X, ShoppingBag, CreditCard, Edit2, Trash2 } from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { ExpenseVoucherModal } from "@/components/ExpenseVoucherModal";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonTableRow } from "@/components/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

const expenseCategories = ["Inventory", "Marketing", "Shipping", "Operations", "Software", "Other"];
const paymentMethods = ["Credit Card", "PayPal", "Bank Transfer", "Cash"];

const emptySaleForm = () => ({
  customerId: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'Credit Card',
  status: 'completed' as Sale['status'],
  items: [{ productId: '', qty: 1 }]
});

const emptyExpenseForm = () => ({
  date: new Date().toISOString().split('T')[0],
  category: 'Inventory',
  description: '',
  amount: 0,
  vendor: ''
});

export default function SalesExpenses() {
  const { sales, addSale, updateSale, deleteSale, expenses, addExpense, updateExpense, deleteExpense, products, customers, updateProductStock, updateCustomerStats, isLoading } = useData();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [saleStatusFilter, setSaleStatusFilter] = useState('All');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');

  // Sale dialog state
  const [saleDialog, setSaleDialog] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleForm, setSaleForm] = useState(emptySaleForm());

  // Expense dialog state
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm());

  // Receipt / voucher modal
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [voucherExpense, setVoucherExpense] = useState<Expense | null>(null);

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((s, sale) => s + sale.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = saleStatusFilter === 'All' || s.status === saleStatusFilter;
    const matchesDate = (!dateRange.start || s.date >= dateRange.start) && (!dateRange.end || s.date <= dateRange.end);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = expenseCategoryFilter === 'All' || e.category === expenseCategoryFilter;
    const matchesDate = (!dateRange.start || e.date >= dateRange.start) && (!dateRange.end || e.date <= dateRange.end);
    return matchesSearch && matchesCategory && matchesDate;
  });

  // --- Sale helpers ---
  const openAddSale = () => {
    setEditingSale(null);
    setSaleForm(emptySaleForm());
    setSaleDialog(true);
  };

  const openEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({
      customerId: sale.customerId,
      date: sale.date,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      items: sale.products.map(p => ({ productId: p.productId, qty: p.qty }))
    });
    setSaleDialog(true);
  };

  const addSaleItem = () => setSaleForm(f => ({ ...f, items: [...f.items, { productId: '', qty: 1 }] }));
  const removeSaleItem = (i: number) => setSaleForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateSaleItem = (i: number, field: string, value: string | number) =>
    setSaleForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const saveSale = async () => {
    if (editingSale) {
      // Edit: only update metadata fields (status, date, paymentMethod)
      try {
        await updateSale(editingSale.id, {
          date: saleForm.date,
          status: saleForm.status,
          paymentMethod: saleForm.paymentMethod,
        });
        toast.success("Sale updated");
        setSaleDialog(false);
      } catch (err: any) {
        toast.error(err?.message || "Failed to update sale");
      }
      return;
    }

    // New sale
    const customer = customers.find(c => c.id === saleForm.customerId);
    if (!customer) { toast.error("Please select a customer"); return; }

    const saleItems = [];
    for (const item of saleForm.items) {
      if (!item.productId) continue;
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;
      if (product.stock < item.qty) {
        toast.error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
        return;
      }
      saleItems.push({ productId: item.productId, productName: product.name, qty: item.qty, price: product.price });
    }

    if (saleItems.length === 0) { toast.error('Add at least one valid product.'); return; }

    const total = saleItems.reduce((s, i) => s + i.price * i.qty, 0);

    try {
      await addSale({ date: saleForm.date, customerId: saleForm.customerId, customerName: customer.name, products: saleItems, total, status: saleForm.status, paymentMethod: saleForm.paymentMethod });
      if (saleForm.status === 'completed') {
        for (const i of saleItems) await updateProductStock(i.productId, i.qty);
        await updateCustomerStats(customer.id, total, saleForm.date);
        toast.success('Sale recorded and inventory updated.');
      } else {
        toast.success('Pending sale recorded.');
      }
      setSaleDialog(false);
      setSaleForm(emptySaleForm());
    } catch (error: any) {
      toast.error(error?.message || "Failed to save sale");
    }
  };

  const removeSale = async (id: string) => {
    try {
      await deleteSale(id);
      toast.success("Sale deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete sale");
    }
  };

  // --- Expense helpers ---
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm(emptyExpenseForm());
    setExpenseDialog(true);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({ date: expense.date, category: expense.category, description: expense.description, amount: expense.amount, vendor: expense.vendor });
    setExpenseDialog(true);
  };

  const saveExpense = async () => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseForm);
        toast.success("Expense updated");
      } else {
        await addExpense(expenseForm);
        toast.success("Expense recorded");
      }
      setExpenseDialog(false);
      setExpenseForm(emptyExpenseForm());
      setEditingExpense(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save expense");
    }
  };

  const removeExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete expense");
    }
  };

  const statusStyle = (status: string) => cn("text-xs px-2 py-0.5 rounded-full font-medium",
    status === 'completed' ? "bg-green-100 text-green-700" :
      status === 'pending' ? "bg-yellow-100 text-yellow-700" :
        "bg-red-100 text-red-700"
  );

  const handleExportSalesCSV = () => exportToCSV(filteredSales, `sales_export_${new Date().toISOString().split('T')[0]}`);
  const handleExportSalesPDF = () => {
    exportToPDF(
      ['Order ID', 'Date', 'Customer', 'Items', 'Payment', 'Status', 'Total'],
      filteredSales.map(s => [s.id, s.date, s.customerName, s.products.map(p => p.productName).join(', '), s.paymentMethod, s.status, `${settings.currencySymbol}${s.total.toFixed(2)}`]),
      'Sales Report', `sales_${new Date().toISOString().split('T')[0]}`
    );
  };

  const handleExportExpensesCSV = () => exportToCSV(filteredExpenses, `expenses_export_${new Date().toISOString().split('T')[0]}`);
  const handleExportExpensesPDF = () => {
    exportToPDF(
      ['Date', 'Category', 'Description', 'Vendor', 'Amount'],
      filteredExpenses.map(e => [e.date, e.category, e.description, e.vendor, `${settings.currencySymbol}${e.amount.toFixed(2)}`]),
      'Expenses Report', `expenses_${new Date().toISOString().split('T')[0]}`
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map(i => <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse h-24" />)}
        </div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>{[0,1,2,3,4].map(i => <SkeletonTableRow key={i} cols={9} />)}</tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Sales & Expenses</h1>
          <p className="text-muted-foreground mt-1">Track every transaction and expense</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddExpense} variant="outline"><TrendingDown className="w-4 h-4 mr-2" />Add Expense</Button>
          <Button onClick={openAddSale} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Record Sale</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-xs text-muted-foreground">Total Revenue</span></div>
          <p className="text-2xl font-display font-semibold text-green-700">{settings.currencySymbol}{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-xs text-muted-foreground">Total Expenses</span></div>
          <p className="text-2xl font-display font-semibold text-red-600">{settings.currencySymbol}{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Net Profit</span></div>
          <p className={cn("text-2xl font-display font-semibold", profit >= 0 ? "text-primary" : "text-destructive")}>{settings.currencySymbol}{profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="sales">Sales ({filteredSales.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({filteredExpenses.length})</TabsTrigger>
          </TabsList>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1 shadow-sm h-10">
              <span className="text-xs text-muted-foreground font-medium">Date:</span>
              <Input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="h-7 w-[130px] border-none shadow-none focus-visible:ring-0 p-0 text-sm bg-transparent" />
              <span className="text-muted-foreground text-sm">-</span>
              <Input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="h-7 w-[130px] border-none shadow-none focus-visible:ring-0 p-0 text-sm bg-transparent" />
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full md:w-56 h-10" />
            </div>
          </div>
        </div>

        {/* SALES TAB */}
        <TabsContent value="sales" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">Status:</span>
              <Select value={saleStatusFilter} onValueChange={setSaleStatusFilter}>
                <SelectTrigger className="w-[130px] h-9 bg-card"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ExportButton label="Export Sales" onExportCSV={handleExportSalesCSV} onExportPDF={handleExportSalesPDF} />
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [0,1,2,3].map(i => <SkeletonTableRow key={i} cols={9} />)
                  ) : filteredSales.length === 0 ? (
                    <tr><td colSpan={9}>
                      <EmptyState icon={ShoppingBag} title="No sales yet" description="Record your first sale using the button above." />
                    </td></tr>
                  ) : filteredSales.map(sale => (
                    <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{sale.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sale.date}</td>
                      <td className="px-4 py-3 font-medium">{sale.customerName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{sale.products.map(p => `${p.productName} ×${p.qty}`).join(', ')}</td>
                      <td className="px-4 py-3 text-center font-medium">{sale.products.reduce((acc, p) => acc + p.qty, 0)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sale.paymentMethod}</td>
                      <td className="px-4 py-3"><span className={statusStyle(sale.status)}>{sale.status}</span></td>
                      <td className="px-4 py-3 text-right font-semibold">{settings.currencySymbol}{sale.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => setReceiptSale(sale)}>
                            <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => openEditSale(sale)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-destructive hover:text-destructive" onClick={() => removeSale(sale.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">Category:</span>
              <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                <SelectTrigger className="w-[140px] h-9 bg-card"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ExportButton label="Export Expenses" onExportCSV={handleExportExpensesCSV} onExportPDF={handleExportExpensesPDF} />
          </div>
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
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr><td colSpan={6}>
                      <EmptyState icon={CreditCard} title="No expenses recorded" description="Log your first business expense using the button above." />
                    </td></tr>
                  ) : filteredExpenses.map(expense => (
                    <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{expense.date}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs">{expense.category}</span></td>
                      <td className="px-4 py-3 font-medium">{expense.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{expense.vendor}</td>
                      <td className="px-4 py-3 text-right font-semibold text-destructive">{settings.currencySymbol}{expense.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => setVoucherExpense(expense)}>
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => openEditExpense(expense)}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-destructive hover:text-destructive" onClick={() => removeExpense(expense.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sale Dialog (Add / Edit) */}
      <Dialog open={saleDialog} onOpenChange={setSaleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editingSale ? 'Edit Sale' : 'Record New Sale'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              {!editingSale && (
                <div className="col-span-2 space-y-1">
                  <Label>Customer</Label>
                  <Select value={saleForm.customerId} onValueChange={v => setSaleForm(f => ({ ...f, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
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
            {!editingSale && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Products</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addSaleItem}><Plus className="w-3 h-3 mr-1" />Add</Button>
                </div>
                <div className="space-y-2">
                  {saleForm.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select value={item.productId} onValueChange={v => updateSaleItem(i, 'productId', v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" min={1} value={item.qty} onChange={e => updateSaleItem(i, 'qty', +e.target.value)} className="w-20" />
                      {saleForm.items.length > 1 && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeSaleItem(i)} className="w-8 h-8 p-0">
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialog(false)}>Cancel</Button>
            <Button onClick={saveSale} className="bg-primary text-primary-foreground">{editingSale ? 'Save Changes' : 'Save Sale'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog (Add / Edit) */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
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
              <Label>Amount ({settings.currencySymbol})</Label>
              <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: +e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button>
            <Button onClick={saveExpense} className="bg-primary text-primary-foreground">{editingExpense ? 'Save Changes' : 'Save Expense'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptModal sale={receiptSale} open={!!receiptSale} onClose={() => setReceiptSale(null)} />
      <ExpenseVoucherModal expense={voucherExpense} open={!!voucherExpense} onClose={() => setVoucherExpense(null)} />
    </div>
  );
}
