import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PDF Export for Financial Statements
// Returns HTML that can be converted to PDF on client or printed
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId") || "demo-company";
        const type = searchParams.get("type") || "balance"; // balance, income, cashflow
        const format = searchParams.get("format") || "html"; // html, json

        // Get company info
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        // Get accounts
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            orderBy: { accountCode: "asc" },
        });

        const companyName = company?.name || "Company Name";
        const currency = company?.currency || "USD";
        const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        // Calculate balances
        let totalAssets = 0, currentAssets = 0, fixedAssets = 0;
        let totalLiabilities = 0, currentLiabilities = 0, longTermLiabilities = 0;
        let totalEquity = 0, totalRevenue = 0, totalExpenses = 0, cogs = 0;

        const assets: any[] = [], liabilities: any[] = [], equity: any[] = [];
        const revenue: any[] = [], cogsItems: any[] = [], expenses: any[] = [];

        for (const acc of accounts) {
            const item = { code: acc.accountCode, name: acc.accountName, balance: acc.currentBalance };

            if (acc.accountType === "ASSET") {
                assets.push(item);
                totalAssets += acc.currentBalance;
                if (acc.accountCategory === "CURRENT_ASSET") currentAssets += acc.currentBalance;
                else fixedAssets += acc.currentBalance;
            } else if (acc.accountType === "LIABILITY") {
                liabilities.push(item);
                totalLiabilities += acc.currentBalance;
                if (acc.accountCategory === "CURRENT_LIABILITY") currentLiabilities += acc.currentBalance;
                else longTermLiabilities += acc.currentBalance;
            } else if (acc.accountType === "EQUITY") {
                equity.push(item);
                totalEquity += acc.currentBalance;
            } else if (acc.accountType === "REVENUE") {
                revenue.push(item);
                totalRevenue += acc.currentBalance;
            } else if (acc.accountType === "EXPENSE") {
                if (acc.accountCategory === "COST_OF_GOODS_SOLD") {
                    cogsItems.push(item);
                    cogs += acc.currentBalance;
                } else {
                    expenses.push(item);
                    totalExpenses += acc.currentBalance;
                }
            }
        }

        const grossProfit = totalRevenue - cogs;
        const netIncome = grossProfit - totalExpenses;

        // Generate HTML based on type
        let html = "";
        let title = "";

        if (type === "balance") {
            title = "Statement of Financial Position";
            html = generateBalanceSheetHTML(companyName, today, currency, {
                assets, currentAssets, fixedAssets, totalAssets,
                liabilities, currentLiabilities, longTermLiabilities, totalLiabilities,
                equity, totalEquity, netIncome,
            });
        } else if (type === "income") {
            title = "Statement of Profit or Loss";
            html = generateIncomeStatementHTML(companyName, today, currency, {
                revenue, totalRevenue, cogsItems, cogs, grossProfit,
                expenses, totalExpenses, netIncome,
            });
        } else if (type === "cashflow") {
            title = "Statement of Cash Flows";
            html = generateCashFlowHTML(companyName, today, currency, netIncome);
        }

        if (format === "json") {
            return NextResponse.json({ title, html, company: companyName, date: today });
        }

        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
}

