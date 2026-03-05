import { Sale, Expense, Product } from "@/data/mockData";

export interface MonthlyStats {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export function getMonthlyStats(sales: Sale[], expenses: Expense[]): MonthlyStats[] {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(currentMonth - i);
        const monthName = months[d.getMonth()];
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        const monthlySales = sales.filter(s => s.date.startsWith(yearMonth) && s.status === 'completed');
        const monthlyExpenses = expenses.filter(e => e.date.startsWith(yearMonth));

        const revenue = monthlySales.reduce((sum, s) => sum + s.total, 0);
        const expenseTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

        last6Months.push({
            month: monthName,
            revenue,
            expenses: expenseTotal,
            profit: revenue - expenseTotal
        });
    }

    return last6Months;
}

export interface CategoryStat {
    name: string;
    value: number; // For Pie Chart (percentage or count)
    revenue: number;
    units: number;
    color?: string;
}

const COLORS = [
    "hsl(15,55%,42%)",
    "hsl(145,25%,28%)",
    "hsl(40,75%,52%)",
    "hsl(20,15%,35%)",
    "hsl(36,25%,65%)",
    "hsl(200,50%,45%)"
];

export function getCategoryStats(sales: Sale[], products: Product[]): CategoryStat[] {
    const categories: Record<string, { revenue: number, units: number }> = {};

    // Initialize with all product categories
    products.forEach(p => {
        if (!categories[p.category]) {
            categories[p.category] = { revenue: 0, units: 0 };
        }
    });

    // Aggregate from sales
    sales.filter(s => s.status === 'completed').forEach(sale => {
        sale.products.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const category = product ? product.category : "Other";

            if (!categories[category]) {
                categories[category] = { revenue: 0, units: 0 };
            }

            categories[category].revenue += item.price * item.qty;
            categories[category].units += item.qty;
        });
    });

    const totalRevenue = Object.values(categories).reduce((sum, c) => sum + c.revenue, 0);

    return Object.entries(categories).map(([name, data], i) => ({
        name,
        revenue: data.revenue,
        units: data.units,
        value: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        color: COLORS[i % COLORS.length]
    })).sort((a, b) => b.revenue - a.revenue);
}
