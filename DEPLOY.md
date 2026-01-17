# BrownLedger Deployment Guide

## 🐳 Docker Deployment (Recommended)

The easiest way to deploy BrownLedger is with Docker.

### Quick Start (One Command!)

```bash
# Clone and start
git clone https://github.com/your-repo/brownledger.git
cd brownledger
docker-compose up -d
```

That's it! Open <http://localhost:3000>

### First-Time Setup

```bash
# 1. Start the database
docker-compose up -d db

# 2. Run migrations
docker-compose --profile migrate up migrate

# 3. Seed demo data (optional)
docker-compose --profile seed up seed

# 4. Start the app
docker-compose up -d app
```

### With Custom Environment Variables

Create a `.env` file:

```bash
# Required for production
NEXTAUTH_SECRET=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then run:

```bash
docker-compose up -d
```

### Useful Commands

```bash
# View logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Stop all containers
docker-compose down

# Stop and remove volumes (⚠️ deletes database!)
docker-compose down -v

# Rebuild after code changes
docker-compose build --no-cache app
docker-compose up -d
```

---

## 🚢 Deploy to Cloud with Docker

### Deploy to Railway

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Railway auto-detects Dockerfile
3. Add environment variables
4. Deploy!

### Deploy to Render

1. Create new Web Service on [Render](https://render.com)
2. Select "Docker" as environment
3. Connect your repo
4. Add environment variables
5. Deploy!

### Deploy to DigitalOcean App Platform

1. Create new App on [DigitalOcean](https://www.digitalocean.com/products/app-platform)
2. Connect your repo
3. Select "Dockerfile" as build type
4. Add environment variables
5. Deploy!

### Deploy to AWS ECS / Google Cloud Run

```bash
# Build and push to container registry
docker build -t brownledger:latest .
docker tag brownledger:latest your-registry/brownledger:latest
docker push your-registry/brownledger:latest
```

---

## ☁️ Deploy to Vercel (Alternative)

### 1. Prerequisites

- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (Supabase, Neon, or PlanetScale)

### 2. Database Setup

#### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings → Database → Connection string
3. Copy the connection string (use "Transaction" mode)

#### Option B: Neon

1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string from the dashboard

### 3. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables (see `.env.example`)
4. Click Deploy

### 4. Post-Deploy Setup

```bash
# Run database migrations
npx prisma migrate deploy
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random string for auth |
| `NEXTAUTH_URL` | ✅ | Your app URL |
| `SMTP_HOST` | ⚠️ | Email server |
| `SMTP_USER` | ⚠️ | Email username |
| `SMTP_PASS` | ⚠️ | Email password |
| `OPENAI_API_KEY` | ⚠️ | For AI features |
| `STRIPE_SECRET_KEY` | ⚠️ | For payments |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | For Stripe webhooks |

⚠️ = Required for full functionality

---

## 🇪🇬 Egypt Tax Authority (ETA) Setup

### Prerequisites

- Egyptian Tax Registration Number
- ETA SDK Account ([sdk.invoicing.eta.gov.eg](https://sdk.invoicing.eta.gov.eg))

### Configuration

```bash
ETA_API_URL=https://api.invoicing.eta.gov.eg
ETA_TOKEN_URL=https://id.eta.gov.eg/connect/token
ETA_CLIENT_ID=<from ETA portal>
ETA_CLIENT_SECRET=<from ETA portal>
ETA_REGISTRATION_NUMBER=<your tax registration>
```

---

## ✅ Production Checklist

### Security

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up rate limiting

### Performance

- [ ] Enable database connection pooling
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (Sentry, LogRocket)

### Backup

- [ ] Configure automated database backups
- [ ] Test backup restoration

---

## 🆘 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check if database is ready
docker-compose logs db
```

### Database connection issues

```bash
# Test connection inside container
docker-compose exec app npx prisma db pull
```

### Port already in use

```bash
# Change port in docker-compose.yml
ports:
  - "8080:3000"  # Use port 8080 instead
```

---

## 📞 Support

- Documentation: `/docs`
- Email: <support@brownledger.com>
