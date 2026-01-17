"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Mail, Phone, Building2, FileText, DollarSign, Eye, Edit2, Trash2, X, Star, MapPin, Globe, Download, Upload, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { useI18n } from "@/lib/i18n-context";

interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address?: string | null;
    website?: string | null;
    contactPerson?: string | null;
    invoiceCount: number;
    totalRevenue: number;
    creditLimit?: number;
    outstandingBalance?: number;
    tags?: string[];
}

interface ClientDetails {
    invoices: { id: string; number: string; amount: number; status: string; date: string }[];
    payments: { id: string; amount: number; date: string; method: string }[];
    notes: { id: string; text: string; date: string; author: string }[];
}

const fetchClients = async (): Promise<Client[]> => {
    const res = await fetch("/api/clients");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

// Mock client details
const MOCK_DETAILS: ClientDetails = {
    invoices: [
        { id: "1", number: "INV-2024-001", amount: 5000, status: "PAID", date: "2024-12-01" },
        { id: "2", number: "INV-2024-012", amount: 3500, status: "PENDING", date: "2024-12-10" },
        { id: "3", number: "INV-2024-018", amount: 7800, status: "OVERDUE", date: "2024-11-15" },
    ],
    payments: [
        { id: "1", amount: 5000, date: "2024-12-05", method: "Bank Transfer" },
        { id: "2", amount: 2000, date: "2024-11-20", method: "Check" },
    ],
    notes: [
        { id: "1", text: "Preferred contact via email", date: "2024-12-01", author: "Admin" },
        { id: "2", text: "Discussed new project scope", date: "2024-11-15", author: "Sales" },
    ],
};

const CLIENT_TAGS = ["VIP", "New", "Corporate", "SMB", "Retail", "Inactive"];

export default function ClientsPage() {
    const { t, locale } = useI18n();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsTab, setDetailsTab] = useState<"overview" | "invoices" | "payments" | "notes">("overview");
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"name" | "revenue" | "invoices">("name");
    const [newNote, setNewNote] = useState("");

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: fetchClients,
    });

    // Enhance mock clients with additional data
    const enhancedClients = clients.map((client, i) => ({
        ...client,
        creditLimit: 50000,
        outstandingBalance: Math.random() * 10000,
        tags: i % 3 === 0 ? ["VIP"] : i % 2 === 0 ? ["Corporate"] : ["SMB"],
        contactPerson: `Contact Person ${i + 1}`,
        address: "123 Business Street, City",
        website: "www.company.com",
    }));

    const filteredClients = enhancedClients
        .filter((client) => {
            const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase()) ||
                (client.email && client.email.toLowerCase().includes(search.toLowerCase()));
            const matchesTag = !tagFilter || client.tags?.includes(tagFilter);
            return matchesSearch && matchesTag;
        })
        .sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
            return b.invoiceCount - a.invoiceCount;
        });

    const totalRevenue = enhancedClients.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalOutstanding = enhancedClients.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    const vipCount = enhancedClients.filter(c => c.tags?.includes("VIP")).length;

    const handleExport = () => {
        const csv = enhancedClients.map(c =>
            `${c.name},${c.email || ""},${c.phone || ""},${c.totalRevenue},${c.invoiceCount}`
        ).join("\n");
        const blob = new Blob([`Name,Email,Phone,Revenue,Invoices\n${csv}`], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clients.csv";
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("clients.title")}</h1>
                    <p className="text-muted-foreground">{locale === "ar" ? "إدارة علاقات العملاء" : "Manage your client relationships."}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex h-9 items-center gap-2 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted"
                    >
                        <Download className="h-4 w-4" />
                        {t("common.export")}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t("clients.addClient")}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "إجمالي العملاء" : "Total Clients"}</p>
                    <p className="text-2xl font-semibold">{enhancedClients.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-green-50 p-4">
                    <p className="text-sm text-green-700">{t("clients.totalRevenue")}</p>
                    <p className="text-2xl font-semibold text-green-700">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="rounded-xl border border-border bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">{t("clients.outstanding")}</p>
                    <p className="text-2xl font-semibold text-amber-700">{formatCurrency(totalOutstanding)}</p>
                </div>
                <div className="rounded-xl border border-border bg-purple-50 p-4">
                    <p className="text-sm text-purple-700">{locale === "ar" ? "عملاء VIP" : "VIP Clients"}</p>
                    <p className="text-2xl font-semibold text-purple-700">{vipCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={locale === "ar" ? "البحث عن العملاء..." : "Search clients..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="flex gap-2">
                    {CLIENT_TAGS.slice(0, 4).map(tag => (
                        <button
                            key={tag}
                            onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${tagFilter === tag
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:bg-muted"
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                    <option value="name">{locale === "ar" ? "ترتيب حسب الاسم" : "Sort by Name"}</option>
                    <option value="revenue">{locale === "ar" ? "ترتيب حسب الإيرادات" : "Sort by Revenue"}</option>
                    <option value="invoices">{locale === "ar" ? "ترتيب حسب الفواتير" : "Sort by Invoices"}</option>
                </select>
            </div>

            {/* Client Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-6">
                            <div className="h-6 w-32 skeleton rounded mb-2" />
                            <div className="h-4 w-48 skeleton rounded mb-4" />
                            <div className="h-4 w-24 skeleton rounded" />
                        </div>
                    ))
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                        {locale === "ar" ? "لا يوجد عملاء" : "No clients found"}
                    </div>
                ) : (
                    filteredClients.map((client, index) => (
                        <motion.div
                            key={client.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-1">
                                    {client.tags?.map(tag => (
                                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${tag === "VIP" ? "bg-purple-100 text-purple-700" :
                                            tag === "Corporate" ? "bg-blue-100 text-blue-700" :
                                                "bg-gray-100 text-gray-700"
                                            }`}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <h3 className="font-semibold mb-1">{client.name}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {client.email}
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {client.phone}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}</p>
                                    <p className="font-semibold">{formatCurrency(client.totalRevenue)}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setShowDetailsModal(true);
                                        }}
                                        className="p-2 hover:bg-muted rounded-lg"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 hover:bg-muted rounded-lg">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Modal */}
            <AddClientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />

            {/* Client Details Modal */}
            {showDetailsModal && selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl p-6 max-w-3xl w-full mx-4 border border-border max-h-[80vh] overflow-hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">{selectedClient.name}</h2>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {selectedClient.tags?.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-muted rounded text-xs">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-4 border-b border-border">
                            {(["overview", "invoices", "payments", "notes"] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setDetailsTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${detailsTab === tab
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-auto">
                            {detailsTab === "overview" && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-medium">{locale === "ar" ? "معلومات الاتصال" : "Contact Information"}</h3>
                                        <div className="space-y-2 text-sm">
                                            {selectedClient.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    {selectedClient.email}
                                                </div>
                                            )}
                                            {selectedClient.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    {selectedClient.phone}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                {selectedClient.address || (locale === "ar" ? "لا يوجد عنوان" : "No address")}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                {selectedClient.website || (locale === "ar" ? "لا يوجد موقع" : "No website")}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-medium">{locale === "ar" ? "الملخص المالي" : "Financial Summary"}</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground">{locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}</p>
                                                <p className="font-semibold">{formatCurrency(selectedClient.totalRevenue)}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground">{locale === "ar" ? "المستحق" : "Outstanding"}</p>
                                                <p className="font-semibold text-amber-600">{formatCurrency(selectedClient.outstandingBalance || 0)}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground">{locale === "ar" ? "حد الائتمان" : "Credit Limit"}</p>
                                                <p className="font-semibold">{formatCurrency(selectedClient.creditLimit || 0)}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-xs text-muted-foreground">{locale === "ar" ? "الفواتير" : "Invoices"}</p>
                                                <p className="font-semibold">{selectedClient.invoiceCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailsTab === "invoices" && (
                                <div className="space-y-3">
                                    {MOCK_DETAILS.invoices.map(inv => (
                                        <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{inv.number}</p>
                                                <p className="text-xs text-muted-foreground">{inv.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(inv.amount)}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === "PAID" ? "bg-green-100 text-green-700" :
                                                    inv.status === "OVERDUE" ? "bg-red-100 text-red-700" :
                                                        "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {detailsTab === "payments" && (
                                <div className="space-y-3">
                                    {MOCK_DETAILS.payments.map(pmt => (
                                        <div key={pmt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-medium">{pmt.method}</p>
                                                <p className="text-xs text-muted-foreground">{pmt.date}</p>
                                            </div>
                                            <p className="font-medium text-green-600">+{formatCurrency(pmt.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {detailsTab === "notes" && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder={locale === "ar" ? "أضف ملاحظة..." : "Add a note..."}
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
                                        />
                                        <button className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                                            {locale === "ar" ? "إضافة" : "Add"}
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {MOCK_DETAILS.notes.map(note => (
                                            <div key={note.id} className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-sm">{note.text}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {note.author} • {note.date}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
