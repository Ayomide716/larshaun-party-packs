import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, Users, AlertTriangle, Star, Loader2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useData } from "@/context/DataContext";
import { useSettings } from "@/context/SettingsContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { getMonthlyStats, getCategoryStats } from "@/lib/dataUtils";

export default function Dashboard() {
  const { sales, expenses, products, customers, isLoading } = useData();
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-medium">Loading your dashboard...</span>
      </div>
    );
  }
  const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const vipCustomers = customers.filter(c => c.segment === "VIP").length;
  const recentSales = sales.slice(0, 5);
  // Real aggregated data
  const monthlyData = getMonthlyStats(sales, expenses);
  const categoryData = getCategoryStats(sales, products);
  const topProducts = [...products].sort((a, b) => (b.price - b.cost) - (a.price - a.cost)).slice(0, 5);

  // Trend Calculations
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const prevMonthData = monthlyData[monthlyData.length - 2];

  const calculateChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - prev) / prev) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const revenueChange = calculateChange(currentMonthData.revenue, prevMonthData.revenue);
  const profitChange = calculateChange(currentMonthData.profit, prevMonthData.profit);
  const expenseChange = calculateChange(currentMonthData.expenses, prevMonthData.expenses);

  // Real orders count for current and prev month
  const currentMonthOrders = sales.filter(s => s.date.startsWith(new Date().toISOString().slice(0, 7))).length;
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthPrefix = lastMonthDate.toISOString().slice(0, 7);
  const prevMonthOrders = sales.filter(s => s.date.startsWith(lastMonthPrefix)).length;
  const ordersChange = prevMonthOrders === 0 ? `+${currentMonthOrders} this month` : calculateChange(currentMonthOrders, prevMonthOrders);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${settings.currencySymbol}${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${revenueChange} from last month`}
          changeType={currentMonthData.revenue >= prevMonthData.revenue ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="bg-primary/10"
        />
        <StatCard
          title="Net Profit"
          value={`${settings.currencySymbol}${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${profitChange} from last month`}
          changeType={currentMonthData.profit >= prevMonthData.profit ? "positive" : "negative"}
          icon={TrendingUp}
          iconColor="bg-green-100"
        />
        <StatCard
          title="Total Expenses"
          value={`${settings.currencySymbol}${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${expenseChange} from last month`}
          changeType={currentMonthData.expenses <= prevMonthData.expenses ? "positive" : "negative"}
          icon={BarChart3}
          iconColor="bg-orange-100"
        />
        <StatCard
          title="Total Orders"
          value={String(sales.length)}
          change={prevMonthOrders === 0 ? `+${currentMonthOrders} this month` : `${ordersChange} from last month`}
          changeType={currentMonthOrders >= prevMonthOrders ? "positive" : "negative"}
          icon={ShoppingCart}
          iconColor="bg-blue-100"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Customers" value={String(customers.length)} change={`${vipCustomers} VIP`} changeType="positive" icon={Users} iconColor="bg-purple-100" />
        <StatCard title="Products Listed" value={String(products.length)} description="Across 5 categories" icon={Package} iconColor="bg-teal-100" />
        <StatCard title="Low Stock Alerts" value={String(lowStockCount)} changeType="negative" change="Needs attention" icon={AlertTriangle} iconColor="bg-red-100" />
        <StatCard title="Margin Rate" value={`${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%`} change="Healthy" changeType="positive" icon={Star} iconColor="bg-yellow-100" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${settings.currencySymbol}${v}`} />
              <Tooltip formatter={(v: number) => [`${settings.currencySymbol}${v}`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="revenue">
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${settings.currencySymbol}${v.toFixed(0)}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.slice(0, 5).map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-muted-foreground truncate max-w-[100px]">{c.name}</span>
                </div>
                <span className="font-medium">{c.value.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{sale.customerName}</p>
                  <p className="text-xs text-muted-foreground">{sale.date} · {sale.products.length} item{sale.products.length > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{settings.currencySymbol}{sale.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{sale.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4">⚠️ Low Stock Alerts</h3>
          <div className="space-y-3">
            {products.filter(p => p.stock <= p.minStock).map(product => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{product.imageEmoji}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">{product.stock} left</p>
                  <p className="text-xs text-muted-foreground">Min: {product.minStock}</p>
                </div>
              </div>
            ))}
            {products.filter(p => p.stock <= p.minStock).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">All products are well-stocked ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