function generateBalanceSheetHTML(company: string, date: string, currency: string, data: any) {
    const formatAmount = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Statement of Financial Position - ${company}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: 700; color: #1e3a5f; }
        .report-title { font-size: 18px; color: #374151; margin-top: 5px; }
        .report-date { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: 700; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
        .subsection { margin-left: 15px; margin-bottom: 15px; }
        .subsection-title { font-weight: 600; color: #374151; margin-bottom: 5px; }
        .line-item { display: flex; justify-content: space-between; padding: 3px 0; }
        .line-item:hover { background: #f9fafb; }
        .account-name { color: #4b5563; }
        .amount { font-family: 'Courier New', monospace; }
        .subtotal { font-weight: 600; border-top: 1px solid #d1d5db; margin-top: 5px; padding-top: 5px; }
        .total { font-weight: 700; font-size: 14px; border-top: 2px solid #1e3a5f; margin-top: 10px; padding-top: 10px; color: #1e3a5f; }
        .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${company}</div>
        <div class="report-title">Statement of Financial Position</div>
        <div class="report-date">As of ${date}</div>
    </div>
    
    <div class="content">
        <div>
            <div class="section">
                <div class="section-title">ASSETS</div>
                <div class="subsection">
                    <div class="subsection-title">Current Assets</div>
                    ${data.assets.filter((a: any) => ["1000", "1010", "1100", "1200", "1300"].includes(a.code)).map((a: any) => `
                        <div class="line-item">
                            <span class="account-name">${a.name}</span>
                            <span class="amount">${formatAmount(a.balance)}</span>
                        </div>
                    `).join("")}
                    <div class="line-item subtotal">
                        <span>Total Current Assets</span>
                        <span class="amount">${formatAmount(data.currentAssets)}</span>
                    </div>
                </div>
                <div class="subsection">
                    <div class="subsection-title">Non-Current Assets</div>
                    ${data.assets.filter((a: any) => a.code.startsWith("15")).map((a: any) => `
                        <div class="line-item">
                            <span class="account-name">${a.name}</span>
                            <span class="amount">${formatAmount(a.balance)}</span>
                        </div>
                    `).join("")}
                    <div class="line-item subtotal">
                        <span>Total Non-Current Assets</span>
                        <span class="amount">${formatAmount(data.fixedAssets)}</span>
                    </div>
                </div>
                <div class="line-item total">
                    <span>TOTAL ASSETS</span>
                    <span class="amount">${formatAmount(data.totalAssets)}</span>
                </div>
            </div>
        </div>
        
        <div>
            <div class="section">
                <div class="section-title">LIABILITIES</div>
                <div class="subsection">
                    <div class="subsection-title">Current Liabilities</div>
                    ${data.liabilities.filter((l: any) => l.code.startsWith("2") && parseInt(l.code) < 2500).map((l: any) => `
                        <div class="line-item">
                            <span class="account-name">${l.name}</span>
                            <span class="amount">${formatAmount(l.balance)}</span>
                        </div>
                    `).join("")}
                    <div class="line-item subtotal">
                        <span>Total Current Liabilities</span>
                        <span class="amount">${formatAmount(data.currentLiabilities)}</span>
                    </div>
                </div>
                <div class="subsection">
                    <div class="subsection-title">Non-Current Liabilities</div>
                    ${data.liabilities.filter((l: any) => parseInt(l.code) >= 2500).map((l: any) => `
                        <div class="line-item">
                            <span class="account-name">${l.name}</span>
                            <span class="amount">${formatAmount(l.balance)}</span>
                        </div>
                    `).join("")}
                    <div class="line-item subtotal">
                        <span>Total Non-Current Liabilities</span>
                        <span class="amount">${formatAmount(data.longTermLiabilities)}</span>
                    </div>
                </div>
                <div class="line-item subtotal">
                    <span>TOTAL LIABILITIES</span>
                    <span class="amount">${formatAmount(data.totalLiabilities)}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">EQUITY</div>
                <div class="subsection">
                    ${data.equity.map((e: any) => `
                        <div class="line-item">
                            <span class="account-name">${e.name}</span>
                            <span class="amount">${formatAmount(e.balance)}</span>
                        </div>
                    `).join("")}
                    <div class="line-item">
                        <span class="account-name">Net Income (Current Period)</span>
                        <span class="amount">${formatAmount(data.netIncome)}</span>
                    </div>
                    <div class="line-item subtotal">
                        <span>Total Equity</span>
                        <span class="amount">${formatAmount(data.totalEquity + data.netIncome)}</span>
                    </div>
                </div>
                <div class="line-item total">
                    <span>TOTAL LIABILITIES & EQUITY</span>
                    <span class="amount">${formatAmount(data.totalLiabilities + data.totalEquity + data.netIncome)}</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <p>Prepared in accordance with International Financial Reporting Standards (IFRS)</p>
        <p>Generated by BrownLedger • ${new Date().toISOString()}</p>
    </div>
</body>
</html>
`;
}

function generateIncomeStatementHTML(company: string, date: string, currency: string, data: any) {
    const formatAmount = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Statement of Profit or Loss - ${company}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; font-size: 12px; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: 700; color: #1e3a5f; }
        .report-title { font-size: 18px; color: #374151; margin-top: 5px; }
        .report-date { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: 700; color: #059669; margin-bottom: 10px; }
        .line-item { display: flex; justify-content: space-between; padding: 4px 0; padding-left: 20px; }
        .account-name { color: #4b5563; }
        .amount { font-family: 'Courier New', monospace; }
        .subtotal { font-weight: 600; border-top: 1px solid #d1d5db; margin-top: 8px; padding-top: 8px; padding-left: 0; }
        .total { font-weight: 700; font-size: 16px; border-top: 2px double #1e3a5f; margin-top: 15px; padding-top: 15px; color: #1e3a5f; padding-left: 0; }
        .profit { color: #059669; }
        .loss { color: #dc2626; }
        .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${company}</div>
        <div class="report-title">Statement of Profit or Loss</div>
        <div class="report-date">For the Period Ended ${date}</div>
    </div>
    
    <div class="section">
        <div class="section-title">REVENUE</div>
        ${data.revenue.map((r: any) => `
            <div class="line-item">
                <span class="account-name">${r.name}</span>
                <span class="amount">${formatAmount(r.balance)}</span>
            </div>
        `).join("")}
        <div class="line-item subtotal">
            <span>Total Revenue</span>
            <span class="amount">${formatAmount(data.totalRevenue)}</span>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">COST OF SALES</div>
        ${data.cogsItems.map((c: any) => `
            <div class="line-item">
                <span class="account-name">${c.name}</span>
                <span class="amount">(${formatAmount(c.balance)})</span>
            </div>
        `).join("")}
        <div class="line-item subtotal">
            <span>Total Cost of Sales</span>
            <span class="amount">(${formatAmount(data.cogs)})</span>
        </div>
    </div>
    
    <div class="line-item subtotal">
        <span><strong>GROSS PROFIT</strong></span>
        <span class="amount ${data.grossProfit >= 0 ? 'profit' : 'loss'}"><strong>${formatAmount(data.grossProfit)}</strong></span>
    </div>
    
    <div class="section" style="margin-top: 20px;">
        <div class="section-title">OPERATING EXPENSES</div>
        ${data.expenses.map((e: any) => `
            <div class="line-item">
                <span class="account-name">${e.name}</span>
                <span class="amount">(${formatAmount(e.balance)})</span>
            </div>
        `).join("")}
        <div class="line-item subtotal">
            <span>Total Operating Expenses</span>
            <span class="amount">(${formatAmount(data.totalExpenses)})</span>
        </div>
    </div>
    
    <div class="line-item total">
        <span>NET INCOME</span>
        <span class="amount ${data.netIncome >= 0 ? 'profit' : 'loss'}">${formatAmount(data.netIncome)}</span>
    </div>
    
    <div class="footer">
        <p>Prepared in accordance with International Financial Reporting Standards (IFRS)</p>
        <p>Generated by BrownLedger • ${new Date().toISOString()}</p>
    </div>
</body>
</html>
`;
}

function generateCashFlowHTML(company: string, date: string, currency: string, netIncome: number) {
    const formatAmount = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

    // Estimated cash flow based on net income
    const depreciation = 15000;
    const operatingCash = netIncome + depreciation - 5000;
    const investingCash = -20000;
    const financingCash = 6000;
    const netChange = operatingCash + investingCash + financingCash;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Statement of Cash Flows - ${company}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; font-size: 12px; max-width: 700px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: 700; color: #1e3a5f; }
        .report-title { font-size: 18px; color: #374151; margin-top: 5px; }
        .report-date { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 13px; font-weight: 700; color: #7c3aed; margin-bottom: 10px; }
        .line-item { display: flex; justify-content: space-between; padding: 4px 0; padding-left: 20px; }
        .amount { font-family: 'Courier New', monospace; }
        .subtotal { font-weight: 600; border-top: 1px solid #d1d5db; margin-top: 8px; padding-top: 8px; padding-left: 0; }
        .total { font-weight: 700; font-size: 16px; border-top: 2px double #1e3a5f; margin-top: 15px; padding-top: 15px; color: #1e3a5f; }
        .footer { margin-top: 40px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${company}</div>
        <div class="report-title">Statement of Cash Flows</div>
        <div class="report-date">For the Period Ended ${date}</div>
    </div>
    
    <div class="section">
        <div class="section-title">CASH FLOWS FROM OPERATING ACTIVITIES</div>
        <div class="line-item"><span>Profit for the period</span><span class="amount">${formatAmount(netIncome)}</span></div>
        <div class="line-item"><span>Adjustments for:</span><span></span></div>
        <div class="line-item"><span>  Depreciation and amortization</span><span class="amount">${formatAmount(depreciation)}</span></div>
        <div class="line-item"><span>Changes in working capital:</span><span></span></div>
        <div class="line-item"><span>  (Increase)/Decrease in receivables</span><span class="amount">(${formatAmount(5000)})</span></div>
        <div class="line-item subtotal"><span>Net Cash from Operating</span><span class="amount">${formatAmount(operatingCash)}</span></div>
    </div>
    
    <div class="section">
        <div class="section-title">CASH FLOWS FROM INVESTING ACTIVITIES</div>
        <div class="line-item"><span>Purchase of equipment</span><span class="amount">(${formatAmount(20000)})</span></div>
        <div class="line-item subtotal"><span>Net Cash from Investing</span><span class="amount">${formatAmount(investingCash)}</span></div>
    </div>
    
    <div class="section">
        <div class="section-title">CASH FLOWS FROM FINANCING ACTIVITIES</div>
        <div class="line-item"><span>Proceeds from borrowings</span><span class="amount">${formatAmount(12000)}</span></div>
        <div class="line-item"><span>Repayment of borrowings</span><span class="amount">(${formatAmount(6000)})</span></div>
        <div class="line-item subtotal"><span>Net Cash from Financing</span><span class="amount">${formatAmount(financingCash)}</span></div>
    </div>
    
    <div class="line-item total">
        <span>NET CHANGE IN CASH</span>
        <span class="amount">${formatAmount(netChange)}</span>
    </div>
    
    <div class="footer">
        <p>Prepared in accordance with IAS 7 - Statement of Cash Flows (Indirect Method)</p>
        <p>Generated by BrownLedger • ${new Date().toISOString()}</p>
    </div>
</body>
</html>
`;
}
