import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Industry templates for customization
const INDUSTRY_TEMPLATES: Record<string, {
    clientCategories: { name: string; nameAr: string }[];
    expenseCategories: string[];
    productCategories: string[];
}> = {
    manufacturing: {
        clientCategories: [
            { name: "Distributors", nameAr: "موزعين" },
            { name: "Retailers", nameAr: "تجار تجزئة" },
            { name: "Wholesalers", nameAr: "تجار جملة" },
            { name: "Direct Customers", nameAr: "عملاء مباشرين" },
        ],
        expenseCategories: [
            "Raw Materials", "Equipment Maintenance", "Labor", "Utilities",
            "Shipping", "Packaging", "Quality Control", "Safety Equipment"
        ],
        productCategories: [
            "Finished Goods", "Raw Materials", "Work in Progress", "Spare Parts"
        ],
    },
    retail: {
        clientCategories: [
            { name: "Walk-in Customers", nameAr: "عملاء المتجر" },
            { name: "Online Customers", nameAr: "عملاء أونلاين" },
            { name: "Wholesale Buyers", nameAr: "مشترين بالجملة" },
            { name: "VIP Members", nameAr: "أعضاء VIP" },
        ],
        expenseCategories: [
            "Inventory", "Store Rent", "Staff Salaries", "Marketing",
            "POS Equipment", "Store Supplies", "Packaging", "Delivery"
        ],
        productCategories: [
            "Electronics", "Clothing", "Food & Beverages", "Home & Living", "Sports", "Beauty"
        ],
    },
    services: {
        clientCategories: [
            { name: "Corporate Clients", nameAr: "شركات" },
            { name: "SME Clients", nameAr: "شركات صغيرة" },
            { name: "Individual Clients", nameAr: "أفراد" },
            { name: "Government", nameAr: "حكومي" },
        ],
        expenseCategories: [
            "Professional Development", "Software Subscriptions", "Travel",
            "Marketing", "Office Supplies", "Communication", "Insurance"
        ],
        productCategories: [
            "Consulting", "Implementation", "Support", "Training", "Custom Projects"
        ],
    },
    construction: {
        clientCategories: [
            { name: "Commercial Projects", nameAr: "مشاريع تجارية" },
            { name: "Residential Projects", nameAr: "مشاريع سكنية" },
            { name: "Government Contracts", nameAr: "عقود حكومية" },
            { name: "Subcontractors", nameAr: "مقاولين فرعيين" },
        ],
        expenseCategories: [
            "Materials", "Labor", "Equipment Rental", "Permits",
            "Safety Equipment", "Transportation", "Subcontractors", "Insurance"
        ],
        productCategories: [
            "Building Materials", "Tools", "Safety Gear", "Heavy Equipment Parts"
        ],
    },
    healthcare: {
        clientCategories: [
            { name: "Patients", nameAr: "مرضى" },
            { name: "Insurance Companies", nameAr: "شركات تأمين" },
            { name: "Hospitals", nameAr: "مستشفيات" },
            { name: "Clinics", nameAr: "عيادات" },
        ],
        expenseCategories: [
            "Medical Supplies", "Equipment", "Staff Salaries", "Insurance",
            "Utilities", "Lab Services", "Pharmaceuticals", "Maintenance"
        ],
        productCategories: [
            "Medical Equipment", "Pharmaceuticals", "Consumables", "PPE"
        ],
    },
    restaurant: {
        clientCategories: [
            { name: "Dine-in", nameAr: "داخل المطعم" },
            { name: "Takeaway", nameAr: "طلبات خارجية" },
            { name: "Delivery Apps", nameAr: "تطبيقات التوصيل" },
            { name: "Catering", nameAr: "تموين" },
        ],
        expenseCategories: [
            "Food Ingredients", "Kitchen Equipment", "Staff Salaries", "Rent",
            "Utilities", "Cleaning Supplies", "Packaging", "Marketing"
        ],
        productCategories: [
            "Appetizers", "Main Courses", "Desserts", "Beverages", "Sides"
        ],
    },
    other: {
        clientCategories: [
            { name: "Corporate", nameAr: "شركات" },
            { name: "Individual", nameAr: "أفراد" },
            { name: "Government", nameAr: "حكومي" },
            { name: "Other", nameAr: "أخرى" },
        ],
        expenseCategories: [
            "Rent", "Salaries", "Utilities", "Marketing",
            "Office Supplies", "Travel", "Insurance", "Equipment"
        ],
        productCategories: [
            "Products", "Services", "Subscriptions", "Custom"
        ],
    },
};

