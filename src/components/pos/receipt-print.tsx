"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";

interface POSSaleItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface ReceiptData {
    saleNumber: string;
    saleDate: string;
    items: POSSaleItem[];
    subtotal: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    cashReceived?: number;
    changeGiven?: number;
    cashier: string;
}

interface CompanyInfo {
    name: string;
    address?: string;
    phone?: string;
}

interface ReceiptPrintProps {
    sale: ReceiptData;
    company: CompanyInfo;
}

export interface ReceiptPrintHandle {
    print: () => void;
}

export const ReceiptPrint = forwardRef<ReceiptPrintHandle, ReceiptPrintProps>(
    ({ sale, company }, ref) => {
        const receiptRef = useRef<HTMLDivElement>(null);

        const handlePrint = () => {
            if (!receiptRef.current) return;

            const printWindow = window.open("", "_blank", "width=300,height=600");
            if (!printWindow) return;

            const styles = `
        @page { margin: 0; size: 80mm auto; }
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 10px; }
        .receipt { max-width: 280px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .item { margin: 4px 0; }
        table { width: 100%; font-size: 11px; }
        td { padding: 2px 0; }
        .amount { text-align: right; }
        .total-row { font-size: 14px; font-weight: bold; }
      `;

            printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Receipt</title><style>${styles}</style></head>
        <body>
          ${receiptRef.current.innerHTML}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
        </html>
      `);
            printWindow.document.close();
        };

        useImperativeHandle(ref, () => ({
            print: handlePrint,
        }));

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);
        };

        const formatDateTime = (dateStr: string) => {
            const date = new Date(dateStr);
            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        };

        return (
            <div className="hidden">
                <div ref={receiptRef} className="receipt">
                    {/* Header */}
                    <div className="center">
                        <div className="bold" style={{ fontSize: "16px" }}>{company.name}</div>
                        {company.address && <div>{company.address}</div>}
                        {company.phone && <div>{company.phone}</div>}
                    </div>

                    <div className="divider"></div>

                    {/* Sale Info */}
                    <div>
                        <div className="row">
                            <span>Sale #:</span>
                            <span>{sale.saleNumber}</span>
                        </div>
                        <div className="row">
                            <span>Date:</span>
                            <span>{formatDateTime(sale.saleDate)}</span>
                        </div>
                        <div className="row">
                            <span>Cashier:</span>
                            <span>{sale.cashier}</span>
                        </div>
                    </div>

                    <div className="divider"></div>

                    {/* Items */}
                    <table>
                        <tbody>
                            {sale.items.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ maxWidth: "150px" }}>{item.productName}</td>
                                    <td className="amount">
                                        {item.quantity} x {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="amount">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="divider"></div>

                    {/* Totals */}
                    <div className="row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(sale.subtotal)}</span>
                    </div>
                    <div className="row">
                        <span>Tax:</span>
                        <span>{formatCurrency(sale.taxAmount)}</span>
                    </div>
                    <div className="row total-row" style={{ marginTop: "4px" }}>
                        <span>TOTAL:</span>
                        <span>{formatCurrency(sale.total)}</span>
                    </div>

                    <div className="divider"></div>

                    {/* Payment */}
                    <div className="row">
                        <span>Payment:</span>
                        <span>{sale.paymentMethod}</span>
                    </div>
                    {sale.cashReceived !== undefined && (
                        <>
                            <div className="row">
                                <span>Cash Received:</span>
                                <span>{formatCurrency(sale.cashReceived)}</span>
                            </div>
                            <div className="row">
                                <span>Change:</span>
                                <span>{formatCurrency(sale.changeGiven || 0)}</span>
                            </div>
                        </>
                    )}

                    <div className="divider"></div>

                    {/* Footer */}
                    <div className="center" style={{ marginTop: "16px" }}>
                        <div>Thank you for your purchase!</div>
                        <div style={{ marginTop: "8px", fontSize: "10px" }}>
                            Powered by BrownLedger
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

ReceiptPrint.displayName = "ReceiptPrint";

// Quick button component for triggering print
export function PrintReceiptButton({
    onClick,
    disabled = false,
}: {
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2 h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
        >
            🖨️ Print Receipt
        </button>
    );
}
