"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
    ShoppingCart, Plus, Minus, Trash2, Search,
    CreditCard, Banknote, Smartphone, X, Star, SplitSquareHorizontal,
    Printer, Settings, Zap, User, Gift, Volume2, VolumeX, ScanBarcode, Camera
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { SalesReturnForm } from "@/components/returns/SalesReturnForm";
import { History, ArrowRightLeft, Eye } from "lucide-react";
import { CameraBarcodeScanner } from "@/components/barcode";

interface Product {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    sellingPrice: number;
    taxRate: number;
    stockQuantity: number;
    lowStockAlert: number;
    imageUrl: string | null;
    category: { name: string } | null;
}

interface CartItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

interface CustomerLoyalty {
    id: string;
    name: string;
    phone: string;
    points: number;
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
    totalSpent: number;
}

interface SplitPayment {
    method: string;
    amount: number;
}

const fetchProducts = async (search: string, category: string | null): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    const res = await fetch(`/api/products?${params}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

// Mock customer lookup
const lookupCustomer = async (phone: string): Promise<CustomerLoyalty | null> => {
    if (phone.length >= 10) {
        return {
            id: "cust_1",
            name: "Ahmed Mohamed",
            phone: phone,
            points: 2450,
            tier: "GOLD",
            totalSpent: 45000,
        };
    }
    return null;
};

const TIER_COLORS: Record<string, string> = {
    BRONZE: "bg-amber-700 text-white",
    SILVER: "bg-gray-400 text-black",
    GOLD: "bg-yellow-500 text-black",
    PLATINUM: "bg-purple-600 text-white",
};

// Quick search suggestions
const QUICK_SEARCH = [
    { label: "Best Sellers", query: "best" },
    { label: "New Items", query: "new" },
    { label: "Low Stock", query: "low" },
    { label: "On Sale", query: "sale" },
];

export default function POSPage() {
    const { locale } = useI18n();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [customerPhone, setCustomerPhone] = useState("");
    const [customer, setCustomer] = useState<CustomerLoyalty | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [cashReceived, setCashReceived] = useState("");
    const [showSplitPayment, setShowSplitPayment] = useState(false);
    const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
    const [showReceiptSettings, setShowReceiptSettings] = useState(false);
    const [receiptSettings, setReceiptSettings] = useState({
        showLogo: true,
        showTaxBreakdown: true,
        footerText: "Thank you for your business!",
        printAutomatically: true,
    });
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [showReturnForm, setShowReturnForm] = useState(false);

    // Barcode scanner states
    const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
    const [lastScannedBarcode, setLastScannedBarcode] = useState("");
    const [scanFeedbackEnabled, setScanFeedbackEnabled] = useState(true);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products", searchQuery, selectedCategory],
        queryFn: () => fetchProducts(searchQuery, selectedCategory),
    });

    const { data: saleHistory = [] } = useQuery({
        queryKey: ["pos-sales"],
        queryFn: () => fetch("/api/pos/sales").then(r => r.json()),
        enabled: activeTab === "history"
    });

    const completeSale = useMutation({
        mutationFn: async (saleData: {
            items: CartItem[];
            subtotal: number;
            taxAmount: number;
            total: number;
            paymentMethod: string;
            cashReceived?: number;
            changeGiven?: number;
            customerPhone?: string;
            splitPayments?: SplitPayment[];
            loyaltyPointsEarned?: number;
        }) => {
            const res = await fetch("/api/pos/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(saleData),
            });
            if (!res.ok) throw new Error("Failed to complete sale");
            return res.json();
        },
        onSuccess: () => {
            setCart([]);
            setCustomerPhone("");
            setCustomer(null);
            setShowCheckout(false);
            setCashReceived("");
            setShowSplitPayment(false);
            setSplitPayments([]);
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const addToCart = useCallback((product: Product) => {
        if (product.stockQuantity <= 0) return;

        setCart((prev) => {
            const existing = prev.find((item) => item.productId === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.sellingPrice,
                taxRate: product.taxRate,
                total: product.sellingPrice,
            }];
        });
    }, []);

    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.productId === productId) {
                        const newQty = Math.max(0, item.quantity + delta);
                        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const cartTax = cart.reduce((sum, item) => sum + item.total * item.taxRate, 0);
    const cartTotal = cartSubtotal + cartTax;
    const loyaltyPointsEarned = Math.floor(cartTotal / 10); // 1 point per 10 EGP

    // Customer lookup
    useEffect(() => {
        if (customerPhone.length >= 10) {
            lookupCustomer(customerPhone).then(setCustomer);
        } else {
            setCustomer(null);
        }
    }, [customerPhone]);

    const handleCheckout = (paymentMethod: string) => {
        const cashReceivedNum = parseFloat(cashReceived) || 0;
        completeSale.mutate({
            items: cart,
            subtotal: cartSubtotal,
            taxAmount: cartTax,
            total: cartTotal,
            paymentMethod: showSplitPayment ? "SPLIT" : paymentMethod,
            cashReceived: paymentMethod === "CASH" ? cashReceivedNum : undefined,
            changeGiven: paymentMethod === "CASH" ? Math.max(0, cashReceivedNum - cartTotal) : undefined,
            customerPhone: customerPhone || undefined,
            splitPayments: showSplitPayment ? splitPayments : undefined,
            loyaltyPointsEarned: customer ? loyaltyPointsEarned : undefined,
        });
    };

    const addSplitPayment = (method: string) => {
        const remaining = cartTotal - splitPayments.reduce((sum, p) => sum + p.amount, 0);
        if (remaining > 0) {
            setSplitPayments([...splitPayments, { method, amount: remaining }]);
        }
    };

    const updateSplitAmount = (index: number, amount: number) => {
        const newPayments = [...splitPayments];
        newPayments[index].amount = amount;
        setSplitPayments(newPayments);
    };

    const removeSplitPayment = (index: number) => {
        setSplitPayments(splitPayments.filter((_, i) => i !== index));
    };

    const splitTotal = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    const splitRemaining = cartTotal - splitTotal;

    // Play beep sound for barcode scan feedback
    const playBeep = useCallback((success: boolean) => {
        if (!scanFeedbackEnabled) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = success ? 1200 : 400;
            oscillator.type = "sine";
            gainNode.gain.value = 0.1;

            oscillator.start();
            oscillator.stop(ctx.currentTime + (success ? 0.1 : 0.3));
        } catch (e) {
            console.log("Audio not supported");
        }
    }, [scanFeedbackEnabled]);

    // Handle barcode scanning with visual feedback
    useEffect(() => {
        let barcode = "";
        let lastKeyTime = 0;
        let scanTimeout: NodeJS.Timeout;

        const handleKeyPress = (e: KeyboardEvent) => {
            const currentTime = Date.now();

            // Reset if too much time passed between keys (barcode scanners are fast)
            if (currentTime - lastKeyTime > 100) {
                barcode = "";
            }
            lastKeyTime = currentTime;

            // Show scanning status
            if (barcode.length > 2) {
                setScanStatus("scanning");
                setLastScannedBarcode(barcode);
            }

            // Clear any existing timeout
            clearTimeout(scanTimeout);
            scanTimeout = setTimeout(() => {
                if (scanStatus === "scanning") {
                    setScanStatus("idle");
                }
            }, 500);

            if (e.key === "Enter" && barcode.length > 5) {
                // Look up product by barcode
                const product = products.find((p) => p.barcode === barcode);
                if (product) {
                    addToCart(product);
                    setScanStatus("success");
                    playBeep(true);
                    setLastScannedBarcode(barcode);
                } else {
                    setScanStatus("error");
                    playBeep(false);
                    setLastScannedBarcode(barcode);
                }
                barcode = "";

                // Reset status after feedback
                setTimeout(() => setScanStatus("idle"), 2000);
            } else if (e.key.length === 1) {
                barcode += e.key;
            }
        };

        window.addEventListener("keypress", handleKeyPress);
        return () => {
            window.removeEventListener("keypress", handleKeyPress);
            clearTimeout(scanTimeout);
        };
    }, [products, addToCart, playBeep, scanStatus]);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-muted/30">
            {/* Nav Tabs */}
            <div className="flex border-b border-border bg-card px-4">
                <button
                    onClick={() => setActiveTab("pos")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "pos" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                >
                    <ShoppingCart className="w-4 h-4" />
                    {locale === "ar" ? "نقطة البيع" : "POS Square"}
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                >
                    <History className="w-4 h-4" />
                    {locale === "ar" ? "سجل المبيعات" : "Sale History"}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full">
                {activeTab === "pos" ? (
                    <>
                        {/* Left: Product Grid */}
                        <div className="flex-1 p-4 overflow-y-auto min-h-0">
                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder={locale === "ar" ? "🔍 ابحث عن المنتجات أو امسح الباركود..." : "🔍 Search products or scan barcode..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                        autoFocus
                                    />
                                </div>
                                {/* Quick Search Tags */}
                                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                    {QUICK_SEARCH.map((tag) => (
                                        <button
                                            key={tag.query}
                                            onClick={() => setSearchQuery(tag.query)}
                                            className={`px-3 py-1 text-sm rounded-full border transition-colors whitespace-nowrap ${searchQuery === tag.query
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border hover:bg-muted"
                                                }`}
                                        >
                                            <Zap className="w-3 h-3 inline mr-1" />
                                            {tag.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Barcode Scan Status Indicator */}
                                <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                                    <div className="flex items-center gap-3">
                                        <ScanBarcode className={`w-5 h-5 ${scanStatus === "scanning" ? "text-blue-500 animate-pulse" :
                                            scanStatus === "success" ? "text-green-500" :
                                                scanStatus === "error" ? "text-red-500" :
                                                    "text-muted-foreground"
                                            }`} />
                                        <div className="text-sm">
                                            {scanStatus === "idle" && (
                                                <span className="text-muted-foreground">
                                                    {locale === "ar" ? "جاهز للمسح..." : "Ready to scan..."}
                                                </span>
                                            )}
                                            {scanStatus === "scanning" && (
                                                <span className="text-blue-600">
                                                    {locale === "ar" ? "جاري المسح..." : "Scanning..."} <code className="bg-blue-100 px-1 rounded">{lastScannedBarcode}</code>
                                                </span>
                                            )}
                                            {scanStatus === "success" && (
                                                <span className="text-green-600 font-medium">
                                                    ✓ {locale === "ar" ? "تمت إضافة المنتج!" : "Product added!"}
                                                </span>
                                            )}
                                            {scanStatus === "error" && (
                                                <span className="text-red-600">
                                                    ✗ {locale === "ar" ? "الباركود غير موجود:" : "Barcode not found:"} <code className="bg-red-100 px-1 rounded">{lastScannedBarcode}</code>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setScanFeedbackEnabled(!scanFeedbackEnabled)}
                                        className={`p-2 rounded-lg transition-colors ${scanFeedbackEnabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                                        title={scanFeedbackEnabled ? (locale === "ar" ? "إيقاف الصوت" : "Mute beep") : (locale === "ar" ? "تشغيل الصوت" : "Enable beep")}
                                    >
                                        {scanFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => setShowCameraScanner(true)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                                        title={locale === "ar" ? "مسح بالكاميرا" : "Scan with camera"}
                                    >
                                        <Camera className="w-4 h-4" />
                                        {locale === "ar" ? "كاميرا" : "Camera"}
                                    </button>
                                </div>
                            </div>

                            {/* Product Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-24 lg:pb-0">
                                {isLoading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="aspect-square bg-card rounded-xl skeleton" />
                                    ))
                                ) : !Array.isArray(products) || products.length === 0 ? (
                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                        {locale === "ar" ? "لا توجد منتجات" : "No products found"}
                                    </div>
                                ) : (
                                    products.map((product) => (
                                        <motion.button
                                            key={product.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => addToCart(product)}
                                            disabled={product.stockQuantity <= 0}
                                            className={`bg-card rounded-xl p-3 text-left hover:shadow-lg transition-shadow border border-border ${product.stockQuantity <= 0 ? "opacity-50 cursor-not-allowed" : ""
                                                }`}
                                        >
                                            {product.imageUrl ? (
                                                <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden">
                                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="aspect-square rounded-lg bg-primary/10 mb-2 flex items-center justify-center">
                                                    <span className="text-xl font-bold text-primary">{product.name[0]}</span>
                                                </div>
                                            )}
                                            <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]" title={product.name}>{product.name}</h3>
                                            <p className="text-lg font-bold text-primary">{formatCurrency(product.sellingPrice)}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-muted-foreground">{locale === "ar" ? "مخزون:" : "Stock:"} {product.stockQuantity}</span>
                                                {product.stockQuantity <= product.lowStockAlert && product.stockQuantity > 0 && (
                                                    <span className="text-[10px] text-amber-600">⚠️ {locale === "ar" ? "منخفض" : "Low"}</span>
                                                )}
                                            </div>
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right: Cart (Fixed at bottom on mobile, side on desktop) */}
                        <div className={`
                            lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col 
                            fixed bottom-0 left-0 right-0 h-[60vh] lg:h-full lg:static z-20 shadow-2xl lg:shadow-none
                            transform transition-transform duration-300
                            ${showCheckout || cart.length > 0 ? 'translate-y-0' : 'translate-y-[calc(100%-80px)] lg:translate-y-0'}
                        `}>
                            {/* Mobile Drag Handle / Header */}
                            <div className="lg:hidden flex justify-center py-2 bg-muted/50 cursor-grab active:cursor-grabbing">
                                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                            </div>
                            {/* Cart Header */}
                            <div className="p-4 border-b border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        Current Sale
                                    </h2>
                                    <button
                                        onClick={() => setShowReceiptSettings(!showReceiptSettings)}
                                        className="p-1.5 hover:bg-muted rounded"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        placeholder="Customer phone..."
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Customer Loyalty Display */}
                                {customer && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded text-xs font-bold ${TIER_COLORS[customer.tier]}`}>
                                                    {customer.tier}
                                                </div>
                                                <span className="font-medium">{customer.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-700">
                                                <Star className="h-4 w-4 fill-yellow-500" />
                                                <span className="font-bold">{customer.points}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-yellow-700">
                                            <Gift className="h-3 w-3" />
                                            <span>Earn +{loyaltyPointsEarned} points on this sale</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Receipt Settings Mini Panel */}
                            {showReceiptSettings && (
                                <div className="p-3 border-b border-border bg-muted/30 text-sm">
                                    <label className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={receiptSettings.printAutomatically}
                                            onChange={(e) => setReceiptSettings({ ...receiptSettings, printAutomatically: e.target.checked })}
                                        />
                                        Auto-print receipt
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={receiptSettings.showTaxBreakdown}
                                            onChange={(e) => setReceiptSettings({ ...receiptSettings, showTaxBreakdown: e.target.checked })}
                                        />
                                        Show tax breakdown
                                    </label>
                                </div>
                            )}

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>Cart is empty</p>
                                        <p className="text-sm">Scan or click products to add</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <motion.div
                                            key={item.productId}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-muted/50 rounded-lg p-3"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-sm">{item.productName}</h4>
                                                <button
                                                    onClick={() => removeFromCart(item.productId)}
                                                    className="text-destructive hover:bg-destructive/10 rounded p-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, -1)}
                                                        className="h-8 w-8 bg-background rounded flex items-center justify-center border border-input"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, 1)}
                                                        className="h-8 w-8 bg-background rounded flex items-center justify-center border border-input"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <p className="font-bold">{formatCurrency(item.total)}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                @ {formatCurrency(item.unitPrice)} each
                                            </p>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Totals & Checkout */}
                            <div className="border-t border-border p-4 bg-muted/30">
                                <div className="space-y-1 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(cartSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span className="font-medium">{formatCurrency(cartTax)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                                        <span>TOTAL</span>
                                        <span className="text-primary">{formatCurrency(cartTotal)}</span>
                                    </div>
                                </div>

                                {!showCheckout ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setShowCheckout(true)}
                                            disabled={cart.length === 0}
                                            className="col-span-2 h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            Checkout
                                        </button>
                                        <button
                                            onClick={() => setCart([])}
                                            disabled={cart.length === 0}
                                            className="h-10 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 disabled:opacity-50"
                                        >
                                            Clear
                                        </button>
                                        <button className="h-10 border border-input rounded-lg font-medium hover:bg-muted">
                                            Hold
                                        </button>
                                    </div>
                                ) : showSplitPayment ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Split Payment</span>
                                            <span className={`text-sm ${splitRemaining <= 0 ? "text-green-600" : "text-orange-600"}`}>
                                                Remaining: {formatCurrency(Math.max(0, splitRemaining))}
                                            </span>
                                        </div>

                                        {splitPayments.map((payment, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                                <span className="flex-1 text-sm font-medium">{payment.method}</span>
                                                <input
                                                    type="number"
                                                    value={payment.amount}
                                                    onChange={(e) => updateSplitAmount(index, parseFloat(e.target.value) || 0)}
                                                    className="w-24 h-8 text-right rounded border border-input px-2"
                                                />
                                                <button onClick={() => removeSplitPayment(index)} className="text-red-500">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {splitRemaining > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <button onClick={() => addSplitPayment("CASH")} className="h-8 bg-green-100 text-green-700 rounded text-xs">
                                                    + Cash
                                                </button>
                                                <button onClick={() => addSplitPayment("CARD")} className="h-8 bg-blue-100 text-blue-700 rounded text-xs">
                                                    + Card
                                                </button>
                                                <button onClick={() => addSplitPayment("MOBILE")} className="h-8 bg-purple-100 text-purple-700 rounded text-xs">
                                                    + Mobile
                                                </button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleCheckout("SPLIT")}
                                                disabled={splitRemaining > 0.01 || completeSale.isPending}
                                                className="h-10 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50"
                                            >
                                                Complete
                                            </button>
                                            <button
                                                onClick={() => { setShowSplitPayment(false); setSplitPayments([]); }}
                                                className="h-10 border border-input rounded-lg font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm text-muted-foreground">Cash Received (for cash payments)</label>
                                            <input
                                                type="number"
                                                value={cashReceived}
                                                onChange={(e) => setCashReceived(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-10 mt-1 rounded-lg border border-input bg-background px-3 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                            {parseFloat(cashReceived) >= cartTotal && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    Change: {formatCurrency(parseFloat(cashReceived) - cartTotal)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => handleCheckout("CASH")}
                                                disabled={completeSale.isPending}
                                                className="h-12 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-1"
                                            >
                                                <Banknote className="h-4 w-4" />
                                                Cash
                                            </button>
                                            <button
                                                onClick={() => handleCheckout("CARD")}
                                                disabled={completeSale.isPending}
                                                className="h-12 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-1"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Card
                                            </button>
                                            <button
                                                onClick={() => handleCheckout("MOBILE")}
                                                disabled={completeSale.isPending}
                                                className="h-12 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-1"
                                            >
                                                <Smartphone className="h-4 w-4" />
                                                Mobile
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setShowSplitPayment(true)}
                                            className="w-full h-9 border border-input rounded-lg font-medium hover:bg-muted flex items-center justify-center gap-2"
                                        >
                                            <SplitSquareHorizontal className="h-4 w-4" />
                                            Split Payment
                                        </button>

                                        <button
                                            onClick={() => setShowCheckout(false)}
                                            className="w-full h-9 border border-input rounded-lg font-medium hover:bg-muted flex items-center justify-center gap-1"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* History View */
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Sale #</th>
                                        <th className="px-4 py-3 text-left">Date</th>
                                        <th className="px-4 py-3 text-left">Customer</th>
                                        <th className="px-4 py-3 text-left">Method</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {Array.isArray(saleHistory) && saleHistory.map((sale: any) => (
                                        <tr key={sale.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">{sale.saleNumber}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</td>
                                            <td className="px-4 py-3">{sale.customerPhone || "Guest"}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                                                    {sale.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(sale.total)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button className="p-1.5 hover:bg-muted rounded text-muted-foreground" title="View"><Eye className="w-4 h-4" /></button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSale(sale);
                                                            setShowReturnForm(true);
                                                        }}
                                                        className="p-1.5 hover:bg-muted rounded text-orange-600"
                                                        title="Return"
                                                    >
                                                        <ArrowRightLeft className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {showReturnForm && selectedSale && (
                <SalesReturnForm
                    onClose={() => setShowReturnForm(false)}
                    preselectedPosSaleId={selectedSale.id}
                />
            )}

            {/* Camera Barcode Scanner Modal */}
            <CameraBarcodeScanner
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)}
                onScan={(barcode) => {
                    // Look up product by barcode
                    const product = products.find((p) => p.barcode === barcode || p.sku === barcode);
                    if (product) {
                        addToCart(product);
                        setScanStatus("success");
                        setLastScannedBarcode(barcode);
                        // Play success sound
                        if (scanFeedbackEnabled && audioContextRef.current) {
                            const oscillator = audioContextRef.current.createOscillator();
                            const gainNode = audioContextRef.current.createGain();
                            oscillator.connect(gainNode);
                            gainNode.connect(audioContextRef.current.destination);
                            oscillator.frequency.value = 1200;
                            oscillator.type = "sine";
                            gainNode.gain.value = 0.3;
                            oscillator.start();
                            oscillator.stop(audioContextRef.current.currentTime + 0.1);
                        }
                    } else {
                        setScanStatus("error");
                        setLastScannedBarcode(barcode);
                        // Play error sound
                        if (scanFeedbackEnabled && audioContextRef.current) {
                            const oscillator = audioContextRef.current.createOscillator();
                            const gainNode = audioContextRef.current.createGain();
                            oscillator.connect(gainNode);
                            gainNode.connect(audioContextRef.current.destination);
                            oscillator.frequency.value = 300;
                            oscillator.type = "sine";
                            gainNode.gain.value = 0.3;
                            oscillator.start();
                            oscillator.stop(audioContextRef.current.currentTime + 0.2);
                        }
                    }
                    // Reset status after delay
                    setTimeout(() => setScanStatus("idle"), 2000);
                }}
                title={locale === "ar" ? "مسح الباركود بالكاميرا" : "Scan Barcode with Camera"}
            />
        </div>
    );
}
