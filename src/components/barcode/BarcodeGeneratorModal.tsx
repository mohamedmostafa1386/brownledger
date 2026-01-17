"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Tag, Package, Check, Minus, Plus, QrCode, Barcode } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { BarcodeSticker, StickerGrid, generateBarcode } from "./BarcodeStickerPrint";
import { QRCodeSticker, QRStickerGrid } from "./QRCodeSticker";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency } from "@/lib/utils";

interface StickerItem {
    id: string;
    productName: string;
    sku: string;
    barcode: string;
    price: number;
    quantity: number;
    selected: boolean;
    stickerQty: number;
}

interface BarcodeGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: {
        id: string;
        productName: string;
        description?: string;
        sku?: string;
        barcode?: string | null;
        unitPrice: number;
        quantity: number;
    }[];
    orderNumber?: string;
    companyPrefix?: string;
}

export function BarcodeGeneratorModal({
    isOpen,
    onClose,
    items,
    orderNumber,
    companyPrefix = "BL",
}: BarcodeGeneratorModalProps) {
    const { locale } = useI18n();
    const printRef = useRef<HTMLDivElement>(null);

    const [stickerType, setStickerType] = useState<"barcode" | "qrcode">("qrcode");
    const [stickerSize, setStickerSize] = useState<"small" | "medium" | "large">("medium");
    const [stickerItems, setStickerItems] = useState<StickerItem[]>(() =>
        items.map((item) => ({
            id: item.id,
            productName: item.productName || item.description || "Product",
            sku: item.sku || `SKU-${item.id.slice(-6)}`,
            barcode: item.barcode || generateBarcode(companyPrefix, item.id),
            price: item.unitPrice,
            quantity: item.quantity,
            selected: true,
            stickerQty: item.quantity,
        }))
    );

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Stickers-${orderNumber || "batch"}`,
    });

    const toggleItem = (id: string) => {
        setStickerItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
        );
    };

    const updateStickerQty = (id: string, delta: number) => {
        setStickerItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, stickerQty: Math.max(1, item.stickerQty + delta) } : item
            )
        );
    };

    const setStickerQty = (id: string, qty: number) => {
        setStickerItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, stickerQty: Math.max(1, qty) } : item))
        );
    };

    const selectedItems = stickerItems.filter((item) => item.selected);
    const totalStickers = selectedItems.reduce((sum, item) => sum + item.stickerQty, 0);

    const stickersForPrint = selectedItems.map((item) => ({
        barcode: item.barcode || `GEN-${item.id.slice(-8)}`,
        data: item.barcode || `GEN-${item.id.slice(-8)}`,
        productName: item.productName,
        sku: item.sku,
        price: item.price,
        quantity: item.stickerQty,
    }));

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Tag className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">
                                    {locale === "ar" ? "طباعة ملصقات المنتجات" : "Print Product Stickers"}
                                </h2>
                                {orderNumber && (
                                    <p className="text-sm text-muted-foreground">
                                        {locale === "ar" ? "طلب رقم:" : "Order:"} {orderNumber}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Sticker Type Selector */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                {locale === "ar" ? "نوع الملصق" : "Sticker Type"}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStickerType("qrcode")}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${stickerType === "qrcode"
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted border-border hover:bg-muted-foreground/10"
                                        }`}
                                >
                                    <QrCode className="h-5 w-5" />
                                    {locale === "ar" ? "كود QR" : "QR Code"}
                                </button>
                                <button
                                    onClick={() => setStickerType("barcode")}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${stickerType === "barcode"
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted border-border hover:bg-muted-foreground/10"
                                        }`}
                                >
                                    <Barcode className="h-5 w-5" />
                                    {locale === "ar" ? "باركود" : "Barcode"}
                                </button>
                            </div>
                        </div>

                        {/* Item List */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                {locale === "ar" ? "المنتجات" : "Products"}
                            </h3>
                            {stickerItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${item.selected
                                            ? "border-primary bg-primary/5"
                                            : "border-border bg-muted/30"
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${item.selected
                                                ? "bg-primary border-primary text-white"
                                                : "border-muted-foreground"
                                            }`}
                                    >
                                        {item.selected && <Check className="h-3 w-3" />}
                                    </button>

                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            SKU: {item.sku} • {formatCurrency(item.price)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {locale === "ar" ? "الكمية:" : "Qty:"}
                                        </span>
                                        <button
                                            onClick={() => updateStickerQty(item.id, -1)}
                                            className="h-7 w-7 rounded bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.stickerQty}
                                            onChange={(e) =>
                                                setStickerQty(item.id, parseInt(e.target.value) || 1)
                                            }
                                            className="w-14 h-7 text-center rounded border border-input bg-background text-sm"
                                        />
                                        <button
                                            onClick={() => updateStickerQty(item.id, 1)}
                                            className="h-7 w-7 rounded bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Size Selector */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                {locale === "ar" ? "حجم الملصق" : "Sticker Size"}
                            </h3>
                            <div className="flex gap-2">
                                {(["small", "medium", "large"] as const).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setStickerSize(size)}
                                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${stickerSize === size
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted border-border hover:bg-muted-foreground/10"
                                            }`}
                                    >
                                        {size === "small" && (locale === "ar" ? "صغير" : "Small")}
                                        {size === "medium" && (locale === "ar" ? "متوسط" : "Medium")}
                                        {size === "large" && (locale === "ar" ? "كبير" : "Large")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        {selectedItems.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    {locale === "ar" ? "معاينة" : "Preview"}
                                </h3>
                                <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center">
                                    {stickerType === "qrcode" ? (
                                        <QRCodeSticker
                                            data={selectedItems[0].barcode || `GEN-${selectedItems[0].id.slice(-8)}`}
                                            productName={selectedItems[0].productName}
                                            sku={selectedItems[0].sku}
                                            price={selectedItems[0].price}
                                            size={stickerSize}
                                        />
                                    ) : (
                                        <BarcodeSticker
                                            barcode={selectedItems[0].barcode || `GEN-${selectedItems[0].id.slice(-8)}`}
                                            productName={selectedItems[0].productName}
                                            sku={selectedItems[0].sku}
                                            price={selectedItems[0].price}
                                            size={stickerSize}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <span className="text-muted-foreground">
                                    {locale === "ar" ? "إجمالي الملصقات:" : "Total Stickers:"}
                                </span>{" "}
                                <span className="font-bold">{totalStickers}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="h-10 px-4 rounded-lg border border-input hover:bg-muted font-medium"
                                >
                                    {locale === "ar" ? "إلغاء" : "Cancel"}
                                </button>
                                <button
                                    onClick={() => handlePrint()}
                                    disabled={totalStickers === 0}
                                    className="h-10 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Printer className="h-4 w-4" />
                                    {locale === "ar" ? "طباعة الملصقات" : "Print Stickers"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Hidden print area */}
                    <div className="hidden">
                        <div ref={printRef} className="p-4">
                            <style type="text/css" media="print">{`
                                @page {
                                    size: auto;
                                    margin: 5mm;
                                }
                                @media print {
                                    body {
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                    }
                                }
                            `}</style>
                            {stickerType === "qrcode" ? (
                                <QRStickerGrid stickers={stickersForPrint} size={stickerSize} />
                            ) : (
                                <StickerGrid stickers={stickersForPrint} size={stickerSize} />
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
