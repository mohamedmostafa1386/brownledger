import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(array: T[]): T {
    return array[randomInt(0, array.length - 1)];
}

function randomDate(startMonthsAgo: number, endMonthsAgo: number = 0): Date {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - startMonthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - endMonthsAgo, 28);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Arabic Data Sets
const FIRST_NAMES = ["أحمد", "محمد", "عمر", "خالد", "حسن", "علي", "يوسف", "إبراهيم", "سارة", "نادية", "فاطمة", "هبة", "محمود", "مصطفى"];
const LAST_NAMES = ["حسن", "محمد", "علي", "إبراهيم", "سالم", "فاروق", "عبدالله", "عثمان", "منصور", "النجار", "الحداد"];

const COMPANY_PREFIXES_AR = ["شركة", "مجموعة", "مؤسسة", "المتحدة لـ", "العالمية لـ", "الوطنية لـ"];
const COMPANY_SUFFIXES_AR = ["للتجارة", "للمقاولات", "للصناعة", "الأهلية", "المحدودة", "للأستيراد والتصدير", "للتوريدات"];
const INDUSTRIES_AR = ["الهندسية", "الطبية", "الزراعية", "التكنولوجية", "المعمارية", "الكيميائية"];

const CITIES_AR = ["القاهرة", "الإسكندرية", "الجيزة", "التجمع الخامس", "6 أكتوبر", "الشيخ زايد", "المعادي", "مدينة نصر", "مصر الجديدة", "المهندسين"];

const PRODUCT_CATEGORIES = ["بوابات معدنية", "درابزين", "ديكورات", "خردوات", "مواد خام", "أدوات", "دهانات", "أثاث معدني", "خارجي", "أعمال خاصة"];

// Bilingual Product Names: Arabic (English)
const PRODUCT_NAMES: Record<string, string[]> = {
    "بوابات معدنية": ["بوابة حديد مشغول (Classic Iron Gate)", "بوابة منزلقة حديثة (Sliding Gate)", "بوابة مزدوجة (Double Gate)", "بوابة أمنية (Security Gate)", "بوابة فيرفورجيه (Fer Forge Gate)"],
    "درابزين": ["درابزين بلكونة (Balcony Railing)", "درابزين سلم (Stair Railing)", "سور حديقة (Garden Fence)", "حواجز أمان (Safety Barriers)", "درابزين ستانلس (Stainless Railing)"],
    "ديكورات": ["لوحة فنية جدارية (Wall Art)", "لافتة معدنية (Metal Sign)", "تمثال حديقة (Garden Sculpture)", "قاعدة مصباح (Lamp Base)", "إطار مرآة (Mirror Frame)"],
    "خردوات": ["مفصلات ثقيلة (Heavy Hinge)", "قفل بوابة (Gate Lock)", "مقبض باب (Door Handle)", "اكسسوارات أبواب (Door Accessories)", "مسامير وصلب (Steel Nails)"],
    "مواد خام": ["ماسورة حديد 2 بوصة (Steel Pipe)", "لوح صاج 4x8 (Metal Sheet)", "قطاع ألومنيوم (Aluminum Profile)", "سيخ ستانلس (Stainless Rod)", "خوص حديد (Iron Flat Bar)"],
    "أدوات": ["ماكينة لحام (Welding Machine)", "صاروخ قطعية (Angle Grinder)", "شنيور (Drill)", "لمبة لحام (Torch)", "أدوات ثني (Bending Tool)"],
    "دهانات": ["بطانة (Primer)", "دهان بودرة (Powder Coating)", "دهان إيبوكسي (Epoxy Paint)", "مانع صدأ (Rust Inhibitor)", "ورنيش شفاف (Clear Lacquer)"],
    "أثاث معدني": ["قاعدة طاولة (Table Base)", "إطار كرسي (Chair Frame)", "شاسيه سرير (Bed Frame)", "حامل أرفف (Shelf Bracket)", "هيكل دولاب (Cabinet Frame)"],
    "خارجي": ["برجولة (Pergola)", "سياج (Fence)", "تظليل (Shade Struct)", "مقعد حديقة (Outdoor Bench)", "أرجوحة معدنية (Metal Swing)"],
    "أعمال خاصة": ["قص ليزر (Laser Cut)", "حفر CNC (CNC Engraving)", "لحام مخصص (Custom Weld)", "أعمال ترميم (Restoration)", "تصميمات خاصة (Custom Design)"]
};

