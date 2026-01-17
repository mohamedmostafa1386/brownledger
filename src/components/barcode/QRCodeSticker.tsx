"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QRCodeStickerProps {
    data: string;
    productName: string;
    sku: string;
    price: number;
    size?: "small" | "medium" | "large";
    currency?: string;
}

const sizeConfig = {
    small: { width: 100, height: 100, qrSize: 60, fontSize: 7 },
    medium: { width: 140, height: 140, qrSize: 80, fontSize: 9 },
    large: { width: 180, height: 180, qrSize: 110, fontSize: 11 },
};

export function QRCodeSticker({
    data,
    productName,
    sku,
    price,
    size = "medium",
    currency = "EGP",
}: QRCodeStickerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const config = sizeConfig[size];

    useEffect(() => {
        if (data) {
            // Create QR data with product info
            const qrContent = JSON.stringify({
                sku,
                name: productName,
                price,
            });

            QRCode.toDataURL(qrContent, {
                width: config.qrSize,
                margin: 1,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
                errorCorrectionLevel: "M",
            })
                .then((url) => setQrDataUrl(url))
                .catch((err) => console.error("QR generation error:", err));
        }
    }, [data, sku, productName, price, config.qrSize]);

    return (
        <div
            className="bg-white border border-gray-300 rounded flex flex-col items-center justify-center p-2 print:border-black"
            style={{ width: config.width, height: config.height }}
        >
            {/* Product Name - truncated */}
            <div
                className="font-bold text-center w-full truncate mb-1"
                style={{ fontSize: config.fontSize + 2 }}
                title={productName}
            >
                {productName}
            </div>

            {/* QR Code */}
            {qrDataUrl && (
                <img
                    src={qrDataUrl}
                    alt={`QR: ${sku}`}
                    style={{ width: config.qrSize, height: config.qrSize }}
                    className="my-1"
                />
            )}

            {/* SKU and Price */}
            <div
                className="flex flex-col items-center w-full"
                style={{ fontSize: config.fontSize }}
            >
                <span className="text-gray-600">{sku}</span>
                <span className="font-bold text-primary">
                    {currency} {price.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

// QR Code sticker grid component
interface QRStickerGridProps {
    stickers: {
        data: string;
        productName: string;
        sku: string;
        price: number;
        quantity: number;
    }[];
    size?: "small" | "medium" | "large";
    currency?: string;
}

export function QRStickerGrid({ stickers, size = "medium", currency = "EGP" }: QRStickerGridProps) {
    return (
        <div className="flex flex-wrap gap-1 p-4 print:p-0 print:gap-0">
            {stickers.flatMap((sticker) =>
                Array.from({ length: sticker.quantity }).map((_, i) => (
                    <QRCodeSticker
                        key={`${sticker.sku}-${i}`}
                        data={sticker.data}
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