// Keywords for industry detection (fallback when no OpenAI)
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    manufacturing: ["manufacturing", "factory", "production", "metal", "steel", "iron", "produce", "fabricat", "machine", "industrial", "workshop"],
    retail: ["retail", "shop", "store", "sell", "selling", "ecommerce", "e-commerce", "online store", "boutique", "merchandise"],
    services: ["consulting", "service", "agency", "professional", "freelance", "advisory", "software", "tech", "IT", "design"],
    construction: ["construction", "building", "contractor", "architect", "real estate", "renovation", "infrastructure", "civil"],
    healthcare: ["health", "medical", "clinic", "hospital", "pharmacy", "doctor", "patient", "dental", "therapy", "care"],
    restaurant: ["restaurant", "food", "cafe", "catering", "kitchen", "dining", "chef", "menu", "delivery", "takeaway"],
};

// Detect currency from country mentions
const CURRENCY_KEYWORDS: Record<string, string> = {
    "egypt": "EGP", "cairo": "EGP", "egyptian": "EGP",
    "usa": "USD", "america": "USD", "us": "USD", "dollar": "USD",
    "uk": "GBP", "britain": "GBP", "london": "GBP", "pound": "GBP",
    "europe": "EUR", "euro": "EUR", "germany": "EUR", "france": "EUR",
    "saudi": "SAR", "riyadh": "SAR", "jeddah": "SAR",
    "uae": "AED", "dubai": "AED", "emirates": "AED", "abu dhabi": "AED",
};

