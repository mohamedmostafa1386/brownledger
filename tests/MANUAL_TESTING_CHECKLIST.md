# BrownLedger Manual Testing Checklist

## How to Use

- [ ] = Not tested
- [x] = Passed
- [!] = Failed (add notes)

---

## 1. Authentication Module

- [ ] Login with valid credentials (<demo@brownledger.com> / demo123)
- [ ] Login with invalid credentials shows error
- [ ] Logout successfully redirects to login
- [ ] Session persists on page refresh
- [ ] Protected routes redirect to login when not authenticated

---

## 2. Dashboard

- [ ] All KPI cards display numbers (not errors)
- [ ] Revenue chart renders
- [ ] Expenses chart renders
- [ ] Recent invoices list shows data
- [ ] Top clients list shows data
- [ ] AI insights panel displays (if configured)
- [ ] Quick action buttons work

---

## 3. Invoices Module

### List View

- [ ] All invoices display in table
- [ ] Invoice number, client, amount visible
- [ ] Status badges show correctly
- [ ] Search by invoice number works
- [ ] Filter by status works (Draft, Sent, Paid, Overdue)
- [ ] Sort by columns works
- [ ] Pagination works (if many invoices)

### Create Invoice

- [ ] "New Invoice" button opens form/modal
- [ ] Customer dropdown populated with customers
- [ ] Date pickers work (Issue Date, Due Date)
- [ ] Add item button adds new line
- [ ] Delete item button removes line
- [ ] Quantity × Price calculates correctly
- [ ] Tax calculation is correct
- [ ] Discount applies correctly
- [ ] Total calculation is correct
- [ ] Save button creates invoice
- [ ] Validation shows for required fields
- [ ] Success message appears after save
- [ ] Invoice posts to GL automatically

### Edit Invoice

- [ ] Edit button opens populated form
- [ ] Existing data pre-filled correctly
- [ ] Changes save successfully
- [ ] Cannot edit if invoice is PAID

### Actions

- [ ] View/Preview invoice works
- [ ] Export PDF generates correctly
- [ ] Send email works (if configured)
- [ ] Mark as Sent changes status
- [ ] Delete shows confirmation
- [ ] Delete removes invoice (if allowed)
- [ ] Print invoice works

---

## 4. Receivables Module

### Payments Tab

- [ ] Total Receivables KPI shows
- [ ] Unapplied Payments KPI shows
- [ ] Pending Checks KPI shows
- [ ] Register Cash button opens modal
- [ ] Register Check button opens modal
- [ ] Register Bank Transfer opens modal
- [ ] Payment form validation works
- [ ] Payment saves successfully
- [ ] GL posting happens automatically

### Apply Payments Tab

- [ ] Unapplied payments list displays
- [ ] Auto Match button works
- [ ] Manual application interface works
- [ ] Select payment shows related invoices
- [ ] Checkbox selection for invoices works
- [ ] Amount allocation input works
- [ ] Apply button posts correctly
- [ ] Unapplied amount updates after application

### Deductions Tab

- [ ] Deductions list displays
- [ ] New Deduction button opens form
- [ ] Deduction types dropdown works
- [ ] Save creates deduction
- [ ] Approve button changes status
- [ ] Reject button works

### Checks Tab

- [ ] Pending checks list shows
- [ ] Mark as Deposited works
- [ ] Mark as Cleared works
- [ ] Mark as Bounced works

---

## 5. POS Module

### Product Selection

- [ ] Products grid displays
- [ ] Search products works
- [ ] Category filter works
- [ ] Barcode scanner input works
- [ ] Product card shows price and stock
- [ ] Low stock indicator visible

### Cart

- [ ] Add to cart works (click product)
- [ ] Cart shows added items
- [ ] Quantity adjustment works (+/-)
- [ ] Remove from cart works
- [ ] Clear cart empties all items
- [ ] Cart total calculates correctly

### Checkout

