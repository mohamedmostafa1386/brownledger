// Arabic Invoice PDF Generator
// RTL-compatible HTML template for Arabic invoices

import { formatCurrency } from "@/lib/format";

interface InvoiceData {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    company: {
        name: string;
        nameAr?: string;
        address: string;
        taxId: string;
        phone?: string;
        email?: string;
        logo?: string;
    };
    client: {
        name: string;
        nameAr?: string;
        address: string;
        taxId?: string;
        phone?: string;
        email?: string;
    };
    items: {
        description: string;
        descriptionAr?: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount?: number;
    total: number;
    notes?: string;
    notesAr?: string;
    etaUuid?: string;
    etaLongId?: string;
}

// Arabic number conversion
function toArabicNumerals(num: number | string): string {
    const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return num.toString().replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)]);
}

// Format date in Arabic
function formatArabicDate(dateStr: string): string {
    const date = new Date(dateStr);
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    return `${toArabicNumerals(date.getDate())} ${months[date.getMonth()]} ${toArabicNumerals(date.getFullYear())}`;
}

// Format currency in Arabic
function formatArabicCurrency(amount: number): string {
    const formatted = amount.toLocaleString("ar-EG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${formatted} ج.م`;
}

export function generateArabicInvoicePDF(invoice: InvoiceData): string {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة ${invoice.invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
            direction: rtl;
        }
        
        .invoice {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .company-info h1 {
            font-size: 28px;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .company-info p {
            color: #666;
            font-size: 14px;
        }
        
        .invoice-title {
            text-align: left;
        }
        
        .invoice-title h2 {
            font-size: 32px;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 18px;
            color: #666;
        }
        
        .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        
        .party {
            width: 45%;
        }
        
        .party h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .party-name {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .party p {
            font-size: 14px;
            color: #444;
        }
        
        .dates {
            display: flex;
            gap: 40px;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .date-item label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .date-item span {
            font-size: 16px;
            font-weight: 600;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        th {
            background: #2563eb;
            color: white;
            padding: 15px;
            text-align: right;
            font-size: 14px;
        }
        
        th:first-child {
            border-radius: 0 8px 0 0;
        }
        
        th:last-child {
            border-radius: 8px 0 0 0;
            text-align: left;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        
        td:last-child {
            text-align: left;
            font-weight: 600;
        }
        
        .totals {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 40px;
        }
        
        .totals-table {
            width: 300px;
        }
        
        .totals-table .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        
        .totals-table .row.total {
            border-bottom: none;
            padding-top: 15px;
            font-size: 20px;
            font-weight: 700;
            color: #2563eb;
        }
        
        .notes {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .notes h4 {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .eta-info {
            margin-top: 30px;
            padding: 20px;
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
        }
        
        .eta-info h4 {
            color: #059669;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .eta-info p {
            font-size: 12px;
            color: #047857;
            font-family: monospace;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        
        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .invoice { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>${invoice.company.nameAr || invoice.company.name}</h1>
                <p>${invoice.company.address}</p>
                <p>الرقم الضريبي: ${toArabicNumerals(invoice.company.taxId)}</p>
                ${invoice.company.phone ? `<p>هاتف: ${toArabicNumerals(invoice.company.phone)}</p>` : ""}
            </div>
            <div class="invoice-title">
                <h2>فاتورة ضريبية</h2>
                <p class="invoice-number">#${toArabicNumerals(invoice.invoiceNumber)}</p>
            </div>
        </div>

        <!-- Parties -->
        <div class="parties">
            <div class="party">
                <h3>البائع</h3>
                <p class="party-name">${invoice.company.nameAr || invoice.company.name}</p>
                <p>${invoice.company.address}</p>
                <p>الرقم الضريبي: ${toArabicNumerals(invoice.company.taxId)}</p>
            </div>
            <div class="party">
                <h3>المشتري</h3>
                <p class="party-name">${invoice.client.nameAr || invoice.client.name}</p>
                <p>${invoice.client.address}</p>
                ${invoice.client.taxId ? `<p>الرقم الضريبي: ${toArabicNumerals(invoice.client.taxId)}</p>` : ""}
            </div>
        </div>

        <!-- Dates -->
        <div class="dates">
            <div class="date-item">
                <label>تاريخ الإصدار</label>
                <span>${formatArabicDate(invoice.issueDate)}</span>
            </div>
            <div class="date-item">
                <label>تاريخ الاستحقاق</label>
                <span>${formatArabicDate(invoice.dueDate)}</span>
            </div>
        </div>

        <!-- Items -->
        <table>
            <thead>
                <tr>
                    <th>الوصف</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                <tr>
                    <td>${item.descriptionAr || item.description}</td>
                    <td>${toArabicNumerals(item.quantity)}</td>
                    <td>${formatArabicCurrency(item.unitPrice)}</td>
                    <td>${formatArabicCurrency(item.total)}</td>
                </tr>
                `).join("")}
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="totals-table">
                <div class="row">
                    <span>المجموع الفرعي</span>
                    <span>${formatArabicCurrency(invoice.subtotal)}</span>
                </div>
                ${invoice.discount ? `
                <div class="row">
                    <span>الخصم</span>
                    <span>- ${formatArabicCurrency(invoice.discount)}</span>
                </div>
                ` : ""}
                <div class="row">
                    <span>ضريبة القيمة المضافة (${toArabicNumerals(invoice.taxRate)}٪)</span>
                    <span>${formatArabicCurrency(invoice.taxAmount)}</span>
                </div>
                <div class="row total">
                    <span>الإجمالي</span>
                    <span>${formatArabicCurrency(invoice.total)}</span>
                </div>
            </div>
        </div>

        ${invoice.notesAr || invoice.notes ? `
        <div class="notes">
            <h4>ملاحظات</h4>
            <p>${invoice.notesAr || invoice.notes}</p>
        </div>
        ` : ""}

        ${invoice.etaUuid ? `
        <div class="eta-info">
            <h4>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                تم التسجيل في منظومة الفاتورة الإلكترونية
            </h4>
            <p>UUID: ${invoice.etaUuid}</p>
            ${invoice.etaLongId ? `<p>Long ID: ${invoice.etaLongId}</p>` : ""}
        </div>
        ` : ""}

        <div class="footer">
            <p>شكراً لتعاملكم معنا</p>
            <p>تم إنشاء هذه الفاتورة بواسطة BrownLedger</p>
        </div>
    </div>
</body>
</html>
`;
}

// Generate QR code data for invoice (for e-invoicing compliance)
export function generateInvoiceQRData(invoice: InvoiceData): string {
    // TLV format as per ZATCA/ETA requirements
    const data = [
        invoice.company.name,
        invoice.company.taxId,
        invoice.issueDate,
        invoice.total.toFixed(2),
        invoice.taxAmount.toFixed(2),
    ];

    return Buffer.from(data.join("|")).toString("base64");
}
