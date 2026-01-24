
import { widgetRegistry } from "./widgets/registry";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n-context";

interface DashboardGridProps {
    config: { widgets: string[] } | null; // Order of widget IDs
    data: any;
    isLoading: boolean;
}

export const defaultWidgetOrder = [
    "metric-revenue",
    "metric-expenses",
    "metric-profit",
    "metric-cash",
    "receivables-summary",
    "quick-actions",
    "alerts-feed",
    "revenue-trend",
    "recent-invoices"
];

export function DashboardGrid({ config, data, isLoading }: DashboardGridProps) {
    const { t } = useI18n();
    // Use user's config or default
    const widgetIds = config?.widgets || defaultWidgetOrder;

    // Filter valid widgets from registry based on IDs
    // We strictly follow the order in 'widgetIds'
    const activeWidgets = useMemo(() => {
        return widgetIds
            .map(id => widgetRegistry.find(w => w.id === id))
            .filter(Boolean); // Remove invalid/undefined IDs
    }, [widgetIds]);

    if (isLoading && !data) {
        return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
                {activeWidgets.map((widget, index) => {
                    if (!widget) return null; // Should be filtered already
                    const WidgetComponent = widget.component;
                    const props = widget.mapDataToProps ? widget.mapDataToProps(data, t) : {};

                    // Determine grid span based on widget type or logic
                    // Metrics = 1 col, Charts = 2 cols, Lists = 2 cols
                    let colSpan = "col-span-1";
                    if (widget.id === "revenue-trend" || widget.id === "recent-invoices") {
                        colSpan = "lg:col-span-2";
                    }
                    if (widget.id === "receivables-summary" || widget.id === "alerts-feed") {
                        colSpan = "lg:col-span-1 md:col-span-2"; // Wider on medium screens?
                    }

                    return (
                        <div key={widget.id} className={`${colSpan}`}>
                            <WidgetComponent {...props} />
                        </div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
