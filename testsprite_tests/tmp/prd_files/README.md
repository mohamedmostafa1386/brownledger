# BrownLedger v2 - AI-Powered Accounting

A production-grade accounting web application with advanced AI features for invoice management, expense tracking, client CRM, and financial insights.

## Features

### Core Features

- 📊 **Dashboard** - Real-time KPIs, revenue charts, recent invoices
- 🧾 **Invoice Management** - Create, track, and export invoices
- 💰 **Expense Tracking** - Categorize and manage business expenses
- 👥 **Client CRM** - Track clients and revenue per customer
- 🏦 **Banking** - Account balances and transaction tracking
- 📈 **Reports** - Interactive charts and financial analytics
- ⚙️ **Settings** - Company, profile, and appearance settings

### AI-Powered Features

- 🤖 **AI Financial Chat** - Ask questions in natural language ("What's my profit this month?")
- 💡 **AI Insights Panel** - Automated warnings, opportunities, and recommendations
- 📊 **Cash Flow Forecast** - Predict next 3 months revenue and expenses
- ✨ **AI Invoice Generator** - Describe invoices in plain English, auto-create
- 📸 **Receipt OCR** - Scan receipts with GPT-4 Vision, auto-extract data
- 🏷️ **Smart Categorization** - Auto-categorize expenses using AI

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Database | SQLite + Prisma ORM v6 |
| Auth | NextAuth.js v5 Beta + bcryptjs |
| State | TanStack React Query v5 |
| UI | Tailwind CSS + Custom Brown Theme |
| Charts | Recharts |
| Animations | Framer Motion |
| Excel | xlsx (SheetJS) |
| AI | OpenAI GPT-4 / GPT-4 Vision |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Push database schema
npx prisma db push

# Seed demo data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

- **Email:** `admin@brownledger.com`
- **Password:** `admin123`

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-super-secret-key"
OPENAI_API_KEY="sk-your-openai-api-key"
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── invoices/      # Invoice management
│   │   ├── expenses/      # Expense tracking
│   │   ├── clients/       # Client CRM
│   │   ├── banking/       # Bank accounts
│   │   ├── reports/       # Financial reports
│   │   └── settings/      # App settings
│   ├── api/
│   │   ├── ai/            # AI endpoints (chat, insights)
│   │   ├── invoices/      # Invoice CRUD + AI generate
│   │   ├── expenses/      # Expense CRUD + OCR
│   │   ├── clients/       # Client CRUD
│   │   └── reports/       # Forecast API
│   └── login/             # Auth pages
├── components/
│   ├── dashboard/         # Dashboard components + AI widgets
│   ├── invoices/          # Invoice components
│   ├── expenses/          # Expense components + OCR
│   ├── clients/           # Client components
│   └── layout/            # Sidebar, Header
├── lib/
│   ├── ai/                # AI utilities
│   │   ├── categorize-expense.ts
│   │   ├── ocr-receipt.ts
│   │   ├── generate-invoice.ts
│   │   ├── forecast-cashflow.ts
│   │   └── generate-insights.ts
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
└── prisma/
    ├── schema.prisma      # Database schema
    └── seed.ts            # Demo data
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Dashboard KPIs |
| `/api/invoices` | GET, POST | List/Create invoices |
| `/api/invoices/export` | GET | Export to Excel |
| `/api/invoices/ai-generate` | POST | AI invoice creation |
| `/api/expenses` | GET, POST | List/Create expenses |
| `/api/expenses/ocr` | POST | Receipt OCR processing |
| `/api/clients` | GET, POST | List/Create clients |
| `/api/ai/chat` | POST | AI chat (streaming) |
| `/api/ai/insights` | GET | Financial insights |
| `/api/reports/ai-forecast` | GET | Cash flow predictions |
| `/api/bi/invoices` | GET | Power BI integration |

## AI Features Usage

### AI Chat

Click the floating sparkle button (bottom-right) to open the AI assistant. Ask questions like:

- "What's my total revenue?"
- "Show top 5 clients"
- "How many overdue invoices?"

### AI Invoice Generator

On the New Invoice page, describe your invoice in plain English:

- "Invoice Acme Corp for 5 hours consulting at $150/hr, due in 30 days"

### Receipt OCR

On the Expenses page, click "Scan Receipt" to upload a receipt image. AI will extract vendor, date, amount, and line items automatically.

## License

MIT
