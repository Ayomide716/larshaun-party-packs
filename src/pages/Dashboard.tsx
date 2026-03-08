import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, Users, AlertTriangle, Star } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useData } from "@/context/DataContext";
import { useSettings } from "@/context/SettingsContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getMonthlyStats, getCategoryStats } from "@/lib/dataUtils";
import { SkeletonDashboard } from "@/components/SkeletonCard";

export default function Dashboard() {
  const { sales, expenses, products, customers, isLoading } = useData();
  const { settings } = useSettings();

  if (isLoading) return <SkeletonDashboard />;

  const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const vipCustomers = customers.filter(c => c.segment === "VIP").length;
  const recentSales = sales.slice(0, 5);
  const monthlyData = getMonthlyStats(sales, expenses);
  const categoryData = getCategoryStats(sales, products);

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

  const currentMonthOrders = sales.filter(s => s.date.startsWith(new Date().toISOString().slice(0, 7))).length;
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const prevMonthOrders = sales.filter(s => s.date.startsWith(lastMonthDate.toISOString().slice(0, 7))).length;
  const ordersChange = calculateChange(currentMonthOrders, prevMonthOrders);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back. Here's what's happening today.</p>
      </div>

      {/* KPI Cards — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Revenue" value={`${settings.currencySymbol}${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change={`${revenueChange} from last month`} changeType={currentMonthData.revenue >= prevMonthData.revenue ? "positive" : "negative"} icon={DollarSign} iconColor="bg-primary/10" />
        <StatCard title="Net Profit" value={`${settings.currencySymbol}${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change={`${profitChange} from last month`} changeType={currentMonthData.profit >= prevMonthData.profit ? "positive" : "negative"} icon={TrendingUp} iconColor="bg-green-100" />
        <StatCard title="Total Expenses" value={`${settings.currencySymbol}${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change={`${expenseChange} from last month`} changeType={currentMonthData.expenses <= prevMonthData.expenses ? "positive" : "negative"} icon={BarChart3} iconColor="bg-orange-100" />
        <StatCard title="Total Orders" value={String(sales.length)} change={prevMonthOrders === 0 ? `+${currentMonthOrders} this month` : `${ordersChange} from last month`} changeType={currentMonthOrders >= prevMonthOrders ? "positive" : "negative"} icon={ShoppingCart} iconColor="bg-blue-100" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Active Customers" value={String(customers.length)} change={`${vipCustomers} VIP`} changeType="positive" icon={Users} iconColor="bg-purple-100" />
        <StatCard title="Products Listed" value={String(products.length)} description="Across 5 categories" icon={Package} iconColor="bg-teal-100" />
        <StatCard title="Low Stock Alerts" value={String(lowStockCount)} changeType="negative" change="Needs attention" icon={AlertTriangle} iconColor="bg-red-100" />
        <StatCard title="Margin Rate" value={`${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%`} change="Healthy" changeType="positive" icon={Star} iconColor="bg-yellow-100" />
      </div>

      {/* Charts — stacked on mobile, side by side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4 text-sm sm:text-base">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${settings.currencySymbol}${v}`} width={55} />
              <Tooltip formatter={(v: number) => [`${settings.currencySymbol}${v}`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4 text-sm sm:text-base">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="revenue">
                {categoryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${settings.currencySymbol}${v.toFixed(0)}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.slice(0, 5).map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-muted-foreground truncate max-w-[90px]">{c.name}</span>
                </div>
                <span className="font-medium">{c.value.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales & Low Stock — stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4 text-sm sm:text-base">Recent Sales</h3>
          <div className="space-y-3">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-sm font-medium text-foreground truncate">{sale.customerName}</p>
                  <p className="text-xs text-muted-foreground">{sale.date} · {sale.products.length} item{sale.products.length > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold">{settings.currencySymbol}{sale.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{sale.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4 text-sm sm:text-base">⚠️ Low Stock Alerts</h3>
          <div className="space-y-3">
            {products.filter(p => p.stock <= p.minStock).map(product => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-3">
                  <span className="text-xl flex-shrink-0">{product.imageEmoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
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
