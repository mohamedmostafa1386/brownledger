// Egyptian Tax Authority (ETA) E-Invoicing Integration
// Based on Egypt's e-invoicing mandate for B2B transactions

import crypto from "crypto";

// ETA API Configuration
const ETA_CONFIG = {
    baseUrl: process.env.ETA_API_URL || "https://api.invoicing.eta.gov.eg",
    tokenUrl: process.env.ETA_TOKEN_URL || "https://id.eta.gov.eg/connect/token",
    clientId: process.env.ETA_CLIENT_ID || "",
    clientSecret: process.env.ETA_CLIENT_SECRET || "",
    registrationNumber: process.env.ETA_REGISTRATION_NUMBER || "",
};

// ETA Invoice Types
export type ETADocumentType = "I" | "C" | "D"; // Invoice, Credit Note, Debit Note
export type ETADocumentVersion = "0.9" | "1.0";

// ETA Invoice Structure per Egyptian Tax Authority specification
export interface ETAInvoice {
    issuer: {
        address: {
            branchID?: string;
            country: string;
            governate: string;
            regionCity: string;
            street: string;
            buildingNumber: string;
            postalCode?: string;
            floor?: string;
            room?: string;
            landmark?: string;
            additionalInformation?: string;
        };
        type: "B" | "P" | "F"; // Business, Person, Foreigner
        id: string;
        name: string;
    };
    receiver: {
        address: {
            country: string;
            governate: string;
            regionCity: string;
            street: string;
            buildingNumber: string;
            postalCode?: string;
        };
        type: "B" | "P" | "F";
        id: string;
        name: string;
    };
    documentType: ETADocumentType;
    documentTypeVersion: ETADocumentVersion;
    dateTimeIssued: string;
    taxpayerActivityCode: string;
    internalID: string;
    invoiceLines: ETAInvoiceLine[];
    totalDiscountAmount: number;
    totalSalesAmount: number;
    netAmount: number;
    taxTotals: ETATaxTotal[];
    totalAmount: number;
    extraDiscountAmount: number;
    totalItemsDiscountAmount: number;
}

export interface ETAInvoiceLine {
    description: string;
    itemType: "GPC" | "EGS" | "GS1";
    itemCode: string;
    unitType: string;
    quantity: number;
    internalCode?: string;
    salesTotal: number;
    total: number;
    valueDifference: number;
    totalTaxableFees: number;
    netTotal: number;
    itemsDiscount: number;
    unitValue: {
        currencySold: string;
        amountEGP: number;
        amountSold?: number;
        currencyExchangeRate?: number;
    };
    discount: {
        rate: number;
        amount: number;
    };
    taxableItems: ETATaxableItem[];
}

export interface ETATaxableItem {
    taxType: "T1" | "T2" | "T3" | "T4" | "T5"; // VAT types
    amount: number;
    subType: string;
    rate: number;
}

export interface ETATaxTotal {
    taxType: "T1" | "T2" | "T3" | "T4" | "T5";
    amount: number;
}

// Token management
let etaToken: { token: string; expiresAt: Date } | null = null;

async function getETAToken(): Promise<string> {
    // Check if we have a valid token
    if (etaToken && etaToken.expiresAt > new Date()) {
        return etaToken.token;
    }

    // Request new token
    const response = await fetch(ETA_CONFIG.tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: ETA_CONFIG.clientId,
            client_secret: ETA_CONFIG.clientSecret,
            scope: "InvoicingAPI",
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to get ETA token");
    }

    const data = await response.json();
    etaToken = {
        token: data.access_token,
        expiresAt: new Date(Date.now() + (data.expires_in - 60) * 1000),
    };

    return etaToken.token;
}

// Convert app invoice to ETA format
export function convertToETAFormat(invoice: any, company: any): ETAInvoice {
    const issueDate = new Date(invoice.issueDate);

    return {
        issuer: {
            address: {
                country: "EG",
                governate: company.governorate || "Cairo",
                regionCity: company.city || "Cairo",
                street: company.address || "",
                buildingNumber: company.buildingNumber || "1",
                postalCode: company.postalCode,
            },
            type: "B",
            id: company.taxId || "",
            name: company.name,
        },
        receiver: {
            address: {
                country: "EG",
                governate: invoice.client?.governorate || "Cairo",
                regionCity: invoice.client?.city || "Cairo",
                street: invoice.client?.address || "",
                buildingNumber: invoice.client?.buildingNumber || "1",
            },
            type: "B",
            id: invoice.client?.taxId || "",
            name: invoice.client?.name || "",
        },
        documentType: "I",
        documentTypeVersion: "1.0",
        dateTimeIssued: issueDate.toISOString(),
        taxpayerActivityCode: company.activityCode || "4610",
        internalID: invoice.invoiceNumber,
        invoiceLines: (invoice.items || []).map((item: any, index: number) => ({
            description: item.description,
            itemType: "EGS",
            itemCode: item.productCode || `EG-${company.taxId}-${index + 1}`,
            unitType: "EA",
            quantity: item.quantity,
            salesTotal: item.quantity * item.unitPrice,
            total: item.total,
            valueDifference: 0,
            totalTaxableFees: 0,
            netTotal: item.total,
            itemsDiscount: item.discount || 0,
            unitValue: {
                currencySold: "EGP",
                amountEGP: item.unitPrice,
            },
            discount: {
                rate: item.discountRate || 0,
                amount: item.discount || 0,
            },
            taxableItems: [
                {
                    taxType: "T1",
                    amount: item.taxAmount || item.total * 0.14,
                    subType: "V009",
                    rate: 14,
                },
            ],
        })),
        totalDiscountAmount: invoice.discount || 0,
        totalSalesAmount: invoice.subtotal,
        netAmount: invoice.subtotal - (invoice.discount || 0),
        taxTotals: [
            {
                taxType: "T1",
                amount: invoice.taxAmount || 0,
            },
        ],
        totalAmount: invoice.total,
        extraDiscountAmount: 0,
        totalItemsDiscountAmount: 0,
    };
}

