import { BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, Users, AlertTriangle, Star } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { sales, expenses, products, customers } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { month: "Jul", revenue: 2840, expenses: 1820 },
  { month: "Aug", revenue: 3120, expenses: 1950 },
  { month: "Sep", revenue: 2690, expenses: 2280 },
  { month: "Oct", revenue: 3890, expenses: 2100 },
  { month: "Nov", revenue: 4280, expenses: 2380 },
];

const categoryData = [
  { name: "Candles", value: 35, color: "hsl(15,55%,42%)" },
  { name: "Diffusers", value: 25, color: "hsl(145,25%,28%)" },
  { name: "Humidifiers", value: 22, color: "hsl(40,75%,52%)" },
  { name: "Vases", value: 12, color: "hsl(20,15%,15%)" },
  { name: "Runners", value: 6, color: "hsl(36,25%,70%)" },
];

export default function Dashboard() {
  const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const vipCustomers = customers.filter(c => c.segment === "VIP").length;
  const recentSales = sales.slice(0, 5);
  const topProducts = [...products].sort((a, b) => (b.price - b.cost) - (a.price - a.cost)).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`₦${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change="+18.2%" changeType="positive" icon={DollarSign} iconColor="bg-primary/10" />
        <StatCard title="Net Profit" value={`₦${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change="+12.5%" changeType="positive" icon={TrendingUp} iconColor="bg-green-100" />
        <StatCard title="Total Expenses" value={`₦${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change="+4.1%" changeType="negative" icon={BarChart3} iconColor="bg-orange-100" />
        <StatCard title="Total Orders" value={String(sales.length)} change="+8 this month" changeType="positive" icon={ShoppingCart} iconColor="bg-blue-100" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Customers" value={String(customers.length)} change={`${vipCustomers} VIP`} changeType="positive" icon={Users} iconColor="bg-purple-100" />
        <StatCard title="Products Listed" value={String(products.length)} description="Across 5 categories" icon={Package} iconColor="bg-teal-100" />
        <StatCard title="Low Stock Alerts" value={String(lowStockCount)} changeType="negative" change="Needs attention" icon={AlertTriangle} iconColor="bg-red-100" />
        <StatCard title="Margin Rate" value={`${((totalProfit / totalRevenue) * 100).toFixed(1)}%`} change="Healthy" changeType="positive" icon={Star} iconColor="bg-yellow-100" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v}`} />
              <Tooltip formatter={(v: number) => [`₦${v}`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-foreground mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-medium">{c.value}%</span>
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
                  <p className="text-sm font-semibold">₦{sale.total.toFixed(2)}</p>
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
