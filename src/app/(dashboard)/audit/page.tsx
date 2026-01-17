"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import {
    History,
    Filter,
    Search,
    FileText,
    Receipt,
    Users,
    BookOpen,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    Edit,
    Trash,
} from "lucide-react";

interface AuditEvent {
    id: string;
    timestamp: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName: string;
    userId: string;
    userName: string;
    changes: any;
    ipAddress: string;
}

export default function AuditTrailPage() {
    const { t, locale } = useI18n();
    const [entityFilter, setEntityFilter] = useState("");
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["audit-trail", entityFilter, page],
        queryFn: () =>
            fetch(`/api/audit?entityType=${entityFilter}&page=${page}&limit=20`).then((r) => r.json()),
    });

    const getActionIcon = (action: string) => {
        switch (action) {
            case "CREATE":
                return <Plus className="w-4 h-4" />;
            case "UPDATE":
                return <Edit className="w-4 h-4" />;
            case "DELETE":
                return <Trash className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case "CREATE":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "UPDATE":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "DELETE":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getEntityIcon = (entityType: string) => {
        switch (entityType) {
            case "INVOICE":
                return <FileText className="w-5 h-5 text-blue-500" />;
            case "EXPENSE":
                return <Receipt className="w-5 h-5 text-orange-500" />;
            case "CLIENT":
                return <Users className="w-5 h-5 text-purple-500" />;
            case "JOURNAL_ENTRY":
                return <BookOpen className="w-5 h-5 text-green-500" />;
            default:
                return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const entityTypes = [
        { value: "", label: "All Types" },
        { value: "INVOICE", label: "Invoices" },
        { value: "EXPENSE", label: "Expenses" },
        { value: "CLIENT", label: "Clients" },
        { value: "JOURNAL_ENTRY", label: "Journal Entries" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Audit Trail</h1>
                    <p className="text-muted-foreground">Track all changes made to your data</p>
                </div>
            </div>

            {/* Stats Cards */}
            {data?.stats && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg border border-border p-4">
                        <History className="w-8 h-8 text-primary mb-2" />
                        <p className="text-2xl font-bold">{data.stats.totalEvents}</p>
                        <p className="text-sm text-muted-foreground">Total Events</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <Clock className="w-8 h-8 text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">{data.stats.todayEvents}</p>
                        <p className="text-sm text-muted-foreground">Today</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <Plus className="w-8 h-8 text-green-500 mb-2" />
                        <p className="text-2xl font-bold">{data.stats.actionCounts?.CREATE || 0}</p>
                        <p className="text-sm text-muted-foreground">Created</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <Edit className="w-8 h-8 text-orange-500 mb-2" />
                        <p className="text-2xl font-bold">{data.stats.actionCounts?.UPDATE || 0}</p>
                        <p className="text-sm text-muted-foreground">Updated</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background"
                    />
                </div>
                <select
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                    className="px-4 py-2 border border-border rounded-lg bg-background"
                >
                    {entityTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Events List */}
            <div className="bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold">Activity Log</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : (data?.events || []).length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No audit events found
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {(data?.events || []).map((event: AuditEvent) => (
                            <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    {/* Entity Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                        {getEntityIcon(event.entityType)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(event.action)}`}>
                                                {getActionIcon(event.action)}
                                                {event.action}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {event.entityType.replace("_", " ")}
                                            </span>
                                        </div>
                                        <p className="font-medium">
                                            {event.entityName}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>{formatDate(event.timestamp)}</span>
                                            <span>by {event.userName}</span>
                                            <span>IP: {event.ipAddress}</span>
                                        </div>
                                    </div>

                                    {/* Changes Preview */}
                                    {event.changes && (
                                        <div className="text-xs text-muted-foreground bg-muted rounded-lg p-2 max-w-[200px]">
                                            {Object.entries(event.changes).slice(0, 2).map(([key, value]) => (
                                                <div key={key} className="truncate">
                                                    <span className="font-medium">{key}:</span> {String(value)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {data?.pagination && data.pagination.pages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {data.pagination.page} of {data.pagination.pages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="p-2 border border-border rounded-lg disabled:opacity-50 hover:bg-muted"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                                disabled={page === data.pagination.pages}
                                className="p-2 border border-border rounded-lg disabled:opacity-50 hover:bg-muted"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
