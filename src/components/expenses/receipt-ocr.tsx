"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Loader2, Check, X, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OCRResult {
    vendor: string;
    date: string;
    amount: number;
    items: { description: string; amount: number }[];
    tax: number;
    confidence: number;
    categoryId?: string;
}

interface ReceiptOCRProps {
    onComplete: (data: OCRResult) => void;
    onCancel: () => void;
}

export function ReceiptOCR({ onComplete, onCancel }: ReceiptOCRProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<OCRResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ocrMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("receipt", file);

            const response = await fetch("/api/expenses/ocr", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("OCR failed");
            return response.json();
        },
        onSuccess: (data) => {
            setResult(data);
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Process with OCR
        ocrMutation.mutate(file);
    };

    const handleConfirm = () => {
        if (result) {
            onComplete(result);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full mx-4 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">AI Receipt Scanner</h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-2 hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!preview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium mb-2">Upload Receipt</p>
                            <p className="text-sm text-muted-foreground">
                                Drop an image or click to browse
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Preview Image */}
                            <div className="relative rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={preview}
                                    alt="Receipt"
                                    className="w-full max-h-48 object-contain"
                                />
                                {ocrMutation.isPending && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            <p className="text-sm">Analyzing receipt...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* OCR Results */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3 p-4 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2 text-green-600">
                                            <Check className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                Extracted ({Math.round(result.confidence * 100)}% confidence)
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Vendor</span>
                                                <p className="font-medium">{result.vendor}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Date</span>
                                                <p className="font-medium">{result.date}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Amount</span>
                                                <p className="font-medium text-lg">
                                                    {formatCurrency(result.amount)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Tax</span>
                                                <p className="font-medium">{formatCurrency(result.tax)}</p>
                                            </div>
                                        </div>

                                        {result.items.length > 0 && (
                                            <div>
                                                <span className="text-sm text-muted-foreground">Items</span>
                                                <div className="mt-1 space-y-1">
                                                    {result.items.slice(0, 3).map((item, i) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span>{item.description}</span>
                                                            <span>{formatCurrency(item.amount)}</span>
                                                        </div>
                                                    ))}
                                                    {result.items.length > 3 && (
                                                        <p className="text-xs text-muted-foreground">
                                                            +{result.items.length - 3} more items
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {ocrMutation.isError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">
                                        Failed to process receipt. Please try again or enter manually.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-border px-6 py-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-10 rounded-lg border border-input font-medium hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!result || ocrMutation.isPending}
                        className="flex-1 h-10 rounded-lg bg-primary font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        Use Data
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