// Calculate document signature (required by ETA)
export function calculateSignature(document: ETAInvoice): string {
    const serialized = JSON.stringify(document);
    const hash = crypto.createHash("sha256").update(serialized).digest("hex");
    return hash.toUpperCase();
}

// Submit invoice to ETA
export async function submitToETA(invoice: ETAInvoice): Promise<{
    success: boolean;
    uuid?: string;
    submissionId?: string;
    errors?: string[];
}> {
    try {
        const token = await getETAToken();

        // Add signature
        const signedInvoice = {
            documents: [
                {
                    ...invoice,
                    signatures: [
                        {
                            signatureType: "I",
                            value: calculateSignature(invoice),
                        },
                    ],
                },
            ],
        };

        const response = await fetch(`${ETA_CONFIG.baseUrl}/api/v1/documentsubmissions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(signedInvoice),
        });

        const data = await response.json();

        if (response.ok && data.acceptedDocuments?.length > 0) {
            return {
                success: true,
                uuid: data.acceptedDocuments[0].uuid,
                submissionId: data.submissionId,
            };
        } else {
            return {
                success: false,
                errors: data.rejectedDocuments?.[0]?.error?.details?.map((d: any) => d.message) || ["Submission failed"],
            };
        }
    } catch (error) {
        console.error("ETA submission error:", error);
        return {
            success: false,
            errors: [(error as Error).message],
        };
    }
}

// Get document status from ETA
export async function getETADocumentStatus(uuid: string): Promise<{
    status: "Valid" | "Invalid" | "Cancelled" | "Rejected" | "Submitted";
    longId?: string;
    publicUrl?: string;
}> {
    try {
        const token = await getETAToken();

        const response = await fetch(`${ETA_CONFIG.baseUrl}/api/v1/documents/${uuid}/raw`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        return {
            status: data.status || "Submitted",
            longId: data.longId,
            publicUrl: data.publicUrl,
        };
    } catch (error) {
        console.error("ETA status check error:", error);
        return { status: "Submitted" };
    }
}

// Cancel document on ETA
export async function cancelETADocument(uuid: string, reason: string): Promise<boolean> {
    try {
        const token = await getETAToken();

        const response = await fetch(`${ETA_CONFIG.baseUrl}/api/v1/documents/state/${uuid}/state`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: "cancelled",
                reason,
            }),
        });

        return response.ok;
    } catch (error) {
        console.error("ETA cancel error:", error);
        return false;
    }
}

// Validate Tax ID (Egyptian Tax Registration Number)
export function validateEgyptianTaxId(taxId: string): {
    valid: boolean;
    formatted: string;
    error?: string;
} {
    // Remove any non-digits
    const cleaned = taxId.replace(/\D/g, "");

    // Egyptian Tax ID should be 9 digits
    if (cleaned.length !== 9) {
        return {
            valid: false,
            formatted: taxId,
            error: "Tax ID must be 9 digits",
        };
    }

    // Format as XXX-XXX-XXX
    const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1-$2-$3");

    return {
        valid: true,
        formatted,
    };
}

// Get ETA activity codes
export const ETA_ACTIVITY_CODES = [
    { code: "4610", name: "Wholesale on a fee or contract basis" },
    { code: "4620", name: "Wholesale of agricultural raw materials and live animals" },
    { code: "4630", name: "Wholesale of food, beverages and tobacco" },
    { code: "4641", name: "Wholesale of textiles" },
    { code: "4649", name: "Wholesale of other household goods" },
    { code: "4651", name: "Wholesale of computers and software" },
    { code: "4652", name: "Wholesale of electronic and telecommunications equipment" },
    { code: "4659", name: "Wholesale of other machinery and equipment" },
    { code: "4661", name: "Wholesale of solid, liquid and gaseous fuels" },
    { code: "4662", name: "Wholesale of metals and metal ores" },
    { code: "4663", name: "Wholesale of construction materials" },
    { code: "4690", name: "Non-specialized wholesale trade" },
];