// Fallback analysis function (no AI required)
function analyzeWithoutAI(description: string): {
    industry: string;
    companyType: string;
    currency: string;
    vatRate: number;
    language: string;
    recommendations: string[];
} {
    const lowerDesc = description.toLowerCase();

    // Detect industry
    let detectedIndustry = "other";
    let maxScore = 0;

    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
        let score = 0;
        for (const keyword of keywords) {
            if (lowerDesc.includes(keyword.toLowerCase())) {
                score++;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            detectedIndustry = industry;
        }
    }

    // Detect currency
    let currency = "USD";
    for (const [keyword, curr] of Object.entries(CURRENCY_KEYWORDS)) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
            currency = curr;
            break;
        }
    }

    // Detect company type
    let companyType = "LLC";
    if (lowerDesc.includes("corporation") || lowerDesc.includes("inc") || lowerDesc.includes("corp")) {
        companyType = "CORPORATION";
    } else if (lowerDesc.includes("partnership") || lowerDesc.includes("partners")) {
        companyType = "PARTNERSHIP";
    } else if (lowerDesc.includes("sole") || lowerDesc.includes("freelance") || lowerDesc.includes("individual")) {
        companyType = "SOLE_PROPRIETORSHIP";
    }

    // Detect language preference
    const language = /[\u0600-\u06FF]/.test(description) ? "ar" : "en";

    // VAT rate based on currency/country
    const vatRates: Record<string, number> = {
        "EGP": 14, "USD": 0, "GBP": 20, "EUR": 19, "SAR": 15, "AED": 5
    };

    // Generate recommendations
    const recommendations: string[] = [];
    if (detectedIndustry === "manufacturing") {
        recommendations.push("Consider setting up inventory tracking for raw materials");
        recommendations.push("Enable job costing for project-based billing");
    } else if (detectedIndustry === "retail") {
        recommendations.push("Set up POS for in-store sales");
        recommendations.push("Enable loyalty points for repeat customers");
    } else if (detectedIndustry === "services") {
        recommendations.push("Use time tracking for billable hours");
        recommendations.push("Set up recurring invoices for retainer clients");
    }

    return {
        industry: detectedIndustry,
        companyType,
        currency,
        vatRate: vatRates[currency] || 0,
        language,
        recommendations,
    };
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { description, companyId, step } = body;

        // Step 1: Analyze business description
        if (step === "analyze") {
            if (!description) {
                return NextResponse.json({ error: "Business description is required" }, { status: 400 });
            }

            // Use keyword-based analysis (works without OpenAI)
            const analysis = analyzeWithoutAI(description);

            // Merge with industry template
            const template = INDUSTRY_TEMPLATES[analysis.industry];

            return NextResponse.json({
                success: true,
                analysis: {
                    ...analysis,
                    templateCategories: template,
                },
                message: "Business analyzed successfully",
            });
        }

        // Step 2: Apply customizations to company
        if (step === "apply") {
            if (!companyId) {
                return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
            }

            const { analysis } = body;
            if (!analysis) {
                return NextResponse.json({ error: "Analysis data is required" }, { status: 400 });
            }

            // Verify company belongs to user
            const membership = await prisma.companyMembership.findFirst({
                where: {
                    userId: session.user.id,
                    companyId,
                    role: { in: ["OWNER", "ADMIN"] },
                },
            });

            if (!membership) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }

            // Get template categories
            const template = INDUSTRY_TEMPLATES[analysis.industry] || INDUSTRY_TEMPLATES.other;
            const clientCategories = template.clientCategories;
            const expenseCategories = template.expenseCategories;

            // Create client categories
            let createdClientCats = 0;
            for (const cat of clientCategories) {
                try {
                    await prisma.clientCategory.upsert({
                        where: { companyId_name: { companyId, name: cat.name } },
                        update: {},
                        create: {
                            companyId,
                            name: cat.name,
                            nameAr: cat.nameAr,
                        },
                    });
                    createdClientCats++;
                } catch (e) {
                    console.error("Error creating client category:", e);
                }
            }

            // Create expense categories
            let createdExpenseCats = 0;
            for (const cat of expenseCategories) {
                try {
                    await prisma.expenseCategory.upsert({
                        where: { companyId_name: { companyId, name: cat } },
                        update: {},
                        create: {
                            companyId,
                            name: cat,
                        },
                    });
                    createdExpenseCats++;
                } catch (e) {
                    console.error("Error creating expense category:", e);
                }
            }

            // Update company settings
            await prisma.company.update({
                where: { id: companyId },
                data: {
                    currency: analysis.currency || "USD",
                    companyType: analysis.companyType || "LLC",
                },
            });

            return NextResponse.json({
                success: true,
                message: "Customizations applied successfully",
                applied: {
                    clientCategories: createdClientCats,
                    expenseCategories: createdExpenseCats,
                },
            });
        }

        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    } catch (error) {
        console.error("Error in AI onboarding:", error);
        return NextResponse.json({ error: "Failed to process onboarding" }, { status: 500 });
    }
}

// GET endpoint to retrieve onboarding status
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current company setup status
        const [clientCategories, expenseCategories] = await Promise.all([
            prisma.clientCategory.count({ where: { companyId: session.user.companyId } }),
            prisma.expenseCategory.count({ where: { companyId: session.user.companyId } }),
        ]);

        const isSetup = clientCategories > 0 || expenseCategories > 0;

        return NextResponse.json({
            isSetup,
            stats: {
                clientCategories,
                expenseCategories,
            },
        });
    } catch (error) {
        console.error("Error checking onboarding status:", error);
        return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
    }
}