- [ ] Checkout button opens payment
- [ ] Cash payment works
- [ ] Card payment works
- [ ] Change calculation correct
- [ ] Complete sale button works
- [ ] Receipt prints/displays
- [ ] Sale posts to GL automatically
- [ ] Stock decrements correctly

---

## 6. Stock Management

### Products

- [ ] Products list displays
- [ ] Add product works
- [ ] Edit product works
- [ ] Delete product (with confirmation)
- [ ] Image upload works

### Warehouses

- [ ] Warehouses list shows
- [ ] Stock levels per warehouse

### Movements

- [ ] Stock movement list
- [ ] Transfer between warehouses works
- [ ] Adjustment entry works

---

## 7. Chart of Accounts

- [ ] Account tree displays
- [ ] Expand/collapse works
- [ ] Seed defaults button works
- [ ] Add account button works
- [ ] Account categories show (Asset, Liability, Equity, Revenue, Expense)
- [ ] Balance totals display
- [ ] Account names show in current language

---

## 8. Journal Entries

- [ ] List all entries
- [ ] Filter by date works
- [ ] Filter by source works (Manual, Invoice, Payment, POS)
- [ ] Entry expands to show lines
- [ ] Debit column shows
- [ ] Credit column shows
- [ ] Totals balance (Debit = Credit)
- [ ] Create manual entry works
- [ ] Reverse entry works
- [ ] Status shows (Draft, Posted, Reversed)

---

## 9. Financial Statements

### Income Statement

- [ ] Tab navigation works
- [ ] Revenue section displays
- [ ] COGS section displays
- [ ] Gross Profit calculates
- [ ] Operating Expenses section
- [ ] Net Income displays
- [ ] Date range filter works
- [ ] Export PDF works

### Balance Sheet

- [ ] Assets section shows
- [ ] Current Assets subtotal
- [ ] Fixed Assets subtotal
- [ ] Total Assets
- [ ] Liabilities section
- [ ] Equity section
- [ ] Balance equation validates (Assets = Liabilities + Equity)

### Trial Balance

- [ ] All accounts list
- [ ] Debit totals correct
- [ ] Credit totals correct
- [ ] Totals balance

---

## 10. Financial Ratios

- [ ] Overall health score displays
- [ ] Liquidity ratios section
- [ ] Profitability ratios section
- [ ] Efficiency ratios section
- [ ] Leverage ratios section
- [ ] Status colors show (green/yellow/red)
- [ ] AI analysis button works (if configured)
- [ ] Recommendations display

---

## 11. Multi-Language Support

### Language Switching

- [ ] Language switcher visible in header
- [ ] Click opens dropdown with EN and AR
- [ ] Switch to Arabic works
- [ ] Switch back to English works

### Arabic Mode

- [ ] URL changes to /ar/...
- [ ] HTML has dir="rtl"
- [ ] Layout flips to RTL
- [ ] All text is in Arabic
- [ ] Numbers format correctly
- [ ] Dates format correctly
- [ ] Navigation is translated
- [ ] Forms work in RTL
- [ ] Modals display correctly in RTL

---

## 12. Responsive Design

### Desktop (1920×1080)

- [ ] Full layout displays
- [ ] Sidebar visible
- [ ] All content readable

### Laptop (1366×768)

- [ ] Layout adapts
- [ ] Content not cut off

### Tablet (768×1024)

- [ ] Layout adapts
- [ ] Sidebar may collapse
- [ ] Touch targets adequate

### Mobile (375×667)

- [ ] Mobile layout
- [ ] Navigation accessible
- [ ] Tables scroll horizontally
- [ ] Forms usable

---

## 13. Settings

- [ ] Settings page loads
- [ ] Language preference saves
- [ ] Company profile displays

---

## Notes

_Add any issues found during testing here:_

```text
Issue #1:
Page:
Description:
Steps to reproduce:
Expected:
Actual:
```
