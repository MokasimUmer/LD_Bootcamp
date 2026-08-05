# ⚡ Africa Free Routing (AFR) - Lightning Developer Bootcamp Monorepo

Welcome to the **Africa Free Routing (AFR)** Lightning Developer Bootcamp platform repository. This project is structured as a modern **npm Workspaces Monorepo** containing both the Next.js 14 Web Frontend and the NestJS 10 API Backend.

---

## 📁 Repository Structure

```text
LD_Bootcamp/
├── apps/
│   ├── web/                 # Next.js 14 Web Frontend (Port 3000)
│   │   ├── src/
│   │   │   ├── app/         # App Router pages (/organizer, /developer, /auth)
│   │   │   └── components/  # AFR Terracotta & Gold UI Component System
│   │   ├── public/          # Static assets & media
│   │   ├── next.config.mjs  # Next.js Monorepo configuration
│   │   ├── tailwind.config.ts # Custom AFR color theme & styling
│   │   ├── tsconfig.json
│   │   └── package.json     # Workspace Name: "afr-web"
│   │
│   └── backend/             # NestJS 10 API & WebSocket Server (Port 4000)
│       ├── src/
│       │   ├── auth/        # JWT Authentication & Role Guards (ORGANIZER/DEVELOPER)
│       │   ├── bootcamps/   # Bootcamp management & City resolution (African Cities)
│       │   ├── quiz/        # Timed Quiz system, Leaderboards & Redis Sorted Sets
│       │   ├── payouts/     # LND REST payment dispatcher & LNURL-pay resolver
│       │   └── attendance/  # QR Code scanning & attendance tracker
│       ├── prisma/          # Prisma ORM Schema & PostgreSQL Migrations
│       ├── seed.js          # Bootcamp & African location database seeder
│       ├── tsconfig.json
│       └── package.json     # Workspace Name: "afr-lightning-backend"
│
├── package.json             # Monorepo Workspace Configuration (npm workspaces)
├── README.md                # Platform Documentation & Guide
└── .gitignore               # Monorepo gitignore rules
```

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Monorepo Engine** | **npm Workspaces** | Native npm monorepo management with workspace orchestration |
| **Frontend** | **Next.js 14 (App Router)** | React 18, Tailwind CSS, Framer Motion, Lucide Icons, QRCode.react |
| **Backend** | **NestJS 10** | TypeScript framework, REST Controllers, Socket.io WebSockets |
| **Database** | **PostgreSQL (Aiven Cloud)** | Managed relational database via Prisma ORM v5 |
| **Caching & Ranks** | **Redis** | Sorted Sets (`ZADD`/`ZREVRANGE`) for real-time quiz leaderboards |
| **Lightning Network** | **Polar / LND Node REST API** | BOLT-11 invoice settlement, LNURL resolution, Preimage proofs |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Install Dependencies
Run from the root directory to install packages across all workspaces:
```bash
npm install
```

### 3. Generate Prisma ORM Client
```bash
npm run db:generate
```

### 4. Run Development Servers
Boot up both **Frontend** (`http://localhost:3000`) and **Backend** (`http://localhost:4000`) concurrently with a single command:
```bash
npm run dev
```

---

## 📜 Monorepo Command Reference

| Command | Action | Workspace Target |
| :--- | :--- | :--- |
| `npm run dev` | Runs both Web Frontend and API Backend concurrently | Root (`apps/*`) |
| `npm run dev:web` | Runs Next.js frontend server only | `apps/web` |
| `npm run dev:backend` | Runs NestJS API backend server only | `apps/backend` |
| `npm run build` | Compiles production bundles for all apps | Root (`apps/*`) |
| `npm run build:web` | Builds Next.js frontend production bundle | `apps/web` |
| `npm run build:backend` | Compiles NestJS backend TypeScript | `apps/backend` |
| `npm run db:generate` | Generates Prisma client types | `apps/backend` |
| `npm run db:seed` | Seeds database with African cities & bootcamps | `apps/backend` |

---

## 🔑 Key Features

### 👑 Organizer Dashboard (`/organizer`)
- **Bootcamp Management**: Create and edit bootcamps with real African country & city resolution (e.g. Algeria, Angola, Benin, Botswana, Cameroon, DRC, Egypt, Ethiopia, Ghana, Kenya, Nigeria, South Africa, etc.).
- **Daily Curriculum Builder**: Edit daily topics, markdown reading materials, tasks, and media attachments.
- **Timed Quiz Launcher**: Set custom quiz timer limits (5 min, 10 min, 15 min, 30 min) and unlock/lock daily quizzes.
- **Lightning Invoice Settlement**: View winner invoices with scannable **QR Codes** and **BOLT-11** payment strings. Pay directly via connected Polar LND node or record hex preimage proofs.
- **Attendance QR Scanner**: Scan developer attendance QR codes using camera or input token.

### ⚡ Developer Portal (`/developer`)
- **Interactive Daily Curriculum**: View daily modules, complete task checklists, and read course content.
- **Live Leaderboard & Timed Quizzes**: Participate in timed quizzes with real-time score calculation and Socket.io live rank updates.
- **Winner Prize Claim**: Top 3 leaderboard winners generate satoshi reward invoices via LNURL or custom BOLT-11 strings for organizer settlement.
- **WebLN Integration**: Connect WebLN-enabled wallets (Alby, Phantom, etc.) to verify node connections.

---

## ⚙️ Environment Configuration

Backend environment settings are stored in `apps/backend/.env`:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgres://avnadmin:PASS@HOST:PORT/defaultdb?sslmode=require"

# JWT Authentication
JWT_SECRET="afr_lightning_secret_key_jwt_2026"
JWT_EXPIRES_IN="7d"

# Redis Server
REDIS_HOST="localhost"
REDIS_PORT=6379

# Lightning LND Node REST Connection
LND_REST_HOST="https://127.0.0.1:8081"
LND_MACAROON_HEX="/path/to/admin.macaroon"
LND_CERT_PATH="/path/to/tls.cert"

# Application Ports
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

---

## 🌐 Endpoints Overview

- **Web Frontend Application**: [http://localhost:3000](http://localhost:3000)
  - Organizer Dashboard: `/organizer`
  - Developer Portal: `/developer`
  - Auth Pages: `/auth/login` and `/auth/register`
- **Backend API Base**: [http://localhost:4000/api](http://localhost:4000/api)
  - Auth: `/api/auth/login`, `/api/auth/register`
  - Bootcamps: `/api/bootcamps`
  - Quizzes: `/api/quiz/submit`, `/api/quiz/leaderboard/:bootcampId/day/:dayNumber`
  - Payouts: `/api/payouts/claim-winner`, `/api/payouts/process`, `/api/payouts/bootcamp/:bootcampId`
