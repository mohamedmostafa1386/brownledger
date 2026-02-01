# BrownLedger Product Requirements Document

## Product Overview

BrownLedger is a comprehensive accounting and business management application designed specifically for the Egyptian market. It supports English and Arabic (RTL) locales and includes features for invoicing, inventory, point of sale (POS), and financial reporting.

## Key Features

### 1. Localization & Internationalization

- **Multi-language Support:** Full support for English and Arabic.
- **RTL Layout:** Automatic right-to-left layout adjustment for Arabic users.
- **Localized Content:** All dashboards, reports, buttons, and help topics are translated.

### 2. Dashboard & Reporting

- **Snapshots:** Real-time overview of revenue, expenses, net profit, and cash balance.
- **Financial Reports:**
  - Income Statement
  - Balance Sheet
  - Trial Balance
  - Stock Valuation
  - Stock Movements
- **Visualizations:** Charts for revenue trends, client concentration, and expense breakdowns.

### 3. Invoicing & Billing

- **Sales Invoices:** Create, send, and track PDF invoices.
- **Purchases (Bills):** Record supplier bills and track accounts payable.
- **Payments:** Record partial or full payments, manage overdue invoices.

### 4. Inventory & Stock Management

- **Product Catalog:** Manage items with SKU, barcodes, and pricing.
- **Warehousing:** Track stock levels across locations.
- **Movements:** Record stock in/out and transfers.
- **Alerts:** Low stock and out-of-stock notifications.

### 5. Point of Sale (POS)

- **Retail Interface:** Fast checkout interface for cashiers.
- **Barcode Scanning:** Support for scanning products.
- **Cart Management:** Add/remove items, apply discounts, handle tax.
- **Shift Management:** Track cashier shifts and cash drawer reconciliation.

### 6. Accounting Core

- **double-entry:** Full double-entry ledger system.
- **Chart of Accounts:** customizable COA.
- **Journal Entries:** Manual entry capability for adjustments.

## User Roles

- **Admin:** Full access to all settings and financial data.
- **Cashier:** Restricted access to POS and Shift functionality.
- **Accountant:** Access to reports and journals, restricted from admin settings.

## Technical Architecture

- **Frontend:** Next.js (React) with Tailwind CSS.
- **State Management:** React Query & Zustand.
- **Database:** Prisma ORM.
- **Validation:** Zod schemas.
- **Testing:** Playwright E2E tests.
