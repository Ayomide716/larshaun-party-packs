import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, Customer, Sale, Expense } from "@/data/mockData";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface DataContextType {
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    expenses: Expense[];
    isLoading: boolean;
    refreshData: () => Promise<void>;

    // Global mutators
    addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
    addProducts: (products: Omit<Product, 'id'>[]) => Promise<Product[]>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;
    updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;

    addSale: (sale: Omit<Sale, 'id'>) => Promise<Sale>;
    updateSale: (id: string, sale: Partial<Omit<Sale, 'id'>>) => Promise<void>;
    deleteSale: (id: string) => Promise<void>;

    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (id: string, expense: Partial<Omit<Expense, 'id'>>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    updateProductStock: (productId: string, deductedQty: number) => Promise<void>;
    updateCustomerStats: (customerId: string, amountSpent: number, date: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch Products
            const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
            if (productsData) setProducts(productsData.map(p => ({
                ...p,
                minStock: p.min_stock,
                imageEmoji: p.image_emoji
            })));

            // Fetch Customers
            const { data: customersData } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
            if (customersData) setCustomers(customersData.map(c => ({
                ...c,
                joinDate: c.join_date,
                totalPurchases: c.total_purchases,
                totalSpent: c.total_spent,
                lastPurchase: c.last_purchase
            })));

            // Fetch Expenses
            const { data: expensesData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
            if (expensesData) setExpenses(expensesData.map(e => ({ ...e, voucherRef: e.voucher_ref || undefined })));

            // Fetch Sales with items
            const { data: salesData } = await supabase
                .from('sales')
                .select('*, sale_items(*)')
                .order('date', { ascending: false });

            if (salesData) {
                setSales(salesData.map(s => ({
                    ...s,
                    customerId: s.customer_id,
                    customerName: s.customer_name,
                    paymentMethod: s.payment_method,
                    invoiceRef: s.invoice_ref || undefined,
                    products: s.sale_items.map((si: any) => ({
                        productId: si.product_id,
                        productName: si.product_name,
                        qty: si.qty,
                        price: si.price
                    }))
                })));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to sync with database");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setProducts([]);
            setCustomers([]);
            setSales([]);
            setExpenses([]);
            setIsLoading(false);
            return;
        }

        refreshData();

        // REAL-TIME SUBSCRIPTIONS
        const channel = supabase.channel('business-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => refreshData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
        if (!user) throw new Error("Not authenticated");
        const { data, error } = await supabase.from('products').insert({
            user_id: user.id,
            name: product.name,
            category: product.category,
            sku: product.sku,
            price: product.price,
            cost: product.cost,
            stock: product.stock,
            min_stock: product.minStock,
            description: product.description,
            image_emoji: product.imageEmoji
        }).select().single();

        if (error) {
            console.error("Error adding product:", error);
            throw error;
        }
        const newProduct = { ...data, minStock: data.min_stock, imageEmoji: data.image_emoji };
        setProducts(prev => [newProduct, ...prev]);
        return newProduct;
    };

    const addProducts = async (products: Omit<Product, 'id'>[]): Promise<Product[]> => {
      if (!user) throw new Error("Not authenticated");
      if (products.length === 0) return [];
  
      const productsToInsert = products.map(product => ({
          user_id: user.id,
          name: product.name,
          category: product.category,
          sku: product.sku,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          min_stock: product.minStock,
          description: product.description,
          image_emoji: product.imageEmoji
      }));
  
      const { data, error } = await supabase.from('products').insert(productsToInsert).select();
  
      if (error) {
          console.error("Error adding products:", error);
          throw error;
      }
      const newProducts = data.map(p => ({ ...p, minStock: p.min_stock, imageEmoji: p.image_emoji }));
      setProducts(prev => [...newProducts, ...prev]);
      return newProducts;
  };

    const updateProduct = async (id: string, product: Partial<Product>) => {
        const updates: any = { ...product };
        if (product.minStock !== undefined) updates.min_stock = product.minStock;
        if (product.imageEmoji !== undefined) updates.image_emoji = product.imageEmoji;
        delete updates.minStock;
        delete updates.imageEmoji;
        delete updates.id;

        const { error } = await supabase.from('products').update(updates).eq('id', id);
        if (error) throw error;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
    };

    const deleteProduct = async (id: string) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const addCustomer = async (customer: Omit<Customer, 'id'>) => {
        if (!user) return;
        const { data, error } = await supabase.from('customers').insert({
            user_id: user.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            join_date: customer.joinDate || null,
            total_purchases: customer.totalPurchases,
            total_spent: customer.totalSpent,
            last_purchase: customer.lastPurchase || null,
            segment: customer.segment,
            notes: customer.notes
        }).select().single();

        if (error) {
            console.error("Error adding customer:", error);
            throw error;
        }
        if (data) {
            const newCustomer = {
                ...data,
                joinDate: data.join_date,
                totalPurchases: data.total_purchases,
                totalSpent: data.total_spent,
                lastPurchase: data.last_purchase
            };
            setCustomers(prev => [newCustomer, ...prev]);
            return newCustomer;
        }
        throw new Error("Failed to add customer");
    };

    const updateCustomer = async (id: string, customer: Partial<Customer>) => {
        const updates: any = { ...customer };
        if (customer.joinDate !== undefined) updates.join_date = customer.joinDate || null;
        if (customer.totalPurchases !== undefined) updates.total_purchases = customer.totalPurchases;
        if (customer.totalSpent !== undefined) updates.total_spent = customer.totalSpent;
        if (customer.lastPurchase !== undefined) updates.last_purchase = customer.lastPurchase || null;

        delete updates.joinDate;
        delete updates.totalPurchases;
        delete updates.totalSpent;
        delete updates.lastPurchase;
        delete updates.id;

        const { error } = await supabase.from('customers').update(updates).eq('id', id);
        if (error) {
            console.error("Error updating customer:", error);
            throw error;
        }
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...customer } : c));
    };

    const deleteCustomer = async (id: string) => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) {
            console.error("Error deleting customer:", error);
            throw error;
        }
        setCustomers(prev => prev.filter(c => c.id !== id));
    };

    const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
        if (!user) throw new Error("Not authenticated");
        // 1. Insert sale — invoice_ref requires running supabase_invoice_ref_migration.sql first
        const salePayload: any = {
            user_id: user.id,
            date: sale.date || null,
            customer_id: sale.customerId,
            customer_name: sale.customerName,
            total: sale.total,
            status: sale.status,
            payment_method: sale.paymentMethod,
            invoice_ref: sale.invoiceRef || null,
        };

        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert(salePayload)
            .select()
            .single();

        if (saleError) {
            // If error is about missing invoice_ref column, retry without it
            if (saleError.message?.includes('invoice_ref')) {
                delete salePayload.invoice_ref;
                const { data: retryData, error: retryError } = await supabase
                    .from('sales')
                    .insert(salePayload)
                    .select()
                    .single();
                if (retryError) { console.error("Error adding sale:", retryError); throw retryError; }
                const saleItems2 = sale.products.map(p => ({
                    sale_id: retryData.id,
                    product_id: p.productId,
                    product_name: p.productName,
                    qty: p.qty,
                    price: p.price
                }));
                const { error: ie2 } = await supabase.from('sale_items').insert(saleItems2);
                if (ie2) throw ie2;
                const newSale = { ...sale, id: retryData.id };
                setSales(prev => [newSale, ...prev]);
                return newSale;
            }
            console.error("Error adding sale:", saleError);
            throw saleError;
        }

        // 2. Insert sale items
        const saleItems = sale.products.map(p => ({
            sale_id: saleData.id,
            product_id: p.productId,
            product_name: p.productName,
            qty: p.qty,
            price: p.price
        }));

        const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
        if (itemsError) {
            console.error("Error adding sale items:", itemsError);
            throw itemsError;
        }

        const newSale = { ...sale, id: saleData.id };
        setSales(prev => [newSale, ...prev]);
        return newSale;
    };

    const addExpense = async (expense: Omit<Expense, 'id'>) => {
        if (!user) return;
        const expensePayload: any = {
            user_id: user.id,
            date: expense.date || null,
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            vendor: expense.vendor,
            voucher_ref: expense.voucherRef || null
        };

        const { data, error } = await supabase.from('expenses').insert(expensePayload).select().single();

        if (error) {
            // If error is about missing voucher_ref column, retry without it
            if (error.message?.includes('voucher_ref')) {
                console.log("Retrying expense insert without voucher_ref due to missing column");
                delete expensePayload.voucher_ref;
                const { data: retryData, error: retryError } = await supabase.from('expenses').insert(expensePayload).select().single();
                if (retryError) { console.error("Error adding expense (retry):", retryError); throw retryError; }
                if (retryData) setExpenses(prev => [{ ...retryData, voucherRef: undefined }, ...prev]);
                return;
            }
            console.error("Error adding expense:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            console.error("Expense payload:", JSON.stringify(expensePayload, null, 2));
            throw error;
        }
        if (data) setExpenses(prev => [{ ...data, voucherRef: data.voucher_ref || undefined }, ...prev]);
    };

    const updateExpense = async (id: string, expense: Partial<Omit<Expense, 'id'>>) => {
        const updates: any = {};
        if (expense.date !== undefined) updates.date = expense.date || null;
        if (expense.category !== undefined) updates.category = expense.category;
        if (expense.description !== undefined) updates.description = expense.description;
        if (expense.amount !== undefined) updates.amount = expense.amount;
        if (expense.vendor !== undefined) updates.vendor = expense.vendor;
        if (expense.voucherRef !== undefined) updates.voucher_ref = expense.voucherRef || null;
        
        const { error } = await supabase.from('expenses').update(updates).eq('id', id);
        if (error) {
            // Gracefully retry without voucher_ref if column doesn't exist yet
            if (error.message?.includes('voucher_ref')) {
                delete updates.voucher_ref;
                const { error: retryError } = await supabase.from('expenses').update(updates).eq('id', id);
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...expense } : e));
    };

    const deleteExpense = async (id: string) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const updateSale = async (id: string, sale: Partial<Omit<Sale, 'id'>>) => {
        const updates: any = {};
        if (sale.date !== undefined) updates.date = sale.date || null;
        if (sale.total !== undefined) updates.total = sale.total;
        if (sale.status !== undefined) updates.status = sale.status;
        if (sale.customerId !== undefined) updates.customer_id = sale.customerId;
        if (sale.customerName !== undefined) updates.customer_name = sale.customerName;
        if (sale.paymentMethod !== undefined) updates.payment_method = sale.paymentMethod;
        if (sale.invoiceRef !== undefined) updates.invoice_ref = sale.invoiceRef || null;

        const { error } = await supabase.from('sales').update(updates).eq('id', id);
        if (error) {
            // Gracefully retry without invoice_ref if column doesn't exist yet
            if (error.message?.includes('invoice_ref')) {
                delete updates.invoice_ref;
                const { error: retryError } = await supabase.from('sales').update(updates).eq('id', id);
                if (retryError) throw retryError;
            } else {
                throw error;
            }
        }

        // If products are being updated, replace sale_items
        if (sale.products) {
            await supabase.from('sale_items').delete().eq('sale_id', id);
            const saleItems = sale.products.map(p => ({
                sale_id: id,
                product_id: p.productId,
                product_name: p.productName,
                qty: p.qty,
                price: p.price
            }));
            const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
            if (itemsError) throw itemsError;
        }

        setSales(prev => prev.map(s => s.id === id ? { ...s, ...sale } : s));
    };

    const deleteSale = async (id: string) => {
        // Delete sale items first, then the sale
        await supabase.from('sale_items').delete().eq('sale_id', id);
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) throw error;
        setSales(prev => prev.filter(s => s.id !== id));
    };

    const updateProductStock = async (productId: string, deductedQty: number) => {
        // We need to get the latest stock value to update the database correctly.
        // Using a functional update for setProducts ensures local state is correct.
        setProducts(prev => {
            const product = prev.find(p => p.id === productId);
            if (!product) return prev;
            const newStock = product.stock - deductedQty;
            
            // Side effect inside setstate is generally discouraged but here we need 
            // the specific calculated value for the database update.
            // A better way is to do the calculation once and use it for both.
            return prev.map(p => p.id === productId ? { ...p, stock: newStock } : p);
        });

        // For the database, we fetch the latest to be safe or use what we calculated.
        // Given the current architecture, we'll fetch the latest from the database or 
        // trust the local state if it's been kept in sync.
        // To be truly safe for bulk imports, we should use functional updates.
        
        const { data: currentProduct } = await supabase.from('products').select('stock').eq('id', productId).single();
        if (currentProduct) {
            const newStock = currentProduct.stock - deductedQty;
            await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        }
    };

    const updateCustomerStats = async (customerId: string, amountSpent: number, date: string) => {
        const { data: customer } = await supabase.from('customers').select('total_purchases, total_spent').eq('id', customerId).single();
        if (!customer) return;

        const newStats = {
            total_purchases: customer.total_purchases + 1,
            total_spent: customer.total_spent + amountSpent,
            last_purchase: date
        };

        const { error } = await supabase.from('customers').update(newStats).eq('id', customerId);
        if (error) throw error;

        setCustomers(prev => prev.map(c => c.id === customerId ? {
            ...c,
            totalPurchases: newStats.total_purchases,
            totalSpent: newStats.total_spent,
            lastPurchase: date
        } : c));
    };

    return (
        <DataContext.Provider value={{
            products, customers, sales, expenses, isLoading, refreshData,
            addProduct, addProducts, updateProduct, deleteProduct,
            addCustomer, updateCustomer, deleteCustomer,
            addSale, updateSale, deleteSale,
            addExpense, updateExpense, deleteExpense,
            updateProductStock, updateCustomerStats
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error("useData must be used within DataProvider");
    return ctx;
}
