
import { DollarSign, Receipt, Target, Wallet } from "lucide-react";
import { MetricWidget } from "./MetricWidget";
import { RevenueTrendWidget } from "./RevenueTrendWidget";
import { RecentInvoicesWidget } from "./RecentInvoicesWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { AlertsWidget } from "./AlertsWidget";
import { ReceivablesWidget } from "./ReceivablesWidget";

export interface WidgetDefinition {
    id: string;
    label: string;
    description?: string;
    component: React.ComponentType<any>;
    defaultSize: "small" | "medium" | "large" | "full"; // Suggestion for UI builder
    mapDataToProps?: (data: any, t?: (key: string) => string) => any;
}

export const widgetRegistry: WidgetDefinition[] = [
    // --- Metric Cards ---
    {
        id: "metric-revenue",
        label: "Revenue Card",
        description: "Displays total revenue and growth trend.",
        component: MetricWidget,
        defaultSize: "small",
        mapDataToProps: (data, t) => ({
            title: t ? t('dashboard.widgets.metric-revenue.label') : "Total Revenue",
            value: data.revenue,
            icon: DollarSign,
            trend: { value: 12.5, isPositive: true }, // Placeholder trend logic
            colorClass: "text-emerald-600",
            delay: 0
        })
    },
    {
        id: "metric-expenses",
        label: "Expenses Card",
        description: "Displays total expenses.",
        component: MetricWidget,
        defaultSize: "small",
        mapDataToProps: (data, t) => ({
            title: t ? t('dashboard.widgets.metric-expenses.label') : "Total Expenses",
            value: data.expenses,
            icon: Receipt,
            trend: { value: 3.2, isPositive: false },
            colorClass: "text-rose-600",
            delay: 0.1
        })
    },
    {
        id: "metric-profit",
        label: "Net Profit Card",
        description: "Displays net profit and margin.",
        component: MetricWidget,
        defaultSize: "small",
        mapDataToProps: (data, t) => {
            const revenue = data.revenue || 0;
            const cogs = data.cogs || 0;
            const expenses = data.expenses || 0;
            const grossProfit = data.grossProfit ?? (revenue - cogs);
            const profit = data.profit ?? (grossProfit - expenses);
            return {
                title: t ? t('dashboard.widgets.metric-profit.label') : "Net Profit",
                value: profit,
                icon: Target,
                colorClass: profit >= 0 ? "text-emerald-600" : "text-rose-600",
                delay: 0.2
            };
        }
    },
    {
        id: "metric-cash",
        label: "Cash Balance Card",
        description: "Displays current cash balance.",
        component: MetricWidget,
        defaultSize: "small",
        mapDataToProps: (data, t) => ({
            title: t ? t('dashboard.widgets.metric-cash.label') : "Cash Balance",
            value: data.cash,
            icon: Wallet,
            trend: { value: 5.4, isPositive: true },
            colorClass: "text-emerald-600",
            delay: 0.3
        })
    },

    // --- Complex Widgets ---
    {
        id: "receivables-summary",
        label: "Receivables Summary",
        description: "Overview of pending, paid, and overdue invoices.",
        component: ReceivablesWidget,
        defaultSize: "medium",
        mapDataToProps: (data) => {
            const unpaid = data.recentInvoices?.filter((i: any) => i.status !== 'PAID') || [];
            const paid = data.recentInvoices?.filter((i: any) => i.status === 'PAID') || [];
            const overdue = data.recentInvoices?.filter((i: any) => i.status === 'OVERDUE') || [];
            const collectionRate = data.recentInvoices?.length
                ? ((paid.length / data.recentInvoices.length) * 100).toFixed(0)
                : 100;

            return {
                pending: data.pending,
                collectionRate,
                paidCount: paid.length,
                pendingCount: unpaid.length,
                overdueCount: overdue.length
            };
        }
    },
    {
        id: "quick-actions",
        label: "Quick Actions",
        description: "Shortcuts for common tasks.",
        component: QuickActionsWidget,
        defaultSize: "medium",
        mapDataToProps: () => ({}) // No data needed
    },
    {
        id: "alerts-feed",
        label: "Alerts & Notifications",
        description: "Critical business alerts.",
        component: AlertsWidget,
        defaultSize: "medium",
        mapDataToProps: (data) => {
            const revenue = data.revenue || 0;
            const cogs = data.cogs || 0;
            const expenses = data.expenses || 0;
            const grossProfit = data.grossProfit ?? (revenue - cogs);
            const profit = data.profit ?? (grossProfit - expenses);

            return {
                overdueInvoices: data.recentInvoices?.filter((i: any) => i.status === 'OVERDUE') || [],
                unpaidInvoices: data.recentInvoices?.filter((i: any) => i.status !== 'PAID') || [],
                profit
            };
        }
    },
    {
        id: "revenue-trend",
        label: "Revenue Trend Chart",
        description: "Monthly revenue bar chart.",
        component: RevenueTrendWidget,
        defaultSize: "medium", // actually takes 2 columns usually
        mapDataToProps: (data) => ({
            data: data.monthlyRevenue || []
        })
    },
    {
        id: "recent-invoices",
        label: "Recent Invoices",
        description: "List of latest invoice transactions.",
        component: RecentInvoicesWidget,
        defaultSize: "medium",
        mapDataToProps: (data) => ({
            invoices: data.recentInvoices || [],
            isLoading: false // handled by parent wrapper usually
        })
    }
];

export function getWidgetById(id: string) {
    return widgetRegistry.find(w => w.id === id);
}
