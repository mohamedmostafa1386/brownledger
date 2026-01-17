"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeStickerProps {
    barcode: string;
    productName: string;
    sku: string;
    price: number;
    size?: "small" | "medium" | "large";
    currency?: string;
}

const sizeConfig = {
    small: { width: 120, height: 80, fontSize: 8, barcodeWidth: 1.2, barcodeHeight: 30 },
    medium: { width: 180, height: 100, fontSize: 10, barcodeWidth: 1.5, barcodeHeight: 40 },
    large: { width: 250, height: 130, fontSize: 12, barcodeWidth: 2, barcodeHeight: 50 },
};

export function BarcodeSticker({
    barcode,
    productName,
    sku,
    price,
    size = "medium",
    currency = "EGP",
}: BarcodeStickerProps) {
    const barcodeRef = useRef<SVGSVGElement>(null);
    const config = sizeConfig[size];

    useEffect(() => {
        if (barcodeRef.current && barcode) {
            try {
                JsBarcode(barcodeRef.current, barcode, {
                    format: "CODE128",
                    width: config.barcodeWidth,
                    height: config.barcodeHeight,
                    displayValue: true,
                    fontSize: config.fontSize,
                    margin: 2,
                    background: "#ffffff",
                    lineColor: "#000000",
                });
            } catch (error) {
                console.error("Barcode generation error:", error);
            }
        }
    }, [barcode, config]);

    return (
        <div
            className="bg-white border border-gray-300 rounded flex flex-col items-center justify-center p-2 print:border-black"
            style={{ width: config.width, height: config.height }}
        >
            {/* Product Name - truncated */}
            <div
                className="font-bold text-center w-full truncate"
                style={{ fontSize: config.fontSize + 2 }}
                title={productName}
            >
                {productName}
            </div>

            {/* Barcode */}
            <svg ref={barcodeRef} className="my-1" />

            {/* SKU and Price */}
            <div
                className="flex items-center justify-between w-full px-1"
                style={{ fontSize: config.fontSize }}
            >
                <span className="text-gray-600">{sku}</span>
                <span className="font-bold">
                    {currency} {price.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

// Print-ready sticker grid component
interface StickerGridProps {
    stickers: {
        barcode: string;
        productName: string;
        sku: string;
        price: number;
        quantity: number;
    }[];
    size?: "small" | "medium" | "large";
    currency?: string;
}

export function StickerGrid({ stickers, size = "medium", currency = "EGP" }: StickerGridProps) {
    return (
        <div className="flex flex-wrap gap-1 p-4 print:p-0 print:gap-0">
            {stickers.flatMap((sticker) =>
                Array.from({ length: sticker.quantity }).map((_, i) => (
                    <BarcodeSticker
                        key={`${sticker.barcode}-${i}`}
                        barcode={sticker.barcode}
                        productName={sticker.productName}
                        sku={sticker.sku}
                        price={sticker.price}
                        size={size}
                        currency={currency}
                    />
                ))
            )}
        </div>
    );
}

// Generate a barcode if product doesn't have one
export function generateBarcode(companyPrefix: string, productId: string): string {
    // Create a simple barcode: BL + company prefix (3 chars) + product id hash (6 digits)
    const hash = productId
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        .toString()
        .padStart(6, "0")
        .slice(-6);
    return `BL${companyPrefix.slice(0, 3).toUpperCase()}${hash}`;
}
