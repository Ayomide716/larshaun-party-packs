import { useState } from "react";
import { useData } from "@/context/DataContext";
import type { Sale, Expense } from "../data/mockData";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import { Plus, Search, DollarSign, TrendingDown, TrendingUp, Receipt, FileText, X, ShoppingBag, CreditCard, Edit2, Trash2, Loader2 } from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";
import { InvoiceModal } from "@/components/InvoiceModal";
import { ExpenseVoucherModal } from "@/components/ExpenseVoucherModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
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
import { ImportButton } from "@/components/ImportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

const expenseCategories = ["Inventory", "Marketing", "Shipping", "Operations", "Software", "Other"];
const paymentMethods = ["Credit Card", "PayPal", "Bank Transfer", "Cash"];

const emptySaleForm = () => ({ customerId: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Credit Card', status: 'completed' as Sale['status'], invoiceRef: '', items: [{ productId: '', productName: '', qty: 1, price: 0 }] });
const emptyExpenseForm = () => ({ date: new Date().toISOString().split('T')[0], category: 'Inventory', otherCategory: '', description: '', amount: 0, vendor: '', voucherRef: '' });

export default function SalesExpenses() {
  const { sales, addSale, updateSale, deleteSale, expenses, addExpense, updateExpense, deleteExpense, products, addProduct, addProducts, customers, addCustomer, updateProductStock, updateCustomerStats, isLoading } = useData();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [saleStatusFilter, setSaleStatusFilter] = useState('All');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('All');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [saleDialog, setSaleDialog] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [saleForm, setSaleForm] = useState(emptySaleForm());

  const [expenseDialog, setExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm());

  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [invoiceSale, setInvoiceSale] = useState<Sale | null>(null);
  const [voucherExpense, setVoucherExpense] = useState<Expense | null>(null);

  const [deleteSaleTarget, setDeleteSaleTarget] = useState<Sale | null>(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null);

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

  const totalRevenue = filteredSales.filter(s => s.status === 'completed').reduce((s, sale) => s + sale.total, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;

  // --- Sale helpers ---
  const openAddSale = () => { setEditingSale(null); setSaleForm(emptySaleForm()); setSaleDialog(true); };
  const openEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({
      customerId: sale.customerId,
      date: sale.date,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      invoiceRef: sale.invoiceRef || '',
      items: sale.products.map(p => ({ productId: p.productId, productName: p.productName, qty: p.qty, price: p.price }))
    });
    setSaleDialog(true);
  };
  const addSaleItem = () => setSaleForm(f => ({ ...f, items: [...f.items, { productId: '', productName: '', qty: 1, price: 0 }] }));
  const removeSaleItem = (i: number) => setSaleForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateSaleItem = (i: number, field: string, value: string | number) =>
    setSaleForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  // When a product is selected in the edit/add form, auto-fill price and name
  const selectSaleItemProduct = (i: number, productId: string) => {
    if (productId === 'manual') {
      setSaleForm(f => ({
        ...f,
        items: f.items.map((item, idx) => idx === i ? { ...item, productId: 'manual', productName: '', price: 0 } : item)
      }));
      return;
    }
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setSaleForm(f => ({
      ...f,
      items: f.items.map((item, idx) =>
        idx === i ? { ...item, productId: product.id, productName: product.name, price: product.price } : item
      )
    }));
  };

  // Derived totals for the sale form
  const saleFormSubtotal = saleForm.items.reduce((s, i) => s + i.price * i.qty, 0);
  const saleFormTax = saleFormSubtotal * (settings.taxRate / 100);
  const saleFormTotal = saleFormSubtotal + saleFormTax;

  const saveSale = async () => {
    setIsSaving(true);
    try {
      // Handle editing existing sale
      if (editingSale) {
        const customer = customers.find(c => c.id === saleForm.customerId);
        if (!customer) {
          toast.error("Please select a customer");
          return;
        }

        const validItems = saleForm.items.filter(item => item.productId && item.productName);
        if (validItems.length === 0) {
          toast.error('Add at least one valid product.');
          return;
        }

        const subtotal = validItems.reduce((s, i) => s + i.price * i.qty, 0);
        const total = subtotal + subtotal * (settings.taxRate / 100);

        await updateSale(editingSale.id, {
          date: saleForm.date,
          customerId: saleForm.customerId,
          customerName: customer.name,
          products: validItems,
          total,
          status: saleForm.status,
          paymentMethod: saleForm.paymentMethod,
          invoiceRef: saleForm.invoiceRef || undefined
        });

        toast.success('Sale updated successfully.');
        setSaleDialog(false);
        setSaleForm(emptySaleForm());
        setEditingSale(null);
        return;
      }

      // Handle creating a new sale
      const customer = customers.find(c => c.id === saleForm.customerId);
      if (!customer) {
        toast.error("Please select a customer");
        return;
      }

      // Separate manual entries from existing products
      const manualItems = saleForm.items.filter(item => item.productId === 'manual');
      const existingItems = saleForm.items.filter(item => item.productId !== 'manual' && item.productId);

      // Batch-create new products if any
      let newProducts = [];
      if (manualItems.length > 0) {
        const productsToCreate = manualItems.map((item, index) => {
          if (!item.productName || !item.price) throw new Error('Manual product entry is incomplete.');
          return {
            name: item.productName,
            price: item.price,
            category: 'Uncategorized',
            cost: 0,
            stock: item.qty, // Start with the quantity being sold
            minStock: 0,
            sku: `MANUAL-${Date.now()}-${index}`,
            description: 'Added from sales page',
            imageEmoji: '📦'
          };
        });
        newProducts = await addProducts(productsToCreate);
      }

      // Combine newly created products and existing products into the final list for the sale
      const newSaleItems = newProducts.map((newProduct, index) => ({
        productId: newProduct.id,
        productName: newProduct.name,
        qty: manualItems[index].qty,
        price: newProduct.price
      }));

      const existingSaleItems = existingItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error("Product not found"); // Should not happen
        if (product.stock < item.qty) throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
        return { productId: item.productId, productName: product.name, qty: item.qty, price: product.price };
      });

      const finalSaleItems = [...newSaleItems, ...existingSaleItems];
      if (finalSaleItems.length === 0) {
        toast.error('Add at least one valid product.');
        return;
      }

      // Calculate total and create the sale
      const subtotal = finalSaleItems.reduce((s, i) => s + i.price * i.qty, 0);
      const total = subtotal + subtotal * (settings.taxRate / 100);
      await addSale({ date: saleForm.date, customerId: saleForm.customerId, customerName: customer.name, products: finalSaleItems, total, status: saleForm.status, paymentMethod: saleForm.paymentMethod, invoiceRef: saleForm.invoiceRef || undefined });

      // If sale is completed, update stock and customer stats in parallel
      if (saleForm.status === 'completed') {
        const stockUpdatePromises = finalSaleItems.map(item => updateProductStock(item.productId, item.qty));
        const customerStatsUpdatePromise = updateCustomerStats(customer.id, total, saleForm.date);
        await Promise.all([...stockUpdatePromises, customerStatsUpdatePromise]);
        toast.success('Sale recorded and inventory updated.');
      } else {
        toast.success('Pending sale recorded.');
      }

      setSaleDialog(false);
      setSaleForm(emptySaleForm());
    } catch (error: any) { 
      toast.error(error?.message || "Failed to save sale"); 
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteSale = async () => {
    if (!deleteSaleTarget) return;
    setIsDeleting(true);
    try { 
      await deleteSale(deleteSaleTarget.id); 
      toast.success("Sale deleted"); 
    } catch (err: any) { 
      toast.error(err?.message || "Failed to delete sale"); 
    } finally { 
      setDeleteSaleTarget(null); 
      setIsDeleting(false);
    }
  };

  const handleImportSales = async (importedData: any[]) => {
    setIsSaving(true);
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    try {
      const localCustomers = [...customers];
      const localProducts = [...products];
      let columnMap: Record<string, string> = {};

      for (const row of importedData) {
        try {
          const rowKeys = Object.keys(row);
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              if (columnMap[key] && row[columnMap[key]] !== undefined) return row[columnMap[key]];
            }
            const foundKey = rowKeys.find(k => {
              const normalized = k.toLowerCase().trim().replace(/_\d+$/, '').replace(/[^a-z0-9]/g, '');
              return keys.some(target => target.replace(/[^a-z0-9]/g, '') === normalized);
            });
            return foundKey ? row[foundKey] : undefined;
          };

          const findKeyByValueAlias = (aliases: string[]) => {
            const entry = Object.entries(row).find(([_, val]) => {
              const normalizedVal = String(val).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
              return aliases.some(alias => alias.replace(/[^a-z0-9]/g, '') === normalizedVal);
            });
            return entry ? entry[0] : null;
          };

          const custHeaderKey = findKeyByValueAlias(['customername', 'customer', 'client', 'name', 'buyer']);
          const prodHeaderKey = findKeyByValueAlias(['productname', 'product', 'item', 'description', 'particulars', 'items']);
          
          if (custHeaderKey && prodHeaderKey) {
            columnMap['customerName'] = custHeaderKey;
            columnMap['productName'] = prodHeaderKey;
            columnMap['date'] = findKeyByValueAlias(['date', 'saledate', 'time', 'day', 'soldon']) || '';
            columnMap['qty'] = findKeyByValueAlias(['qty', 'quantity', 'count', 'units']) || '';
            columnMap['price'] = findKeyByValueAlias(['price', 'unitprice', 'rate', 'costprice']) || '';
            columnMap['total'] = findKeyByValueAlias(['total', 'amount', 'netamount', 'totalprice']) || '';
            columnMap['paymentMethod'] = findKeyByValueAlias(['paymentmethod', 'payment', 'method', 'payvia']) || '';
            columnMap['status'] = findKeyByValueAlias(['status', 'state', 'condition']) || '';
            columnMap['invoiceRef'] = findKeyByValueAlias(['invoiceref', 'invoice', 'ref', 'orderid', 'orderid']) || '';
            continue;
          }

          const custNameRaw = getVal(['customerName', 'customer', 'client', 'name', 'buyer']);
          const prodNameRaw = getVal(['productName', 'product', 'item', 'description', 'particulars', 'items']);
          
          if (!custNameRaw || !prodNameRaw || String(custNameRaw).toLowerCase().trim() === 'customer') {
            skippedCount++;
            continue;
          }

          const custName = String(custNameRaw).trim();
          const prodName = String(prodNameRaw).trim();

          // 1. Find or create customer
          let customer = localCustomers.find(c => c.name.toLowerCase().trim() === custName.toLowerCase());
          if (!customer) {
            customer = await addCustomer({
              name: custName,
              email: getVal(['email']) || `${custName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
              phone: getVal(['phone', 'telephone', 'mobile']) || '',
              address: getVal(['address', 'location']) || '',
              joinDate: new Date().toISOString().split('T')[0],
              totalPurchases: 0,
              totalSpent: 0,
              lastPurchase: '',
              segment: 'New',
              notes: 'Imported'
            });
            localCustomers.push(customer);
          }

          // 2. Find or create product
          let product = localProducts.find(p => p.name.toLowerCase().trim() === prodName.toLowerCase());
          if (!product) {
            product = await addProduct({
              name: prodName,
              price: parseFloat(getVal(['price', 'unitprice'])) || 0,
              category: getVal(['category']) || 'Uncategorized',
              cost: parseFloat(getVal(['cost'])) || 0,
              stock: 100,
              minStock: 5,
              sku: getVal(['sku', 'code']) || `IMP-${Date.now()}-${importedCount}`,
              description: 'Imported',
              imageEmoji: '📦'
            });
            localProducts.push(product);
          }

          // 3. Create sale
          const qty = parseInt(getVal(['qty', 'quantity'])) || 1;
          const price = parseFloat(getVal(['price', 'unitprice'])) || product.price;
          const total = parseFloat(getVal(['total', 'amount'])) || (price * qty * (1 + settings.taxRate / 100));
          const dateRaw = String(getVal(['date', 'saledate']) || '').trim();
          const status = (String(getVal(['status']) || 'completed').toLowerCase().trim() as Sale['status']);
          
          let date = new Date().toISOString().split('T')[0];
          if (dateRaw) {
            // Intelligent date parser
            const parts = dateRaw.split(/[\/\-.]/);
            if (parts.length === 3) {
              const p0 = parseInt(parts[0]);
              const p1 = parseInt(parts[1]);
              const p2 = parts[2].length === 4 ? parseInt(parts[2]) : (parseInt(parts[2]) + 2000);
              
              // Guess MM/DD/YYYY vs DD/MM/YYYY
              if (p0 > 12) { // Must be DD/MM/YYYY
                date = `${p2}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
              } else if (p1 > 12) { // Must be MM/DD/YYYY
                date = `${p2}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
              } else {
                // Ambiguous, assume MM/DD/YYYY for your current data format (01/20/2026)
                // But check if it's already YYYY-MM-DD
                if (parts[0].length === 4) {
                   date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                } else {
                   date = `${p2}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
                }
              }
            } else if (!isNaN(Date.parse(dateRaw))) {
              date = new Date(dateRaw).toISOString().split('T')[0];
            }
          }

          await addSale({
            date,
            customerId: customer.id,
            customerName: customer.name,
            products: [{ productId: product.id, productName: product.name, qty, price }],
            total,
            status,
            paymentMethod: getVal(['paymentMethod', 'payment', 'method']) || 'Cash',
            invoiceRef: getVal(['invoiceRef', 'invoice', 'orderid']) || undefined
          });

          if (status === 'completed') {
            await updateProductStock(product.id, qty);
            await updateCustomerStats(customer.id, total, date);
            const pIdx = localProducts.findIndex(p => p.id === product.id);
            if (pIdx !== -1) localProducts[pIdx] = { ...localProducts[pIdx], stock: localProducts[pIdx].stock - qty };
          }
          importedCount++;
        } catch (innerError: any) {
          console.error("Error processing row:", row, innerError);
          errorCount++;
        }
      }
      
      if (errorCount > 0 || skippedCount > 0) {
        toast.info(`Import complete: ${importedCount} added, ${skippedCount} skipped, ${errorCount} errors.`);
      } else {
        toast.success(`Successfully imported ${importedCount} sales`);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Critical import error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Expense helpers ---
  const openAddExpense = () => { setEditingExpense(null); setExpenseForm(emptyExpenseForm()); setExpenseDialog(true); };
  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    const isOther = !expenseCategories.includes(expense.category);
    setExpenseForm({ 
      date: expense.date, 
      category: isOther ? 'Other' : expense.category, 
      otherCategory: isOther ? expense.category : '',
      description: expense.description, 
      amount: expense.amount, 
      vendor: expense.vendor, 
      voucherRef: expense.voucherRef || '' 
    });
    setExpenseDialog(true);
  };
  const saveExpense = async () => {
    try {
      const finalCategory = expenseForm.category === 'Other' ? expenseForm.otherCategory : expenseForm.category;
      if (!finalCategory) {
        toast.error("Please provide a category");
        return;
      }

      const expenseData = { ...expenseForm, category: finalCategory };
      delete (expenseData as any).otherCategory;

      if (editingExpense) { await updateExpense(editingExpense.id, expenseData); toast.success("Expense updated"); }
      else { await addExpense(expenseData); toast.success("Expense recorded"); }
      setExpenseDialog(false); setExpenseForm(emptyExpenseForm()); setEditingExpense(null);
    } catch (error: any) { toast.error(error?.message || "Failed to save expense"); }
  };
  const confirmDeleteExpense = async () => {
    if (!deleteExpenseTarget) return;
    try { await deleteExpense(deleteExpenseTarget.id); toast.success("Expense deleted"); }
    catch (err: any) { toast.error(err?.message || "Failed to delete expense"); }
    finally { setDeleteExpenseTarget(null); }
  };


  const statusStyle = (status: string) => cn("text-xs px-2 py-0.5 rounded-full font-medium",
    status === 'completed' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
      status === 'pending' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-destructive/10 text-destructive"
  );


  const handleExportSalesCSV = () => exportToCSV(filteredSales, `sales_export_${new Date().toISOString().split('T')[0]}`);
  const handleExportSalesPDF = () => exportToPDF(['Order ID', 'Date', 'Customer', 'Items', 'Payment', 'Status', 'Total'], filteredSales.map(s => [s.id, s.date, s.customerName, s.products.map(p => p.productName).join(', '), s.paymentMethod, s.status, `${settings.currencySymbol}${s.total.toFixed(2)}`]), 'Sales Report', `sales_${new Date().toISOString().split('T')[0]}`);
  const handleExportExpensesCSV = () => exportToCSV(filteredExpenses, `expenses_export_${new Date().toISOString().split('T')[0]}`);
  const handleExportExpensesPDF = () => exportToPDF(['Date', 'Category', 'Description', 'Vendor', 'Amount'], filteredExpenses.map(e => [e.date, e.category, e.description, e.vendor, `${settings.currencySymbol}${e.amount.toFixed(2)}`]), 'Expenses Report', `expenses_${new Date().toISOString().split('T')[0]}`);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between"><div className="space-y-2"><div className="h-8 w-48 bg-muted animate-pulse rounded-lg" /><div className="h-4 w-64 bg-muted animate-pulse rounded" /></div></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[0,1,2].map(i => <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse h-24" />)}</div>
        <div className="bg-card rounded-2xl border border-border overflow-hidden"><table className="w-full text-sm"><tbody>{[0,1,2,3,4].map(i => <SkeletonTableRow key={i} cols={9} />)}</tbody></table></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">Sales & Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track every transaction and expense</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openAddExpense} variant="outline" size="sm"><TrendingDown className="w-4 h-4 mr-2" />Add Expense</Button>
          <Button onClick={openAddSale} className="bg-primary text-primary-foreground" size="sm"><Plus className="w-4 h-4 mr-2" />Record Sale</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-600" /><span className="text-xs text-muted-foreground">Total Revenue</span></div>
          <p className="text-2xl font-display font-semibold text-emerald-700 dark:text-emerald-400">{settings.currencySymbol}{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Total Expenses</span></div>
          <p className="text-2xl font-display font-semibold text-destructive">{settings.currencySymbol}{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Net Profit (Loss)</span></div>
          <p className={cn("text-2xl font-display font-semibold", profit >= 0 ? "text-primary" : "text-destructive")}>{settings.currencySymbol}{profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sales">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="sales">Sales ({filteredSales.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({filteredExpenses.length})</TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1 shadow-sm h-10">
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Date:</span>
                <Input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="h-7 w-[120px] border-none shadow-none focus-visible:ring-0 p-0 text-xs sm:text-sm bg-transparent" />
                <span className="text-muted-foreground text-sm">-</span>
                <Input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="h-7 w-[120px] border-none shadow-none focus-visible:ring-0 p-0 text-xs sm:text-sm bg-transparent" />
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-52 h-10" />
              </div>
            </div>
          </div>
        </div>

        {/* SALES TAB */}
        <TabsContent value="sales" className="mt-4">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <ImportButton onImport={handleImportSales} label="Import Sales" />
              <ExportButton label="Export Sales" onExportCSV={handleExportSalesCSV} onExportPDF={handleExportSalesPDF} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
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
                  {filteredSales.length === 0 ? (
                    <tr><td colSpan={9}><EmptyState icon={ShoppingBag} title="No sales yet" description="Record your first sale using the button above." /></td></tr>
                  ) : filteredSales.map(sale => (
                    <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{sale.invoiceRef || sale.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sale.date}</td>
                      <td className="px-4 py-3 font-medium">{sale.customerName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{sale.products.map(p => `${p.productName} ×${p.qty}`).join(', ')}</td>
                      <td className="px-4 py-3 text-center font-medium">{sale.products.reduce((acc, p) => acc + p.qty, 0)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sale.paymentMethod}</td>
                      <td className="px-4 py-3"><span className={statusStyle(sale.status)}>{sale.status}</span></td>
                      <td className="px-4 py-3 text-right font-semibold">{settings.currencySymbol}{sale.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" title="Receipt" onClick={() => setReceiptSale(sale)}><Receipt className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" title="Invoice" onClick={() => setInvoiceSale(sale)}><FileText className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => openEditSale(sale)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteSaleTarget(sale)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <div className="flex items-center gap-2">
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
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Voucher No.</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr><td colSpan={6}><EmptyState icon={CreditCard} title="No expenses recorded" description="Log your first business expense using the button above." /></td></tr>
                  ) : filteredExpenses.map(expense => (
                    <tr key={expense.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{expense.date}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{expense.voucherRef || expense.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs">{expense.category}</span></td>
                      <td className="px-4 py-3 font-medium">{expense.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{expense.vendor}</td>
                      <td className="px-4 py-3 text-right font-semibold text-destructive">{settings.currencySymbol}{expense.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => setVoucherExpense(expense)}><FileText className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0" onClick={() => openEditExpense(expense)}><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteExpenseTarget(expense)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {/* Sale Dialog */}
      <Dialog open={saleDialog} onOpenChange={setSaleDialog}>
        <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingSale ? 'Edit Sale' : 'Record New Sale'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Customer */}
            <div className="space-y-1">
              <Label>Customer</Label>
              <Select value={saleForm.customerId} onValueChange={v => setSaleForm(f => ({ ...f, customerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Invoice Reference */}
            <div className="space-y-1">
              <Label>Invoice Reference <span className="text-muted-foreground text-xs font-normal">(optional — auto-assigned if left blank)</span></Label>
              <Input
                value={saleForm.invoiceRef}
                onChange={e => setSaleForm(f => ({ ...f, invoiceRef: e.target.value }))}
                placeholder="e.g. INV-2024-001"
              />
            </div>

            {/* Date + Payment + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            {/* Products */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Products</Label>
                <Button type="button" size="sm" variant="outline" onClick={addSaleItem}><Plus className="w-3 h-3 mr-1" />Add Item</Button>
              </div>
              <div className="space-y-2">
                {saleForm.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {item.productId === 'manual' ? (
                      <>
                        <div className="flex-1 min-w-0 space-y-1">
                          <Label htmlFor={`manual-name-${i}`} className="text-xs">Product Name</Label>
                          <Input id={`manual-name-${i}`} placeholder="Name" value={item.productName} onChange={e => updateSaleItem(i, 'productName', e.target.value)} />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label htmlFor={`manual-price-${i}`} className="text-xs">Price</Label>
                          <Input id={`manual-price-${i}`} type="number" placeholder="Price" value={item.price === 0 ? '' : item.price} onChange={e => updateSaleItem(i, 'price', +e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 min-w-0 space-y-1">
                        <Label htmlFor={`select-product-${i}`} className="text-xs">Product</Label>
                        <Select value={item.productId} onValueChange={v => selectSaleItemProduct(i, v)}>
                          <SelectTrigger id={`select-product-${i}`}><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}<SelectItem value="manual">Manually Add Product...</SelectItem></SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="w-20 space-y-1">
                      <Label htmlFor={`item-qty-${i}`} className="text-xs">Qty</Label>
                      <Input
                        id={`item-qty-${i}`}
                        type="number"
                        inputMode="numeric"
                        value={item.qty === 0 ? '' : item.qty}
                        onChange={e => updateSaleItem(i, 'qty', e.target.value === '' ? 0 : Math.max(1, +e.target.value))}
                        className="text-center"
                      />
                    </div>
                    {saleForm.items.length > 1 && (
                      <div className="pt-5">
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeSaleItem(i)} className="w-8 h-8 p-0 shrink-0">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            {saleFormSubtotal > 0 && (
              <div className="rounded-lg bg-muted/50 border border-border p-3 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{settings.currencySymbol}{saleFormSubtotal.toFixed(2)}</span>
                </div>
                {settings.taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({settings.taxRate}%)</span>
                    <span>{settings.currencySymbol}{saleFormTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1 mt-1">
                  <span>Total</span>
                  <span>{settings.currencySymbol}{saleFormTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSaleDialog(false)}>Cancel</Button>
            <Button onClick={saveSale} className="bg-primary text-primary-foreground" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              {editingSale ? 'Save Changes' : 'Save Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expenseDialog} onOpenChange={setExpenseDialog}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto">
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
            {expenseForm.category === 'Other' && (
              <div className="space-y-1">
                <Label>Custom Category</Label>
                <Input value={expenseForm.otherCategory} onChange={e => setExpenseForm(f => ({ ...f, otherCategory: e.target.value }))} placeholder="Type category name" />
              </div>
            )}
            <div className="col-span-2 space-y-1">
              <Label>Voucher Reference <span className="text-muted-foreground text-xs font-normal">(optional — auto-assigned if left blank)</span></Label>
              <Input value={expenseForm.voucherRef} onChange={e => setExpenseForm(f => ({ ...f, voucherRef: e.target.value }))} placeholder="e.g. EXP-2024-001" />
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
              <Input
                type="number" inputMode="decimal" step="0.01"
              value={expenseForm.amount === 0 ? '' : expenseForm.amount}
                onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value === '' ? 0 : +e.target.value }))}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button>
            <Button onClick={saveExpense} className="bg-primary text-primary-foreground">{editingExpense ? 'Save Changes' : 'Save Expense'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmations */}
      <DeleteConfirmDialog
        open={!!deleteSaleTarget}
        onOpenChange={open => !open && setDeleteSaleTarget(null)}
        title="Delete sale?"
        description={`This sale for ${deleteSaleTarget?.customerName} (${settings.currencySymbol}${deleteSaleTarget?.total.toFixed(2)}) will be permanently removed.`}
        onConfirm={confirmDeleteSale}
        loading={isDeleting}
      />
      <DeleteConfirmDialog
        open={!!deleteExpenseTarget}
        onOpenChange={open => !open && setDeleteExpenseTarget(null)}
        title="Delete expense?"
        description={`"${deleteExpenseTarget?.description}" (${settings.currencySymbol}${deleteExpenseTarget?.amount.toFixed(2)}) will be permanently removed.`}
        onConfirm={confirmDeleteExpense}
      />

      <ReceiptModal sale={receiptSale} open={!!receiptSale} onClose={() => setReceiptSale(null)} />
      <InvoiceModal sale={invoiceSale} open={!!invoiceSale} onClose={() => setInvoiceSale(null)} />
      <ExpenseVoucherModal expense={voucherExpense} open={!!voucherExpense} onClose={() => setVoucherExpense(null)} />
    </div>
  );
}
