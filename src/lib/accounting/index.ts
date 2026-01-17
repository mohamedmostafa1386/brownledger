// BrownLedger IFRS Accounting Module
// Comprehensive IFRS-compliant accounting services

// IAS 2: Inventory Valuation
export * from "./inventory-valuation";
export { default as InventoryValuation } from "./inventory-valuation";

// IFRS 15: Revenue Recognition  
export * from "./revenue-recognition";
export { default as RevenueRecognition } from "./revenue-recognition";

// IAS 16: Property, Plant & Equipment
export * from "./fixed-assets";
export { default as FixedAssets } from "./fixed-assets";

// Journal Entry Automation
export * from "./journal-automation";
export { default as JournalAutomation } from "./journal-automation";

// IFRS Standards Reference
export const IFRS_STANDARDS = {
    IAS_1: {
        name: "Presentation of Financial Statements",
        description: "General requirements for presentation of financial statements",
        implemented: ["Balance Sheet", "Income Statement", "Cash Flow Statement"],
    },
    IAS_2: {
        name: "Inventories",
        description: "Accounting treatment for inventories",
        implemented: ["FIFO Valuation", "Weighted Average", "NRV Write-down"],
    },
    IAS_7: {
        name: "Statement of Cash Flows",
        description: "Classification of cash flows from operating, investing, and financing",
        implemented: ["Indirect Method", "Cash Reconciliation"],
    },
    IAS_16: {
        name: "Property, Plant and Equipment",
        description: "Recognition, measurement, and depreciation of fixed assets",
        implemented: ["Straight-line", "Declining Balance", "Units of Production"],
    },
    IAS_36: {
        name: "Impairment of Assets",
        description: "Testing assets for impairment",
        implemented: ["Impairment Testing"],
    },
    IFRS_15: {
        name: "Revenue from Contracts with Customers",
        description: "Five-step model for revenue recognition",
        implemented: ["Contract Identification", "Performance Obligations", "Transaction Price", "Allocation", "Recognition"],
    },
};

// Validation utilities
export function validateDoubleEntry(debits: number, credits: number): boolean {
    return Math.abs(debits - credits) < 0.01;
}

export function formatIFRSAmount(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
