import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Valid AccountCategory values from Prisma schema:
// CURRENT_ASSET, FIXED_ASSET, CURRENT_LIABILITY, LONG_TERM_LIABILITY,
// CAPITAL, RETAINED_EARNINGS, OPERATING_REVENUE, OTHER_INCOME,
// COST_OF_GOODS_SOLD, OPERATING_EXPENSE, OTHER_EXPENSE

// Chart of Accounts Templates
const TEMPLATES: Record<string, {
    name: string;
    accounts: {
        code: string;
        name: string;
        nameAr?: string;
        type: string;
        category: string;
        normalBalance: string;
        parentCode?: string;
    }[];
}> = {
    standard: {
        name: "Standard Business",
        accounts: [
            // Assets
            { code: "1000", name: "Current Assets", nameAr: "الأصول المتداولة", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT" },
            { code: "1010", name: "Cash on Hand", nameAr: "النقدية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1020", name: "Bank Accounts", nameAr: "الحسابات البنكية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1100", name: "Accounts Receivable", nameAr: "العملاء", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1200", name: "Inventory", nameAr: "المخزون", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1300", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدماً", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1500", name: "Fixed Assets", nameAr: "الأصول الثابتة", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT" },
            { code: "1510", name: "Equipment", nameAr: "المعدات", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1520", name: "Furniture & Fixtures", nameAr: "الأثاث والتجهيزات", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1530", name: "Vehicles", nameAr: "السيارات", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1590", name: "Accumulated Depreciation", nameAr: "مجمع الإهلاك", type: "ASSET", category: "FIXED_ASSET", normalBalance: "CREDIT", parentCode: "1500" },
            // Liabilities
            { code: "2000", name: "Current Liabilities", nameAr: "الخصوم المتداولة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT" },
            { code: "2010", name: "Accounts Payable", nameAr: "الموردين", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2020", name: "Accrued Expenses", nameAr: "مصروفات مستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2030", name: "Taxes Payable", nameAr: "الضرائب المستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2040", name: "VAT Payable", nameAr: "ضريبة القيمة المضافة المستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2500", name: "Long-term Liabilities", nameAr: "الخصوم طويلة الأجل", type: "LIABILITY", category: "LONG_TERM_LIABILITY", normalBalance: "CREDIT" },
            { code: "2510", name: "Bank Loans", nameAr: "قروض بنكية", type: "LIABILITY", category: "LONG_TERM_LIABILITY", normalBalance: "CREDIT", parentCode: "2500" },
            // Equity
            { code: "3000", name: "Owner's Equity", nameAr: "حقوق الملكية", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT" },
            { code: "3010", name: "Paid-in Capital", nameAr: "رأس المال المدفوع", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT", parentCode: "3000" },
            { code: "3020", name: "Owner's Drawings", nameAr: "مسحوبات المالك", type: "EQUITY", category: "CAPITAL", normalBalance: "DEBIT", parentCode: "3000" },
            { code: "3030", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: "EQUITY", category: "RETAINED_EARNINGS", normalBalance: "CREDIT", parentCode: "3000" },
            // Revenue
            { code: "4000", name: "Revenue", nameAr: "الإيرادات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT" },
            { code: "4010", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4020", name: "Service Revenue", nameAr: "إيرادات الخدمات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4100", name: "Other Income", nameAr: "إيرادات أخرى", type: "REVENUE", category: "OTHER_INCOME", normalBalance: "CREDIT" },
            { code: "4110", name: "Interest Income", nameAr: "إيرادات الفوائد", type: "REVENUE", category: "OTHER_INCOME", normalBalance: "CREDIT", parentCode: "4100" },
            { code: "4900", name: "Sales Returns & Discounts", nameAr: "مردودات وخصومات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "DEBIT" },
            // Expenses
            { code: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT" },
            { code: "5010", name: "Purchases", nameAr: "المشتريات", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "5020", name: "Direct Labor", nameAr: "العمالة المباشرة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "6000", name: "Operating Expenses", nameAr: "المصروفات التشغيلية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT" },
            { code: "6010", name: "Salaries & Wages", nameAr: "الرواتب والأجور", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6020", name: "Rent Expense", nameAr: "مصروف الإيجار", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6030", name: "Utilities", nameAr: "الخدمات العامة", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6040", name: "Insurance", nameAr: "التأمين", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6050", name: "Office Supplies", nameAr: "اللوازم المكتبية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6060", name: "Marketing & Advertising", nameAr: "التسويق والإعلان", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6070", name: "Depreciation Expense", nameAr: "مصروف الإهلاك", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6080", name: "Professional Fees", nameAr: "أتعاب مهنية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6090", name: "Bank Charges", nameAr: "مصاريف بنكية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "7000", name: "Other Expenses", nameAr: "مصروفات أخرى", type: "EXPENSE", category: "OTHER_EXPENSE", normalBalance: "DEBIT" },
            { code: "7010", name: "Interest Expense", nameAr: "مصروف الفوائد", type: "EXPENSE", category: "OTHER_EXPENSE", normalBalance: "DEBIT", parentCode: "7000" },
        ],
    },
    manufacturing: {
        name: "Manufacturing",
        accounts: [
            // Assets
            { code: "1000", name: "Current Assets", nameAr: "الأصول المتداولة", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT" },
            { code: "1010", name: "Cash on Hand", nameAr: "النقدية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1020", name: "Bank Accounts", nameAr: "الحسابات البنكية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1100", name: "Accounts Receivable", nameAr: "العملاء", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1200", name: "Raw Materials Inventory", nameAr: "مخزون المواد الخام", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1210", name: "Work in Progress", nameAr: "الإنتاج تحت التشغيل", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1220", name: "Finished Goods Inventory", nameAr: "مخزون البضاعة التامة", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1230", name: "Spare Parts Inventory", nameAr: "مخزون قطع الغيار", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1300", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدماً", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1500", name: "Fixed Assets", nameAr: "الأصول الثابتة", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT" },
            { code: "1510", name: "Land", nameAr: "الأراضي", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1520", name: "Buildings", nameAr: "المباني", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1530", name: "Machinery & Equipment", nameAr: "الآلات والمعدات", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1540", name: "Tools & Dies", nameAr: "الأدوات والقوالب", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1550", name: "Vehicles", nameAr: "السيارات", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1560", name: "Office Equipment", nameAr: "الأجهزة المكتبية", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1590", name: "Accumulated Depreciation", nameAr: "مجمع الإهلاك", type: "ASSET", category: "FIXED_ASSET", normalBalance: "CREDIT", parentCode: "1500" },
            // Liabilities
            { code: "2000", name: "Current Liabilities", nameAr: "الخصوم المتداولة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT" },
            { code: "2010", name: "Accounts Payable", nameAr: "الموردين", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2020", name: "Accrued Wages", nameAr: "الأجور المستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2030", name: "Taxes Payable", nameAr: "الضرائب المستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2040", name: "VAT Payable", nameAr: "ضريبة القيمة المضافة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2050", name: "Customer Deposits", nameAr: "مقدمات العملاء", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2500", name: "Long-term Liabilities", nameAr: "الخصوم طويلة الأجل", type: "LIABILITY", category: "LONG_TERM_LIABILITY", normalBalance: "CREDIT" },
            { code: "2510", name: "Bank Loans", nameAr: "قروض بنكية", type: "LIABILITY", category: "LONG_TERM_LIABILITY", normalBalance: "CREDIT", parentCode: "2500" },
            { code: "2520", name: "Equipment Loans", nameAr: "قروض المعدات", type: "LIABILITY", category: "LONG_TERM_LIABILITY", normalBalance: "CREDIT", parentCode: "2500" },
            // Equity
            { code: "3000", name: "Owner's Equity", nameAr: "حقوق الملكية", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT" },
            { code: "3010", name: "Paid-in Capital", nameAr: "رأس المال المدفوع", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT", parentCode: "3000" },
            { code: "3020", name: "Owner's Drawings", nameAr: "مسحوبات المالك", type: "EQUITY", category: "CAPITAL", normalBalance: "DEBIT", parentCode: "3000" },
            { code: "3030", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: "EQUITY", category: "RETAINED_EARNINGS", normalBalance: "CREDIT", parentCode: "3000" },
            // Revenue
            { code: "4000", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT" },
            { code: "4010", name: "Product Sales", nameAr: "مبيعات المنتجات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4020", name: "Custom Order Sales", nameAr: "مبيعات الطلبات الخاصة", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4030", name: "Installation Revenue", nameAr: "إيرادات التركيب", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4100", name: "Other Income", nameAr: "إيرادات أخرى", type: "REVENUE", category: "OTHER_INCOME", normalBalance: "CREDIT" },
            { code: "4110", name: "Scrap Sales", nameAr: "مبيعات الخردة", type: "REVENUE", category: "OTHER_INCOME", normalBalance: "CREDIT", parentCode: "4100" },
            { code: "4900", name: "Sales Returns", nameAr: "مردودات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "DEBIT" },
            // Cost of Goods Sold
            { code: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT" },
            { code: "5010", name: "Raw Materials Cost", nameAr: "تكلفة المواد الخام", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "5020", name: "Direct Labor", nameAr: "العمالة المباشرة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "5030", name: "Manufacturing Overhead", nameAr: "المصروفات الصناعية غير المباشرة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "5040", name: "Subcontractor Costs", nameAr: "تكاليف المقاولين الفرعيين", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "5050", name: "Shipping & Freight", nameAr: "الشحن والنقل", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "5060", name: "Packaging Materials", nameAr: "مواد التعبئة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            // Factory Overhead
            { code: "5100", name: "Factory Overhead", nameAr: "مصروفات المصنع", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT" },
            { code: "5110", name: "Factory Rent", nameAr: "إيجار المصنع", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5100" },
            { code: "5120", name: "Factory Utilities", nameAr: "خدمات المصنع", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5100" },
            { code: "5130", name: "Equipment Maintenance", nameAr: "صيانة المعدات", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5100" },
            { code: "5140", name: "Factory Supplies", nameAr: "مستلزمات المصنع", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5100" },
            { code: "5150", name: "Safety Equipment", nameAr: "معدات السلامة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5100" },
            // Operating Expenses
            { code: "6000", name: "Operating Expenses", nameAr: "المصروفات التشغيلية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT" },
            { code: "6010", name: "Admin Salaries", nameAr: "رواتب الإدارة", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6020", name: "Office Rent", nameAr: "إيجار المكتب", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6030", name: "Office Utilities", nameAr: "خدمات المكتب", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6040", name: "Insurance", nameAr: "التأمين", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6050", name: "Marketing", nameAr: "التسويق", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6060", name: "Depreciation", nameAr: "الإهلاك", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6070", name: "Professional Fees", nameAr: "أتعاب مهنية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6080", name: "Transportation", nameAr: "النقل", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "7000", name: "Other Expenses", nameAr: "مصروفات أخرى", type: "EXPENSE", category: "OTHER_EXPENSE", normalBalance: "DEBIT" },
            { code: "7010", name: "Interest Expense", nameAr: "مصروف الفوائد", type: "EXPENSE", category: "OTHER_EXPENSE", normalBalance: "DEBIT", parentCode: "7000" },
            { code: "7020", name: "Bank Charges", nameAr: "مصاريف بنكية", type: "EXPENSE", category: "OTHER_EXPENSE", normalBalance: "DEBIT", parentCode: "7000" },
        ],
    },
    retail: {
        name: "Retail Business",
        accounts: [
            // Assets
            { code: "1000", name: "Current Assets", nameAr: "الأصول المتداولة", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT" },
            { code: "1010", name: "Cash on Hand", nameAr: "النقدية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1015", name: "Cash Registers", nameAr: "صندوق المحل", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1020", name: "Bank Accounts", nameAr: "الحسابات البنكية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1100", name: "Accounts Receivable", nameAr: "العملاء", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1200", name: "Merchandise Inventory", nameAr: "مخزون البضاعة", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1300", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدماً", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1500", name: "Fixed Assets", nameAr: "الأصول الثابتة", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT" },
            { code: "1510", name: "Store Fixtures", nameAr: "تجهيزات المتجر", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1520", name: "POS Equipment", nameAr: "أجهزة نقطة البيع", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1530", name: "Delivery Vehicles", nameAr: "سيارات التوصيل", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1590", name: "Accumulated Depreciation", nameAr: "مجمع الإهلاك", type: "ASSET", category: "FIXED_ASSET", normalBalance: "CREDIT", parentCode: "1500" },
            // Liabilities
            { code: "2000", name: "Current Liabilities", nameAr: "الخصوم المتداولة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT" },
            { code: "2010", name: "Accounts Payable", nameAr: "الموردين", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2020", name: "Sales Tax Payable", nameAr: "ضريبة المبيعات المستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2030", name: "Wages Payable", nameAr: "الأجور المستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2500", name: "Long-term Liabilities", nameAr: "الخصوم طويلة الأجل", type: "LIABILITY", category: "LONG_TERM_LIABILITY", normalBalance: "CREDIT" },
            // Equity
            { code: "3000", name: "Owner's Equity", nameAr: "حقوق الملكية", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT" },
            { code: "3010", name: "Capital", nameAr: "رأس المال", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT", parentCode: "3000" },
            { code: "3020", name: "Drawings", nameAr: "المسحوبات", type: "EQUITY", category: "CAPITAL", normalBalance: "DEBIT", parentCode: "3000" },
            { code: "3030", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: "EQUITY", category: "RETAINED_EARNINGS", normalBalance: "CREDIT", parentCode: "3000" },
            // Revenue
            { code: "4000", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT" },
            { code: "4010", name: "In-Store Sales", nameAr: "مبيعات المتجر", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4020", name: "Online Sales", nameAr: "مبيعات أونلاين", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4100", name: "Other Income", nameAr: "إيرادات أخرى", type: "REVENUE", category: "OTHER_INCOME", normalBalance: "CREDIT" },
            { code: "4900", name: "Sales Returns", nameAr: "مردودات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "DEBIT" },
            // Expenses
            { code: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT" },
            { code: "5010", name: "Merchandise Purchases", nameAr: "مشتريات البضاعة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "5020", name: "Freight In", nameAr: "مصاريف الشحن", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normalBalance: "DEBIT", parentCode: "5000" },
            { code: "6000", name: "Operating Expenses", nameAr: "المصروفات التشغيلية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT" },
            { code: "6010", name: "Staff Wages", nameAr: "رواتب الموظفين", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6020", name: "Store Rent", nameAr: "إيجار المتجر", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6030", name: "Utilities", nameAr: "الخدمات العامة", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6040", name: "Marketing", nameAr: "التسويق", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6050", name: "Store Supplies", nameAr: "مستلزمات المتجر", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6060", name: "Delivery Expenses", nameAr: "مصاريف التوصيل", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6070", name: "Credit Card Fees", nameAr: "رسوم البطاقات", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "7000", name: "Other Expenses", nameAr: "مصروفات أخرى", type: "EXPENSE", category: "OTHER_EXPENSE", normalBalance: "DEBIT" },
        ],
    },
    service: {
        name: "Service Company",
        accounts: [
            // Assets
            { code: "1000", name: "Current Assets", nameAr: "الأصول المتداولة", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT" },
            { code: "1010", name: "Cash", nameAr: "النقدية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1020", name: "Bank Accounts", nameAr: "الحسابات البنكية", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1100", name: "Accounts Receivable", nameAr: "العملاء", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1110", name: "Unbilled Revenue", nameAr: "إيرادات غير مفوترة", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1200", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدماً", type: "ASSET", category: "CURRENT_ASSET", normalBalance: "DEBIT", parentCode: "1000" },
            { code: "1500", name: "Fixed Assets", nameAr: "الأصول الثابتة", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT" },
            { code: "1510", name: "Office Equipment", nameAr: "الأجهزة المكتبية", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1520", name: "Computers & Software", nameAr: "أجهزة الكمبيوتر والبرامج", type: "ASSET", category: "FIXED_ASSET", normalBalance: "DEBIT", parentCode: "1500" },
            { code: "1590", name: "Accumulated Depreciation", nameAr: "مجمع الإهلاك", type: "ASSET", category: "FIXED_ASSET", normalBalance: "CREDIT", parentCode: "1500" },
            // Liabilities
            { code: "2000", name: "Current Liabilities", nameAr: "الخصوم المتداولة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT" },
            { code: "2010", name: "Accounts Payable", nameAr: "الموردين", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2020", name: "Deferred Revenue", nameAr: "إيرادات مؤجلة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            { code: "2030", name: "Taxes Payable", nameAr: "الضرائب المستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", normalBalance: "CREDIT", parentCode: "2000" },
            // Equity
            { code: "3000", name: "Owner's Equity", nameAr: "حقوق الملكية", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT" },
            { code: "3010", name: "Capital", nameAr: "رأس المال", type: "EQUITY", category: "CAPITAL", normalBalance: "CREDIT", parentCode: "3000" },
            { code: "3030", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: "EQUITY", category: "RETAINED_EARNINGS", normalBalance: "CREDIT", parentCode: "3000" },
            // Revenue
            { code: "4000", name: "Service Revenue", nameAr: "إيرادات الخدمات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT" },
            { code: "4010", name: "Consulting Fees", nameAr: "أتعاب الاستشارات", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4020", name: "Project Revenue", nameAr: "إيرادات المشاريع", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4030", name: "Retainer Revenue", nameAr: "إيرادات العقود الشهرية", type: "REVENUE", category: "OPERATING_REVENUE", normalBalance: "CREDIT", parentCode: "4000" },
            { code: "4100", name: "Other Income", nameAr: "إيرادات أخرى", type: "REVENUE", category: "OTHER_INCOME", normalBalance: "CREDIT" },
            // Expenses
            { code: "6000", name: "Operating Expenses", nameAr: "المصروفات التشغيلية", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT" },
            { code: "6010", name: "Salaries & Wages", nameAr: "الرواتب والأجور", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6020", name: "Office Rent", nameAr: "إيجار المكتب", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6030", name: "Utilities", nameAr: "الخدمات العامة", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6040", name: "Software Subscriptions", nameAr: "اشتراكات البرامج", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6050", name: "Professional Development", nameAr: "التطوير المهني", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6060", name: "Marketing", nameAr: "التسويق", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6070", name: "Travel & Entertainment", nameAr: "السفر والترفيه", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "6080", name: "Insurance", nameAr: "التأمين", type: "EXPENSE", category: "OPERATING_EXPENSE", normalBalance: "DEBIT", parentCode: "6000" },
            { code: "7000", name: "Other Expenses", nameAr: "مصروفات أخرى", type: "EXPENSE", category: "OTHER_EXPENSE", normalBalance: "DEBIT" },
        ],
    },
};

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get the user's company from membership
        const membership = await prisma.companyMembership.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true },
        });

        if (!membership) {
            return NextResponse.json({ error: "No company found" }, { status: 400 });
        }

        const companyId = membership.companyId;

        const body = await req.json();
        const { templateId } = body;

        if (!templateId) {
            return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
        }

        const template = TEMPLATES[templateId];
        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        // Create a map to track parent codes to IDs
        const codeToIdMap = new Map<string, string>();

        // First pass: Create all accounts without parent relationships
        for (const acc of template.accounts) {
            const existingAccount = await prisma.account.findFirst({
                where: {
                    companyId,
                    accountCode: acc.code,
                },
            });

            if (existingAccount) {
                codeToIdMap.set(acc.code, existingAccount.id);
                continue;
            }

            const newAccount = await prisma.account.create({
                data: {
                    companyId,
                    accountCode: acc.code,
                    accountName: acc.name,
                    accountNameAr: acc.nameAr,
                    accountType: acc.type as any,
                    accountCategory: acc.category as any,
                    normalBalance: acc.normalBalance as any,
                    isActive: true,
                    currentBalance: 0,
                },
            });

            codeToIdMap.set(acc.code, newAccount.id);
        }

        // Second pass: Update parent relationships
        for (const acc of template.accounts) {
            if (acc.parentCode) {
                const accountId = codeToIdMap.get(acc.code);
                const parentId = codeToIdMap.get(acc.parentCode);

                if (accountId && parentId) {
                    await prisma.account.update({
                        where: { id: accountId },
                        data: { parentId },
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Applied ${template.name} template with ${template.accounts.length} accounts`,
            accountsCreated: template.accounts.length,
        });
    } catch (error) {
        console.error("Error applying template:", error);
        return NextResponse.json({ error: "Failed to apply template" }, { status: 500 });
    }
}