// Expense Categories
const EXPENSE_CATEGORIES_AR = ["مستلزمات مكتبية", "مرافق وكهرباء", "إيجار", "رواتب", "تسويق", "سفر وانتقالات", "صيانة معدات", "تأمين", "خدمات مهنية", "نثريات"];

async function main() {
    console.log("🌱 Seeding database with Fully Arabized data...\n");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    const tables = [
        "PaymentApplication", "PaymentDeduction", "Payment",
        "JournalEntryLine", "JournalEntry", "FinancialRatioSnapshot",
        "POSSaleItem", "POSSale", "CashierShift", "POSTerminal",
        "StockMovement", "StockAlert", "Stock", "Warehouse",
        "PurchaseOrderItem", "PurchaseOrder",
        "BillItem", "Bill", "InvoiceItem", "Invoice",
        "Expense", "BankTransaction", "BankAccount",
        "Product", "ProductCategory", "Client", "ClientCategory",
        "Supplier", "SupplierContact", "ExpenseCategory", "Account",
        "DividendPayment", "Dividend", "Shareholder", "Partner",
        "CompanyMembership", "Company", "User"
    ];
    for (const table of tables) {
        try { await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`); } catch { }
    }

    // ===== USERS =====
    console.log("👤 Creating users (Admin & Cashier)...");
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const owner = await prisma.user.create({
        data: { email: "admin@brownledger.com", name: "أحمد حسن (Admin)", password: hashedPassword, role: "OWNER", pin: "1234" }
    });
    const cashier = await prisma.user.create({
        data: { email: "cashier@brownledger.com", name: "محمد علي (Cashier)", password: hashedPassword, role: "CASHIER", pin: "5678" }
    });

    // ===== COMPANY =====
    console.log("🏢 Creating company...");
    const company = await prisma.company.create({
        data: {
            id: "demo-company",
            name: "Hagar Hamdy Metalcraft",
            nameAr: "هاجر حمدي للمشغولات المعدنية",
            taxId: "EG-123456789",
            currency: "EGP",
            fiscalYearStart: 1,
            address: "6 أكتوبر، الجيزة، مصر",
            phone: "+20 123 456 7890",
            companyType: "LLC"
        }
    });
    await prisma.companyMembership.create({ data: { userId: owner.id, companyId: company.id, role: "OWNER" } });
    await prisma.companyMembership.create({ data: { userId: cashier.id, companyId: company.id, role: "CASHIER" } });

    // ===== CLIENT CATEGORIES =====
    console.log("📁 Creating client categories...");
    const corporateCat = await prisma.clientCategory.create({
        data: { companyId: company.id, name: "Corporate", nameAr: "شركات", color: "#3B82F6" }
    });
    const govCat = await prisma.clientCategory.create({
        data: { companyId: company.id, name: "Government", nameAr: "حكومي", color: "#10B981" }
    });
    const residentialCat = await prisma.clientCategory.create({
        data: { companyId: company.id, name: "Residential", nameAr: "سكني", color: "#F59E0B" }
    });
    const categoryIds = [corporateCat.id, govCat.id, residentialCat.id];

    // ===== CLIENTS (50) =====
    console.log("👥 Creating 50 clients...");
    const clients: any[] = [];
    for (let i = 0; i < 50; i++) {
        // Generate Arabic company name
        const arName = `${pick(COMPANY_PREFIXES_AR)} ${pick(LAST_NAMES)} ${pick(COMPANY_SUFFIXES_AR)}`;
        const enName = `Al-${pick(LAST_NAMES)} ${pick(["Trading", "Co", "Group"])}`; // Simple transliteration mock

        const client = await prisma.client.create({
            data: {
                companyId: company.id,
                categoryId: pick(categoryIds),
                name: enName, // English name field
                nameAr: arName, // Arabic field populated!
                email: `info${i + 1}@client${i + 1}.com`,
                phone: `+20 1${randomInt(0, 2)}${randomInt(0, 9)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
                address: `${randomInt(1, 99)} شارع ${pick(CITIES_AR)}`,
                paymentTerms: pick([15, 30, 45, 60]),
                totalOutstanding: 0,
            },
        });
        clients.push(client);
    }

    // ===== SUPPLIERS (20) =====
    console.log("📦 Creating 20 suppliers...");
    const suppliers: any[] = [];
    for (let i = 0; i < 20; i++) {
        const arName = `${pick(COMPANY_PREFIXES_AR)} ${pick(["المعادن", "الصلب", "الدهانات", "العدد", "الخامات"])} ${pick(COMPANY_SUFFIXES_AR)}`;
        const supplier = await prisma.supplier.create({
            data: {
                companyId: company.id,
                name: arName, // Using Arabic name as primary here since Supplier doesn't have nameAr in schema (checked previously)
                // Wait, Supplier schema check: "name String". No nameAr.
                // So I put Arabic name directly in Name.
                contactPerson: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
                email: `supplier${i + 1}@suppliers.com`,
                phone: `+20 1${randomInt(0, 2)}${randomInt(0, 9)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
                city: pick(CITIES_AR),
                address: `المنطقة الصناعية، ${pick(CITIES_AR)}`,
                paymentTerms: pick([15, 30, 45, 60]),
                rating: randomInt(3, 5),
            },
        });
        suppliers.push(supplier);
    }

    // ===== PRODUCT CATEGORIES & PRODUCTS =====
    console.log("🏷️  Creating product categories and 50 products...");
    const products: any[] = [];
    let productCount = 0;
    for (const catName of PRODUCT_CATEGORIES) {
        const category = await prisma.productCategory.create({ data: { name: catName } });
        const prodNames = PRODUCT_NAMES[catName] || [];
        for (const prodName of prodNames) {
            productCount++;
            const cost = randomInt(100, 2000);
            const product = await prisma.product.create({
                data: {
                    companyId: company.id,
                    sku: `PRD-${String(productCount).padStart(3, "0")}`,
                    barcode: `880000${String(productCount).padStart(6, "0")}`,
                    name: prodName, // Bilingual Name
                    categoryId: category.id,
                    // description: "وصف المنتج بالعربي...", // Could add description if schema supports
                    costPrice: cost,
                    sellingPrice: Math.round(cost * (1.3 + Math.random() * 0.4)), // 30-70% margin
                    taxRate: 0.14,
                    stockQuantity: randomInt(20, 150),
                    lowStockAlert: randomInt(10, 25),
                    isActive: true,
                }
            });
            products.push(product);
        }
    }

    // ===== EXPENSE CATEGORIES =====
    console.log("📂 Creating expense categories...");
    const expenseCategories: any[] = [];
    for (const name of EXPENSE_CATEGORIES_AR) {
        const cat = await prisma.expenseCategory.create({ data: { companyId: company.id, name } });
        expenseCategories.push(cat);
    }

    // ===== BANK ACCOUNTS =====
    console.log("🏦 Creating bank accounts...");
    const mainBank = await prisma.bankAccount.create({
        data: { companyId: company.id, name: "البنك الأهلي المصري (NBE)", accountNumber: "1234567890", balance: 250000, currency: "EGP" }
    });
    await prisma.bankAccount.create({
        data: { companyId: company.id, name: "الخزينة الرئيسية (Petty Cash)", balance: 15000, currency: "EGP" }
    });

    // ===== CHART OF ACCOUNTS =====
    console.log("📊 Creating chart of accounts...");
    const glAccounts = [
        { code: "1000", name: "Cash", nameAr: "النقدية ما في حكمها", type: "ASSET", category: "CURRENT_ASSET", balance: 265000, normal: "DEBIT" },
        { code: "1100", name: "Accounts Receivable", nameAr: "العملاء (المدينون)", type: "ASSET", category: "CURRENT_ASSET", balance: 185000, normal: "DEBIT" },
        { code: "1200", name: "Inventory", nameAr: "المخزون", type: "ASSET", category: "CURRENT_ASSET", balance: 95000, normal: "DEBIT" },
        { code: "1300", name: "Prepaid Expenses", nameAr: "مصروفات مدفوعة مقدماً", type: "ASSET", category: "CURRENT_ASSET", balance: 12000, normal: "DEBIT" },
        { code: "1500", name: "Equipment", nameAr: "الآلات والمعدات", type: "ASSET", category: "FIXED_ASSET", balance: 180000, normal: "DEBIT" },
        { code: "1510", name: "Vehicles", nameAr: "وسائل النقل", type: "ASSET", category: "FIXED_ASSET", balance: 120000, normal: "DEBIT" },
        { code: "1520", name: "Buildings", nameAr: "المباني والإنشاءات", type: "ASSET", category: "FIXED_ASSET", balance: 450000, normal: "DEBIT" },
        { code: "1590", name: "Accumulated Depreciation", nameAr: "مجمع الإهلاك", type: "ASSET", category: "FIXED_ASSET", balance: -85000, normal: "CREDIT" },
        { code: "2000", name: "Accounts Payable", nameAr: "الموردون (الدائنون)", type: "LIABILITY", category: "CURRENT_LIABILITY", balance: 78000, normal: "CREDIT" },
        { code: "2100", name: "Accrued Expenses", nameAr: "مصروفات مستحقة", type: "LIABILITY", category: "CURRENT_LIABILITY", balance: 22000, normal: "CREDIT" },
        { code: "2200", name: "VAT Payable", nameAr: "ضريبة القيمة المضافة", type: "LIABILITY", category: "CURRENT_LIABILITY", balance: 18500, normal: "CREDIT" },
        { code: "2500", name: "Bank Loan", nameAr: "قروض بنكية", type: "LIABILITY", category: "LONG_TERM_LIABILITY", balance: 200000, normal: "CREDIT" },
        { code: "3000", name: "Owner Capital", nameAr: "رأس المال", type: "EQUITY", category: "CAPITAL", balance: 500000, normal: "CREDIT" },
        { code: "3100", name: "Retained Earnings", nameAr: "الأرباح المرحلة", type: "EQUITY", category: "RETAINED_EARNINGS", balance: 185000, normal: "CREDIT" },
        { code: "4000", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", balance: 850000, normal: "CREDIT" },
        { code: "4100", name: "Service Revenue", nameAr: "إيرادات الخدمات", type: "REVENUE", category: "OPERATING_REVENUE", balance: 125000, normal: "CREDIT" },
        { code: "4200", name: "Interest Income", nameAr: "فوائد دائنة", type: "REVENUE", category: "OTHER_INCOME", balance: 8500, normal: "CREDIT" },
        { code: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", balance: 420000, normal: "DEBIT" },
        { code: "6000", name: "Salaries Expense", nameAr: "الرواتب والأجور", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 180000, normal: "DEBIT" },
        { code: "6100", name: "Rent Expense", nameAr: "الإيجار", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 48000, normal: "DEBIT" },
        { code: "6200", name: "Utilities Expense", nameAr: "الكهرباء والمياه", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 24000, normal: "DEBIT" },
        { code: "6300", name: "Marketing Expense", nameAr: "الدعاية والإعلان", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 35000, normal: "DEBIT" },
        { code: "6400", name: "Office Supplies", nameAr: "مطبوعات وأدوات كتابية", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 8000, normal: "DEBIT" },
        { code: "6500", name: "Depreciation Expense", nameAr: "الإهلاك", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 25000, normal: "DEBIT" },
        { code: "6600", name: "Insurance Expense", nameAr: "التأمين", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 15000, normal: "DEBIT" },
        { code: "6700", name: "Professional Fees", nameAr: "أتعاب واستشارات", type: "EXPENSE", category: "OPERATING_EXPENSE", balance: 12000, normal: "DEBIT" },
    ];
    for (const acc of glAccounts) {
        await prisma.account.create({
            data: {
                companyId: company.id,
                accountCode: acc.code,
                accountName: acc.name,
                accountNameAr: acc.nameAr,
                accountType: acc.type as any,
                accountCategory: acc.category as any,
                normalBalance: acc.normal as any,
                currentBalance: acc.balance,
            },
        });
    }

    // ===== INVOICES (150 over 12 months) =====
    console.log("📄 Creating 150 invoices...");
    const invoiceStatuses = ["PAID", "PAID", "PAID", "PENDING", "PENDING", "OVERDUE"];
    for (let i = 0; i < 150; i++) {
        const issueDate = randomDate(12, 0);
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + pick([15, 30, 45]));
        const client = pick(clients);
        const status = pick(invoiceStatuses);

        const invoice = await prisma.invoice.create({
            data: {
                companyId: company.id,
                clientId: client.id,
                invoiceNumber: `INV-${String(i + 1).padStart(5, "0")}`,
                issueDate,
                dueDate,
                status,
                currency: "EGP",
                notes: `فاتورة مبيعات لـ ${client.nameAr}`, // Arabic Note
            }
        });

        // Invoice items (1-5 items per invoice)
        const numItems = randomInt(1, 5);
        let subtotal = 0;
        for (let j = 0; j < numItems; j++) {
            const product = pick(products);
            const qty = randomInt(1, 10);
            const price = product.sellingPrice;
            const total = qty * price;
            subtotal += total;
            await prisma.invoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    description: product.name,
                    quantity: qty,
                    unitPrice: price,
                    total,
                }
            });
        }

        // Update client outstanding for pending/overdue
        if (status !== "PAID") {
            await prisma.client.update({
                where: { id: client.id },
                data: { totalOutstanding: { increment: subtotal * 1.14 } } // + VAT
            });
        }
    }

    // ===== BILLS (80 over 12 months) =====
    console.log("📋 Creating 80 bills...");
    const billStatuses = ["PAID", "PAID", "PENDING", "PENDING", "OVERDUE"];
    for (let i = 0; i < 80; i++) {
        const issueDate = randomDate(12, 0);
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + pick([15, 30, 45]));
        const supplier = pick(suppliers);
        const totalAmount = randomInt(5000, 50000);

        const bill = await prisma.bill.create({
            data: {
                companyId: company.id,
                supplierId: supplier.id,
                billNumber: `BILL-${String(i + 1).padStart(5, "0")}`,
                issueDate,
                dueDate,
                status: pick(billStatuses),
                totalAmount,
                paidAmount: 0,
                currency: "EGP",
            }
        });

        // Bill items
        const numItems = randomInt(1, 4);
        for (let j = 0; j < numItems; j++) {
            const product = pick(products);
            const qty = randomInt(5, 30);
            await prisma.billItem.create({
                data: {
                    billId: bill.id,
                    description: `شراء: ${product.name}`,
                    quantity: qty,
                    unitPrice: product.costPrice,
                }
            });
        }
    }

    // ===== EXPENSES (200 over 12 months) =====
    console.log("💸 Creating 200 expenses...");
    for (let i = 0; i < 200; i++) {
        const category = pick(expenseCategories);
        const date = randomDate(12, 0);
        await prisma.expense.create({
            data: {
                companyId: company.id,
                categoryId: category.id,
                supplierId: Math.random() > 0.5 ? pick(suppliers).id : null,
                description: `${category.name} - ${date.toLocaleDateString('ar-EG')}`,
                amount: randomInt(500, 15000),
                date,
            }
        });
    }

    // ===== POS TERMINAL & SALES =====
    console.log("🛒 Creating POS terminal and 300 sales...");
    const terminal = await prisma.pOSTerminal.create({
        data: { companyId: company.id, name: "كاونتر المعرض الرئيسي", location: "المعرض", isActive: true }
    });

    for (let i = 0; i < 300; i++) {
        const saleDate = randomDate(6, 0);
        let subtotal = 0;
        let taxAmount = 0;
        const numItems = randomInt(1, 6);
        const items: { productId: string; productName: string; quantity: number; unitPrice: number; taxRate: number; total: number }[] = [];

        for (let j = 0; j < numItems; j++) {
            const product = pick(products);
            const qty = randomInt(1, 5);
            const itemTotal = qty * product.sellingPrice;
            subtotal += itemTotal;
            taxAmount += itemTotal * 0.14;
            items.push({
                productId: product.id,
                productName: product.name,
                quantity: qty,
                unitPrice: product.sellingPrice,
                taxRate: 0.14,
                total: itemTotal,
            });
        }

        const total = subtotal + taxAmount;
        const paymentMethod = pick(["CASH", "CASH", "CARD", "MOBILE"]);
        const cashReceived = paymentMethod === "CASH" ? Math.ceil(total / 100) * 100 : null;

        const sale = await prisma.pOSSale.create({
            data: {
                companyId: company.id,
                terminalId: terminal.id,
                cashierId: pick([owner.id, cashier.id]),
                saleNumber: `POS-${String(i + 1).padStart(6, "0")}`,
                saleDate,
                subtotal,
                taxAmount,
                total,
                paymentMethod,
                cashReceived,
                changeGiven: cashReceived ? cashReceived - total : null,
                customerPhone: Math.random() > 0.7 ? `+20 1${randomInt(0, 2)}${randomInt(0, 9)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}` : null,
                status: "COMPLETED",
            }
        });

        for (const item of items) {
            await prisma.pOSSaleItem.create({
                data: { saleId: sale.id, ...item }
            });
        }
    }

    // ===== WAREHOUSE & STOCK MOVEMENTS =====
    console.log("🏭 Creating warehouse and stock movements...");
    const warehouse = await prisma.warehouse.create({
        data: { companyId: company.id, name: "المخزن الرئيسي", code: "WH-001", location: "6 أكتوبر", isActive: true }
    });

    for (const product of products) {
        // Initial stock
        await prisma.stock.create({
            data: {
                productId: product.id,
                warehouseId: warehouse.id,
                quantity: product.stockQuantity,
                availableQty: product.stockQuantity,
            }
        });

        // Stock movements
        for (let m = 0; m < randomInt(5, 15); m++) {
            const type = pick(["PURCHASE", "PURCHASE", "SALE", "SALE", "SALE", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"]);
            const qty = randomInt(5, 30);
            await prisma.stockMovement.create({
                data: {
                    companyId: company.id,
                    productId: product.id,
                    warehouseId: warehouse.id,
                    type,
                    quantity: type.includes("OUT") || type === "SALE" ? -qty : qty,
                    date: randomDate(6, 0),
                    notes: `${type} movement`,
                }
            });
        }
    }

    // ===== JOURNAL ENTRIES =====
    console.log("📒 Creating journal entries...");
    const journalEntries = [
        { desc: "Monthly Salaries", descAr: "رواتب شهرية", debit: "6000", credit: "1000", amount: 15000 },
        { desc: "Rent Payment", descAr: "دفع الإيجار", debit: "6100", credit: "1000", amount: 4000 },
        { desc: "Utilities Payment", descAr: "دفع المرافق", debit: "6200", credit: "1000", amount: 2000 },
        { desc: "Equipment Depreciation", descAr: "إهلاك المعدات", debit: "6500", credit: "1590", amount: 2500 },
        { desc: "Sales Revenue", descAr: "إيرادات المبيعات", debit: "1000", credit: "4000", amount: 45000 },
        { desc: "Customer Payment", descAr: "تحصيل من عميل", debit: "1000", credit: "1100", amount: 25000 },
        { desc: "Supplier Payment", descAr: "سداد لمورد", debit: "2000", credit: "1000", amount: 18000 },
        { desc: "Marketing Expense", descAr: "حملة إعلانية ممولة", debit: "6300", credit: "1000", amount: 5000 },
    ];

    const accounts = await prisma.account.findMany({ where: { companyId: company.id } });
    const accountMap = new Map(accounts.map(a => [a.accountCode, a.id]));

    for (let m = 0; m < 12; m++) {
        for (const je of journalEntries) {
            const entryDate = new Date();
            entryDate.setMonth(entryDate.getMonth() - m);
            const entry = await prisma.journalEntry.create({
                data: {
                    companyId: company.id,
                    journalNumber: `JE-${String(m * 10 + journalEntries.indexOf(je) + 1).padStart(5, "0")}`,
                    entryDate,
                    description: je.desc,
                    descriptionAr: je.descAr,
                    sourceType: "MANUAL",
                    status: "POSTED",
                    totalDebit: je.amount,
                    totalCredit: je.amount,
                }
            });
            await prisma.journalEntryLine.create({
                data: { journalEntryId: entry.id, accountId: accountMap.get(je.debit)!, debit: je.amount, credit: 0 }
            });
            await prisma.journalEntryLine.create({
                data: { journalEntryId: entry.id, accountId: accountMap.get(je.credit)!, debit: 0, credit: je.amount }
            });
        }
    }

    // ===== FINANCIAL RATIO SNAPSHOTS (Keep as is just data) =====
    console.log("📈 Creating financial ratio snapshots...");
    for (let m = 0; m < 12; m++) {
        const snapshotDate = new Date();
        snapshotDate.setMonth(snapshotDate.getMonth() - m);
        await prisma.financialRatioSnapshot.create({
            data: {
                companyId: company.id,
                snapshotDate,
                periodStart: new Date(snapshotDate.getFullYear(), snapshotDate.getMonth(), 1),
                periodEnd: new Date(snapshotDate.getFullYear(), snapshotDate.getMonth() + 1, 0),
                currentRatio: 2.0 + Math.random() * 0.5,
                quickRatio: 1.2 + Math.random() * 0.3,
                cashRatio: 0.5 + Math.random() * 0.2,
                grossProfitMargin: 35 + Math.random() * 10,
                netProfitMargin: 12 + Math.random() * 8,
                returnOnAssets: 8 + Math.random() * 5,
                returnOnEquity: 15 + Math.random() * 8,
                assetTurnover: 1.2 + Math.random() * 0.5,
                inventoryTurnover: 5 + Math.random() * 3,
                daysSalesOutstanding: 25 + Math.random() * 15,
                debtToEquity: 0.4 + Math.random() * 0.3,
                debtToAssets: 0.25 + Math.random() * 0.15,
                totalAssets: 1200000 + randomInt(-100000, 100000),
                totalLiabilities: 320000 + randomInt(-50000, 50000),
                totalEquity: 680000 + randomInt(-50000, 50000),
                totalRevenue: 85000 + randomInt(-20000, 30000),
                netIncome: 15000 + randomInt(-5000, 10000),
                overallHealth: pick(["EXCELLENT", "GOOD", "GOOD", "FAIR"]) as any,
            }
        });
    }

    // ===== SYNC CHART OF ACCOUNTS FROM TRANSACTIONS =====
    console.log("🔄 Syncing Chart of Accounts from transactions...");
    // ... (Use same logic, it calculates totals) ...
    // Calculate actual revenue from PAID invoices
    const allInvoices = await prisma.invoice.findMany({
        where: { companyId: company.id },
        include: { items: true },
    });
    const paidInvoiceRevenue = allInvoices
        .filter(inv => inv.status === "PAID")
        .reduce((sum, inv) => {
            return sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
        }, 0);

    const allPosSales = await prisma.pOSSale.findMany({
        where: { companyId: company.id, status: "COMPLETED" },
    });
    const posRevenueTotal = allPosSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalSalesRevenue = paidInvoiceRevenue + posRevenueTotal;

    const arTotal = allInvoices
        .filter(inv => inv.status === "PENDING" || inv.status === "OVERDUE")
        .reduce((sum, inv) => {
            return sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice * 1.14, 0);
        }, 0);

    const allBills = await prisma.bill.findMany({
        where: { companyId: company.id },
    });
    const apTotal = allBills
        .filter(b => b.status === "PENDING" || b.status === "OVERDUE")
        .reduce((sum, b) => sum + b.totalAmount - b.paidAmount, 0);

    const allProducts = await prisma.product.findMany({
        where: { companyId: company.id },
    });
    const inventoryValue = allProducts.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0);
    const cogsTotal = allPosSales.reduce((sum, sale) => sum * 0.6, 0) + paidInvoiceRevenue * 0.6;

    const accountUpdates = [
        { code: "1000", balance: 265000 },
        { code: "1100", balance: Math.round(arTotal) },
        { code: "1200", balance: Math.round(inventoryValue) },
        { code: "2000", balance: Math.round(apTotal) },
        { code: "4000", balance: Math.round(totalSalesRevenue) },
        { code: "5000", balance: Math.round(cogsTotal) },
    ];

    for (const update of accountUpdates) {
        await prisma.account.updateMany({
            where: { companyId: company.id, accountCode: update.code },
            data: { currentBalance: update.balance },
        });
    }

    console.log(`   Sales Revenue synced: EGP ${Math.round(totalSalesRevenue).toLocaleString()}`);
    console.log(`   Accounts Receivable synced: EGP ${Math.round(arTotal).toLocaleString()}`);
    console.log(`   Inventory synced: EGP ${Math.round(inventoryValue).toLocaleString()}`);
    console.log(`   Accounts Payable synced: EGP ${Math.round(apTotal).toLocaleString()}`);

    console.log("\n✅ Fully Arabized demo data created successfully!");
}

main()
    .catch((e) => { console.error("Error:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
