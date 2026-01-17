"use client";

import { useI18n } from "@/lib/i18n-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Package, AlertTriangle, TrendingDown, Warehouse, Plus, RefreshCcw, ArrowLeftRight, FileText, DollarSign, X, Check, Search, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface StockItem {
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    lowStockAlert: number;
    costPrice: number;
    warehouseId?: string;
    warehouseName?: string;
}

interface WarehouseInfo {
    id: string;
    name: string;
    code: string;
    location: string;
    itemCount: number;
    totalValue: number;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    sellingPrice: number;
    costPrice: number;
    taxRate: number;
    stockQuantity: number;
    lowStockAlert: number;
    isActive: boolean;
    imageUrl: string | null;
    category?: { name: string } | null;
}

export default function StockManagementPage() {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<"current" | "catalog" | "movements" | "alerts" | "warehouses" | "transfers">("current");
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);
    const [showProductForm, setShowProductForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState("");

    // Form states
    const [adjustQty, setAdjustQty] = useState(0);
    const [adjustReason, setAdjustReason] = useState("DAMAGE");
    const [transferQty, setTransferQty] = useState(1);
    const [fromWarehouse, setFromWarehouse] = useState("");
    const [toWarehouse, setToWarehouse] = useState("");
    const [newWarehouseName, setNewWarehouseName] = useState("");
    const [newWarehouseCode, setNewWarehouseCode] = useState("");
    const [newWarehouseLocation, setNewWarehouseLocation] = useState("");

    const queryClient = useQueryClient();

    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ["products-all"],
        queryFn: () => fetch("/api/products?active=false").then(res => res.json()),
        enabled: activeTab === "catalog"
    });

    const { data: stockStats, isLoading } = useQuery({
        queryKey: ["stock-stats"],
        queryFn: () => fetch("/api/stock/stats").then((r) => r.json()),
    });

    const { data: currentStock = [] } = useQuery({
        queryKey: ["current-stock"],
        queryFn: () => fetch("/api/stock/current").then((r) => r.json()),
    });

    const { data: movements = [] } = useQuery({
        queryKey: ["stock-movements"],
        queryFn: () => fetch("/api/stock/movements").then((r) => r.json()),
    });

    const { data: alerts = [] } = useQuery({
        queryKey: ["stock-alerts"],
        queryFn: () => fetch("/api/stock/alerts").then((r) => r.json()),
    });

    const filteredProducts = products.filter((p: Product) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    const filteredStock = currentStock.filter((item: StockItem) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase())
    );

    // Mock warehouses data
    const warehouses: WarehouseInfo[] = [
        { id: "1", name: "Main Warehouse", code: "WH-001", location: "Cairo, Factory Floor A", itemCount: 150, totalValue: 450000 },
        { id: "2", name: "Retail Store", code: "WH-002", location: "6th October, Branch 1", itemCount: 45, totalValue: 120000 },
        { id: "3", name: "Cold Storage", code: "WH-003", location: "Alexandria Port", itemCount: 20, totalValue: 85000 },
    ];

    // Stock adjustment mutation
    const adjustMutation = useMutation({
        mutationFn: async (data: { productId: string; quantity: number; reason: string }) => {
            const res = await fetch("/api/stock/adjust", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-stock"] });
            queryClient.invalidateQueries({ queryKey: ["stock-stats"] });
            queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
            setShowAdjustModal(false);
            setSelectedProduct(null);
            setAdjustQty(0);
        },
    });

    // Stock transfer mutation
    const transferMutation = useMutation({
        mutationFn: async (data: { productId: string; fromWarehouse: string; toWarehouse: string; quantity: number }) => {
            const res = await fetch("/api/stock/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-stock"] });
            queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
            setShowTransferModal(false);
            setSelectedProduct(null);
            setTransferQty(1);
        },
    });

    const handleAdjust = (product: StockItem) => {
        setSelectedProduct(product);
        setShowAdjustModal(true);
    };

    const handleTransfer = (product: StockItem) => {
        setSelectedProduct(product);
        setShowTransferModal(true);
    };

    const submitAdjustment = () => {
        if (selectedProduct) {
            adjustMutation.mutate({
                productId: selectedProduct.id,
                quantity: adjustQty,
                reason: adjustReason,
            });
        }
    };

    const submitTransfer = () => {
        if (selectedProduct && fromWarehouse && toWarehouse) {
            transferMutation.mutate({
                productId: selectedProduct.id,
                fromWarehouse,
                toWarehouse,
                quantity: transferQty,
            });
        }
    };

    const totalStockValue = currentStock?.reduce((sum: number, item: StockItem) =>
        sum + (item.stockQuantity * item.costPrice), 0) || stockStats?.totalValue || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("stock.title") || "Stock Management"}</h1>
                    <p className="text-sm text-muted-foreground">{t("stock.subtitle") || "Manage inventory, warehouses and transfers."}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditProduct(null); setShowProductForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                    <button
                        onClick={() => setShowAdjustModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-muted"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        {t("stock.adjustStock") || "Adjust Stock"}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-6 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">{t("stock.totalItems") || "Total Items"}</span>
                    </div>
                    <p className="text-3xl font-bold">{stockStats?.totalItems || currentStock?.length || 0}</p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total Value</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(totalStockValue)}</p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">{t("stock.lowStock") || "Low Stock"}</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{stockStats?.lowStock || 0}</p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">{t("stock.outOfStock") || "Out of Stock"}</span>
                    </div>
                    <p className="text-3xl font-bold text-red-600">{stockStats?.outOfStock || 0}</p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Warehouse className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">{t("stock.warehouses") || "Warehouses"}</span>
                    </div>
                    <p className="text-3xl font-bold">{warehouses.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="flex gap-4">
                    {[
                        { id: "current", label: t("stock.currentStock") || "Current Stock" },
                        { id: "catalog", label: "Product Catalog" },
                        { id: "warehouses", label: "Warehouses" },
                        { id: "transfers", label: "Transfers" },
                        { id: "movements", label: t("stock.stockMovements") || "Movements" },
                        { id: "alerts", label: t("stock.alerts") || "Alerts" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setSearch(""); }}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                            {tab.id === "alerts" && (alerts?.length || 0) > 0 && (
                                <span className="ms-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                    {alerts?.length}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "current" && (
                <div className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search inventory..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Product</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">SKU</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Warehouse</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Available</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Unit Cost</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Total Value</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium text-center">Status</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredStock.length > 0 ? filteredStock.map((item: StockItem) => (
                                    <tr key={item.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{item.name}</td>
                                        <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                                        <td className="px-4 py-3 text-sm">Main Warehouse</td>
                                        <td className="px-4 py-3 font-semibold">{item.stockQuantity}</td>
                                        <td className="px-4 py-3">{formatCurrency(item.costPrice || 0)}</td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency((item.stockQuantity || 0) * (item.costPrice || 0))}</td>
                                        <td className="px-4 py-3 text-center text-xs">
                                            {item.stockQuantity === 0 ? (
                                                <span className="px-2 py-1 font-medium bg-red-100 text-red-700 rounded-full">
                                                    Out of Stock
                                                </span>
                                            ) : item.stockQuantity <= item.lowStockAlert ? (
                                                <span className="px-2 py-1 font-medium bg-orange-100 text-orange-700 rounded-full">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 font-medium bg-green-100 text-green-700 rounded-full">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleAdjust(item)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                                                    title="Adjust Stock"
                                                >
                                                    <RefreshCcw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleTransfer(item)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                                                    title="Transfer Stock"
                                                >
                                                    <ArrowLeftRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                            {isLoading ? "Loading inventory..." : "No inventory items found."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "catalog" && (
                <div className="space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Product</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">SKU</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Cost</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Price</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {productsLoading ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center">Loading product catalog...</td></tr>
                                ) : filteredProducts.length > 0 ? filteredProducts.map((p: Product) => (
                                    <tr key={p.id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center overflow-hidden border">
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <span className="font-medium">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono">{p.sku}</td>
                                        <td className="px-4 py-3">{formatCurrency(p.costPrice)}</td>
                                        <td className="px-4 py-3 font-medium">{formatCurrency(p.sellingPrice)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                                {p.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => { setEditProduct(p); setShowProductForm(true); }}
                                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No products in catalog.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "warehouses" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {warehouses.map((wh) => (
                        <div key={wh.id} className="p-6 bg-card rounded-lg border border-border">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold">{wh.name}</h3>
                                    <p className="text-sm text-muted-foreground font-mono">{wh.code}</p>
                                </div>
                                <Warehouse className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{wh.location}</p>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                                <div>
                                    <p className="text-sm text-muted-foreground">Items</p>
                                    <p className="text-xl font-semibold">{wh.itemCount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Value</p>
                                    <p className="text-xl font-semibold text-green-600">{formatCurrency(wh.totalValue)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setShowWarehouseModal(true)}
                        className="p-6 bg-muted/50 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted transition-colors"
                    >
                        <Plus className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Add Warehouse</span>
                    </button>
                </div>
            )}

            {activeTab === "transfers" && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-start text-sm font-medium">Date</th>
                                <th className="px-4 py-3 text-start text-sm font-medium">Product</th>
                                <th className="px-4 py-3 text-start text-sm font-medium">From</th>
                                <th className="px-4 py-3 text-start text-sm font-medium">To</th>
                                <th className="px-4 py-3 text-start text-sm font-medium">Quantity</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr className="hover:bg-muted/50">
                                <td className="px-4 py-3 text-sm">{formatDate(new Date().toISOString())}</td>
                                <td className="px-4 py-3 font-medium">Sample Stock Item</td>
                                <td className="px-4 py-3 text-sm">Main Warehouse</td>
                                <td className="px-4 py-3 text-sm">Retail Store</td>
                                <td className="px-4 py-3 font-semibold">25</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                        Completed
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "movements" && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-start text-sm font-medium">Date</th>
                                <th className="px-4 py-3 text-start text-sm font-medium">Product</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-center">Type</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-end">Quantity</th>
                                <th className="px-4 py-3 text-start text-sm font-medium px-4">Reference</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {movements.length > 0 ? movements.map((m: any) => (
                                <tr key={m.id} className="hover:bg-muted/50">
                                    <td className="px-4 py-3 text-sm">{formatDate(m.date)}</td>
                                    <td className="px-4 py-3">{m.product?.name || "N/A"}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${m.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                            {m.type}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3 font-semibold text-end ${m.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                        {m.quantity > 0 ? "+" : ""}{m.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono px-4">{m.reference || "-"}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Check className="w-4 h-4 text-green-600 mx-auto" />
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No stock movements recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "alerts" && (
                <div className="space-y-3">
                    {alerts.length > 0 ? alerts.map((alert: any) => (
                        <div key={alert.id} className={`p-4 rounded-lg border flex items-center justify-between shadow-sm ${alert.severity === "CRITICAL" ? "bg-red-50 border-red-200" :
                            alert.severity === "HIGH" ? "bg-orange-50 border-orange-200" :
                                "bg-yellow-50 border-yellow-200"
                            }`}>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className={`w-5 h-5 ${alert.severity === "CRITICAL" ? "text-red-600" :
                                    alert.severity === "HIGH" ? "text-orange-600" :
                                        "text-yellow-600"
                                    }`} />
                                <div>
                                    <p className="font-semibold">{alert.message}</p>
                                    <p className="text-sm text-muted-foreground">{alert.product?.name}</p>
                                </div>
                            </div>
                            <button className="px-3 py-1 text-sm font-medium border rounded bg-white hover:bg-muted">
                                Resolve
                            </button>
                        </div>
                    )) : (
                        <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border border-border border-dashed">
                            <Check className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
                            <p>No active alerts. All stock levels are healthy.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showProductForm && (
                <ProductFormModal
                    product={editProduct}
                    onClose={() => { setShowProductForm(false); setEditProduct(null); }}
                />
            )}

            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Stock Adjustment</h2>
                            <button onClick={() => setShowAdjustModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Product</label>
                                <select
                                    value={selectedProduct?.id || ""}
                                    onChange={(e) => {
                                        const prod = currentStock?.find((p: StockItem) => p.id === e.target.value);
                                        setSelectedProduct(prod || null);
                                    }}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="">Select product...</option>
                                    {currentStock?.map((p: StockItem) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.stockQuantity} in stock)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Adjustment Reason</label>
                                <select
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="DAMAGE">Damage/Loss</option>
                                    <option value="RECOUNT">Physical Recount</option>
                                    <option value="RETURN">Customer Return</option>
                                    <option value="EXPIRED">Expired/Obsolete</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Quantity Adjustment</label>
                                <input
                                    type="number"
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                                    placeholder="Enter + or - quantity"
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Use negative numbers to decrease stock, positive to increase
                                </p>
                            </div>

                            {selectedProduct && adjustQty !== 0 && (
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                    <div className="flex justify-between">
                                        <span>Current:</span>
                                        <span>{selectedProduct.stockQuantity}</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t mt-1 pt-1">
                                        <span>New:</span>
                                        <span className={selectedProduct.stockQuantity + adjustQty < 0 ? "text-red-600" : ""}>
                                            {selectedProduct.stockQuantity + adjustQty}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={submitAdjustment}
                                disabled={!selectedProduct || adjustQty === 0 || adjustMutation.isPending}
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {adjustMutation.isPending ? "Saving..." : "Save Adjustment"}
                            </button>
                            <button
                                onClick={() => setShowAdjustModal(false)}
                                className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Transfer Stock</h2>
                            <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Product</label>
                                <select
                                    value={selectedProduct?.id || ""}
                                    onChange={(e) => {
                                        const prod = currentStock?.find((p: StockItem) => p.id === e.target.value);
                                        setSelectedProduct(prod || null);
                                    }}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                >
                                    <option value="">Select product...</option>
                                    {currentStock?.map((p: StockItem) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">From</label>
                                    <select
                                        value={fromWarehouse}
                                        onChange={(e) => setFromWarehouse(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="">Select...</option>
                                        {warehouses.map((wh) => (
                                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">To</label>
                                    <select
                                        value={toWarehouse}
                                        onChange={(e) => setToWarehouse(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="">Select...</option>
                                        {warehouses.filter(wh => wh.id !== fromWarehouse).map((wh) => (
                                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={transferQty}
                                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={submitTransfer}
                                disabled={!selectedProduct || !fromWarehouse || !toWarehouse || transferMutation.isPending}
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {transferMutation.isPending ? "Transferring..." : "Transfer Stock"}
                            </button>
                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWarehouseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Add Warehouse</h2>
                            <button onClick={() => setShowWarehouseModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={newWarehouseName}
                                    onChange={(e) => setNewWarehouseName(e.target.value)}
                                    placeholder="e.g., Downtown Store"
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Code</label>
                                <input
                                    type="text"
                                    value={newWarehouseCode}
                                    onChange={(e) => setNewWarehouseCode(e.target.value)}
                                    placeholder="e.g., WH-002"
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none uppercase"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Location</label>
                                <textarea
                                    value={newWarehouseLocation}
                                    onChange={(e) => setNewWarehouseLocation(e.target.value)}
                                    placeholder="Address or area"
                                    rows={2}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowWarehouseModal(false)}
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                Create Warehouse
                            </button>
                            <button
                                onClick={() => setShowWarehouseModal(false)}
                                className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProductFormModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: product?.name || "",
        sku: product?.sku || "",
        barcode: product?.barcode || "",
        costPrice: product?.costPrice || 0,
        sellingPrice: product?.sellingPrice || 0,
        taxRate: product?.taxRate || 0.1,
        stockQuantity: product?.stockQuantity || 0,
        lowStockAlert: product?.lowStockAlert || 10,
        imageUrl: product?.imageUrl || "",
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append("file", file);
            uploadData.append("productId", product?.id || "new");

            const res = await fetch("/api/products/upload", {
                method: "POST",
                body: uploadData,
            });

            if (res.ok) {
                const { imageUrl } = await res.json();
                setFormData({ ...formData, imageUrl });
            }
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData({ ...formData, imageUrl: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = product ? `/api/products/${product.id}` : "/api/products";
            const method = product ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to save");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products-all"] });
            queryClient.invalidateQueries({ queryKey: ["current-stock"] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
                    <h3 className="font-semibold text-lg">{product ? "Edit" : "Add"} Product</h3>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-colors">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Product Photo */}
                    <div className="flex flex-col items-center">
                        <label className="mb-2 block text-xs font-bold text-muted-foreground uppercase tracking-widest text-center w-full">Product Photo</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden transition-colors hover:border-primary/50">
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <Package className="w-8 h-8 text-muted-foreground/50" />
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="product-image"
                                />
                                <label
                                    htmlFor="product-image"
                                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold border rounded-lg cursor-pointer hover:bg-muted transition-colors uppercase tracking-widest bg-background"
                                >
                                    {imagePreview ? "Change Photo" : "Upload Photo"}
                                </label>
                                <p className="text-[10px] text-muted-foreground mt-2 leading-tight">Recommend 400x400 JPG or PNG.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Identity</label>
                            <input
                                type="text"
                                placeholder="Product Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="SKU"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none font-mono tracking-tighter"
                            />
                            <input
                                type="text"
                                placeholder="Barcode"
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none font-mono tracking-tighter"
                            />
                        </div>

                        <div className="pt-2">
                            <label className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Pricing</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Cost Price"
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                                        className="h-10 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Selling Price *"
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                                        className="h-10 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-sm focus:ring-1 focus:ring-primary outline-none font-bold text-primary"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Inventory Defaults</label>
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="number"
                                    placeholder="Tax %"
                                    step="0.01"
                                    value={formData.taxRate}
                                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="Initial Qty"
                                    value={formData.stockQuantity}
                                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none font-bold"
                                />
                                <input
                                    type="number"
                                    placeholder="Low Alert"
                                    value={formData.lowStockAlert}
                                    onChange={(e) => setFormData({ ...formData, lowStockAlert: parseInt(e.target.value) || 0 })}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none text-red-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-input text-xs font-bold uppercase tracking-widest hover:bg-muted transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                        >
                            {mutation.isPending ? "Submitting..." : (product ? "Save Changes" : "Register Product")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
