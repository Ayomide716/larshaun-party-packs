import { useState } from "react";
import { useData } from "@/context/DataContext";
import { useSettings } from "@/context/SettingsContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart, Loader2 } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { getMonthlyStats, getCategoryStats } from "@/lib/dataUtils";

export default function Reports() {
  const { sales, expenses, products, customers, isLoading } = useData();
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-medium">Generating reports...</span>
      </div>
    );
  }

  const topCustomersData = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  // Real aggregated data
  const monthlyRevenue = getMonthlyStats(sales, expenses);
  const categoryStats = getCategoryStats(sales, products);

  const expenseByCategory = Object.entries(
    expenses.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ["hsl(15,55%,42%)", "hsl(145,25%,28%)", "hsl(40,75%,52%)", "hsl(20,15%,35%)", "hsl(36,25%,65%)", "hsl(200,50%,45%)"];

  const totalRevenue = sales.filter(s => s.status === "completed").reduce((s, sale) => s + sale.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalRevenue - totalExpenses;
  const margin = ((profit / totalRevenue) * 100).toFixed(1);
  const avgOrderValue = totalRevenue / sales.filter(s => s.status === "completed").length;

  const bestProduct = [...products].sort((a, b) => (b.price - b.cost) - (a.price - a.cost))[0];
  const atRiskCount = customers.filter(c => c.segment === "At Risk").length;
  const vipRevenue = customers.filter(c => c.segment === "VIP").reduce((s, c) => s + c.totalSpent, 0);

  const handleExportCSV = () => {
    // Exporting the monthly revenue as a generic summary representation
    exportToCSV(monthlyRevenue, `business_report_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = ['Metric', 'Value'];
    const data = [
      ['Total Revenue', `${settings.currencySymbol}${totalRevenue.toFixed(2)}`],
      ['Total Expenses', `${settings.currencySymbol}${totalExpenses.toFixed(2)}`],
      ['Net Profit', `${settings.currencySymbol}${profit.toFixed(2)}`],
      ['Profit Margin', `${margin}%`],
      ['Average Order Value', `${settings.currencySymbol}${avgOrderValue.toFixed(2)}`],
      ['VIP Revenue', `${settings.currencySymbol}${vipRevenue.toFixed(2)}`],
      ['At-Risk Customers', atRiskCount.toString()]
    ];
    exportToPDF(headers, data, 'Business Overview Report', `report_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive analysis of your business performance</p>
        </div>
        <ExportButton label="Export Report" onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
      </div>

      {/* KPI Summary */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Financial Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `${settings.currencySymbol}${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-700", bg: "bg-green-50" },
            { label: "Net Profit", value: `${settings.currencySymbol}${profit.toFixed(2)}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Expenses", value: `${settings.currencySymbol}${totalExpenses.toFixed(2)}`, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
            { label: "Profit Margin", value: `${margin}%`, icon: ShoppingCart, color: "text-blue-700", bg: "bg-blue-50" },
          ].map(item => (
            <div key={item.label} className="bg-card border border-border rounded-2xl p-4 shadow-[var(--shadow-card)]">
              <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <p className={`text-2xl font-display font-semibold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
        <h3 className="font-display font-semibold mb-4">Monthly Performance Trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(15,55%,42%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(15,55%,42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145,25%,28%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(145,25%,28%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${settings.currencySymbol}${v}`} />
            <Tooltip formatter={(v: number) => [`${settings.currencySymbol}${v}`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(15,55%,42%)" fill="url(#gradRevenue)" strokeWidth={2} name="Revenue" />
            <Area type="monotone" dataKey="profit" stroke="hsl(145,25%,28%)" fill="url(#gradProfit)" strokeWidth={2} name="Profit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryStats} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `${settings.currencySymbol}${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip formatter={(v: number) => [`${settings.currencySymbol}${v.toFixed(0)}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold mb-4">Expenses by Category</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${settings.currencySymbol}${v}`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {expenseByCategory.map((e, i) => (
                <div key={e.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{e.name}</span>
                  </div>
                  <span className="font-medium">{settings.currencySymbol}{e.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Customer Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {[
            { label: "Avg. Order Value", value: `${settings.currencySymbol}${avgOrderValue.toFixed(2)}`, desc: "Per completed sale" },
            { label: "VIP Revenue", value: `${settings.currencySymbol}${vipRevenue.toFixed(2)}`, desc: `${customers.filter(c => c.segment === "VIP").length} VIP customers` },
            { label: "At-Risk Customers", value: String(atRiskCount), desc: "Require re-engagement" },
          ].map(item => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-4 shadow-[var(--shadow-card)]">
              <p className="text-2xl font-display font-semibold text-foreground">{item.value}</p>
              <p className="text-sm font-medium mt-1">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold mb-4">Top Customers by Lifetime Value</h3>
          <div className="space-y-3">
            {topCustomersData.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-xs font-semibold flex-shrink-0">
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-sm font-semibold">{settings.currencySymbol}{c.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(c.totalSpent / topCustomersData[0].totalSpent) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Performance */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Product Performance</h2>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Margin</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Value</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...products].sort((a, b) => ((b.price - b.cost) / b.price) - ((a.price - a.cost) / a.price)).map(p => {
                  const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
                  const stockValue = (p.stock * p.cost).toFixed(2);
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.imageEmoji}</span>
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">{settings.currencySymbol}{p.price.toFixed(2)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{settings.currencySymbol}{p.cost.toFixed(2)}</td>
                      <td className="py-2.5 text-right"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{margin}%</span></td>
                      <td className="py-2.5 text-right">{settings.currencySymbol}{stockValue}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
