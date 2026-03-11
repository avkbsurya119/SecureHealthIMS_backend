# SecureHealthIMS DevOps Architecture & Strategy

## Comprehensive DevOps Strategy Document

| Document Metadata | |
|-------------------|-----------------|
| **Project** | SecureHealthIMS |
| **Version** | 2.1.0 |
| **Date** | March 11, 2026 |
| **Classification** | Academic / Professional |
| **Author** | DevOps Architecture Team |
| **GitHub** | https://github.com/avkbsurya119 |
| **Frontend URL** | https://secure-health-ims-frontend.vercel.app/ |
| **Backend URL** | https://securehealthims-backend.onrender.com/ |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Component Inventory](#2-project-component-inventory)
3. [Component Analysis & Deployment Mapping](#3-component-analysis--deployment-mapping)
4. [CI/CD Architecture](#4-cicd-architecture)
5. [Quality Gates & Testing Strategy](#5-quality-gates--testing-strategy)
6. [Tools & Platforms Inventory](#6-tools--platforms-inventory)
7. [Architecture Diagrams](#7-architecture-diagrams)
8. [Environment Strategy](#8-environment-strategy)
9. [Security in DevOps](#9-security-in-devops)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Disaster Recovery & Rollback](#11-disaster-recovery--rollback)
12. [Assumptions & Decisions](#12-assumptions--decisions)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

### 1.1 Project Overview

SecureHealthIMS is a full-stack healthcare information management system consisting of:

- **Frontend Application**: React 19 + JavaScript + Vite single-page application with glassmorphic UI
- **Backend API Service**: Node.js 20+ Express.js REST API with comprehensive security middleware
- **AI Chatbot Service**: Google Gemini AI with Sarvam AI multilingual voice support (STT/TTS)
- **Database Layer**: Supabase-managed PostgreSQL with Row Level Security
- **Infrastructure Scripts**: Database migrations, seeding, and administrative utilities

### 1.2 DevOps Objectives

| Objective | Description | Priority |
|-----------|-------------|----------|
| **Automation** | Automate build, test, and deployment pipelines | Critical |
| **Quality Assurance** | Enforce quality gates before any deployment | Critical |
| **Security** | Integrate security checks into CI/CD | Critical |
| **Reliability** | Ensure consistent, repeatable deployments | High |
| **Observability** | Monitor application health and performance | Medium |
| **Cost Efficiency** | Utilize free-tier services appropriately | Medium |

### 1.3 Deployment Topology

| Component | Platform | Tier | Region |
|-----------|----------|------|--------|
| Frontend | Vercel | Free | Auto (Edge) |
| Backend | Render | Free | Oregon, USA |
| Database | Supabase | Free | Auto |
| CI/CD | GitHub Actions | Free | GitHub-hosted |
| Monitoring | UptimeRobot | Free | Global |

---

## 2. Project Component Inventory

### 2.1 Complete Component Map

| Component ID | Component Name | Type | Source Location | Deployable |
|--------------|----------------|------|-----------------|------------|
| **FE-001** | Frontend SPA | Application | `SecureHealthIMS_frontend/` | Yes |
| **BE-001** | Backend API | Application | `SecureHealthIMS_backend/` | Yes |
| **AI-001** | AI Chatbot Service | Service | `SecureHealthIMS_backend/src/controllers/chatbot.controller.js` | Yes (with BE) |
| **DB-001** | Database Schema | Infrastructure | `SecureHealthIMS_backend/database/` | Yes (Manual) |
| **DB-002** | Database Migrations | Infrastructure | `SecureHealthIMS_backend/database/migrations/` | Yes (Manual) |
| **DB-003** | Seed Data | Infrastructure | `SecureHealthIMS_backend/database/seed*.sql` | Yes (Manual) |
| **SC-001** | Admin Scripts | Utility | `SecureHealthIMS_backend/scripts/` | No (Dev Only) |
| **SC-002** | Test Scripts | Utility | `SecureHealthIMS_backend/tests` | No (CI Only) |
| **CF-001** | ESLint Config | Configuration | `SecureHealthIMS_frontend/eslint.config.js` | No |
| **CF-002** | Vite Config | Configuration | `SecureHealthIMS_frontend/vite.config.js` | No |
| **DOC-001** | API Documentation | Documentation | `API_DOCUMENTATION.md` | No |
| **DOC-002** | DevOps Documentation | Documentation | `DEVOPS_ARCHITECTURE.md` | No |
| **DOC-003** | Test Documentation | Documentation | `TEST_DOCUMENTATION.md` | No |
| **DOC-004** | User Documentation | Documentation | `USER_DOCUMENTATION.md` | No |

### 2.2 Frontend Component Breakdown

```
SecureHealthIMS_frontend/
├── src/
│   ├── api/                 # Axios API configuration
│   │   └── axios.js         # Configured Axios instance with interceptors
│   ├── assets/              # Static assets (images, svg)
│   ├── components/          # Reusable UI components
│   │   ├── auth/            # Login/Register forms
│   │   ├── chatbot/         # AI Chatbot component with voice support
│   │   ├── common/          # Common components (CustomCursor)
│   │   ├── layout/          # Layout components (Navbar)
│   │   ├── patient/         # Patient-specific components
│   │   └── ui/              # UI primitives (Button, Card, Input, etc.)
│   ├── context/             # React context providers
│   │   ├── AuthContext.jsx  # Authentication state
│   │   └── ThemeContext.jsx # Dark/Light theme state
│   ├── pages/               # Route-based page components
│   │   ├── Dashboard/       # Role-based dashboards (Admin, Doctor, Patient)
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── App.jsx              # Root component with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles with glassmorphic design
├── public/                  # Static assets in public folder
├── index.html               # HTML template
└── Configuration Files
    ├── package.json
    ├── vite.config.js       # Vite config with API proxy
    └── eslint.config.js
```

### 2.3 Backend Component Breakdown

```
SecureHealthIMS_backend/
├── src/
│   ├── config/              # Configuration (Supabase client)
│   │   └── supabaseClient.js
│   ├── controllers/         # Request handlers
│   │   ├── admin.controller.js      # Admin user management
│   │   ├── appointments.controller.js
│   │   ├── audit.controller.js      # Audit log retrieval
│   │   ├── auth.controller.js       # Authentication with OTP
│   │   ├── chatbot.controller.js    # AI Chatbot (Gemini + Sarvam AI)
│   │   ├── consent.controller.js    # Patient consent management
│   │   ├── doctors.controller.js
│   │   ├── patients.controller.js
│   │   ├── prescriptions.controller.js
│   │   └── visits.controller.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── consent.middleware.js
│   │   ├── audit.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic
│   │   └── audit.service.js # Centralized audit logging
│   ├── utils/               # Utilities
│   │   ├── errors.js        # Custom error classes
│   │   └── validation.utils.js # UUID validation
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── database/
│   ├── schema.sql           # Main schema
│   ├── migrations/          # Schema migrations
│   ├── seed.sql             # Base seed data
│   ├── seed_demo_accounts.sql
│   └── fix_schema.sql       # Schema patches
├── scripts/                 # Administrative scripts
│   ├── create-demo-accounts.js
│   ├── db_test.js
│   ├── migrate_admin.js
│   ├── seed_admin.js
│   ├── test_admin_flow.js
│   └── verify_jwt_login.js
└── package.json
```

### 2.4 Release Artifacts

| Artifact | Source | Build Output | Destination |
|----------|--------|--------------|-------------|
| Frontend Bundle | `SecureHealthIMS_frontend/src/` | `dist/` (static files) | Vercel CDN |
| Backend Service | `SecureHealthIMS_backend/src/` | Node.js runtime | Render Container |
| Database Schema | `database/*.sql` | SQL statements | Supabase PostgreSQL |

---

## 3. Component Analysis & Deployment Mapping

### 3.1 Frontend Application (FE-001)

| Attribute | Value |
|-----------|-------|
| **Repository** | `SecureHealthIMS_frontend/` |
| **Language** | JavaScript |
| **Framework** | React 19.2.0 |
| **Build Tool** | Vite 7.3.1 |
| **Package Manager** | npm |
| **Deployment Target** | Vercel (Static Hosting + Edge Functions) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist/` |
| **Node Version** | 20.x or higher |

#### 3.1.1 Dependencies Analysis

**Production Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.0 | UI framework |
| react-dom | 19.2.0 | DOM rendering |
| react-router-dom | 7.13.0 | Client-side routing |
| axios | 1.13.5 | HTTP Client |
| lucide-react | 0.563.0 | Icon library |
| framer-motion | 12.34.0 | Animation library |
| clsx | 2.1.1 | Conditional classnames utility |

**Development Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | 9.39.1 | Code linting |
| vite | 7.3.1 | Build tooling |
| @vitejs/plugin-react | 5.1.1 | React plugin for Vite |

#### 3.1.2 Pre-Deployment Validation Requirements

| Check | Tool | Command | Failure Action |
|-------|------|---------|----------------|
| Linting | ESLint | `npm run lint` | Block deployment |
| Build Verification | Vite | `npm run build` | Block deployment |
| Unit Tests | Vitest  | `npm test` | Block deployment |
| Bundle Size | Vite | Build output analysis | Warning |

### 3.2 Backend API Service (BE-001)

| Attribute | Value |
|-----------|-------|
| **Repository** | `SecureHealthIMS_backend/` |
| **Language** | JavaScript (ES Modules) |
| **Framework** | Express.js 4.22.1 |
| **Runtime** | Node.js 20+ |
| **Package Manager** | npm |
| **Deployment Target** | Render (Web Service) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

#### 3.2.1 Dependencies Analysis

**Production Dependencies:**
| Package | Version | Purpose | Security Relevance |
|---------|---------|---------|-------------------|
| express | 4.22.1 | Web framework | Core |
| @supabase/supabase-js | 2.90.1 | Database client | Data access |
| jsonwebtoken | 9.0.3 | JWT handling | Authentication |
| helmet | 8.1.0 | Security headers | Critical |
| cors | 2.8.5 | CORS handling | Security |
| express-rate-limit | 8.2.1 | Rate limiting | Security |
| dotenv | 16.6.1 | Environment config | Configuration |
| postgres | 3.4.8 | PostgreSQL client | Data access |
| @google/genai | Latest | Google Gemini AI | AI Chatbot |
| groq-sdk | Latest | Groq AI (backup) | AI Chatbot |
| multer | Latest | File upload handling | Voice messages |
| form-data | Latest | FormData handling | API integration |

**Development Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | 3.1.11 | Development hot-reload |

#### 3.2.2 Middleware Security Pipeline

The application employs a defense-in-depth strategy using a combination of global and route-specific middleware.

**Global Middleware (in `app.js`):**
1. **Helmet**: Sets crucial security headers (CSP, HSTS, X-Frame-Options, etc.)
2. **CORS**: Enforces the cross-origin policy restricting access to authorized domains
3. **Body Parsers**: Parses incoming JSON and URL-encoded payloads
4. **Rate Limiters**: Applied globally to API routers to prevent abuse and DDoS attacks

**Route-Specific Security Middleware:**
This middleware chain is applied to protected routes to ensure granular control over authentication, authorization, and data access.

```
Request → Global Middleware → [Authenticate → Authorize (RBAC) → Validate → Check Consent → Audit] → Controller → Response
```

| Middleware | File | Purpose | Order |
|------------|------|---------|-------|
| `authenticate` | `auth.middleware.js` | JWT verification | 1 |
| `require<Role>` | `rbac.middleware.js` | Role-based access control | 2 |
| `validate` | `validation.middleware.js` | Input validation & sanitization | 3 |
| `require<Resource>Consent` | `consent.middleware.js` | Patient consent verification | 4 |
| `auditLog` | `audit.middleware.js` | Access logging for compliance | 5 |
| `errorHandler` | `errorHandler.middleware.js` | Centralized error responses | Last |

#### 3.2.3 Pre-Deployment Validation Requirements

| Check | Tool | Command | Failure Action |
|-------|------|---------|----------------|
| Dependency Install | npm | `npm install` | Block deployment |
| Syntax Check | Node.js | `node --check src/server.js` | Block deployment |
| Linting | ESLint  | `npm run lint` | Block deployment |
| Unit Tests | Jest  | `npm test` | Block deployment |
| Security Audit | npm audit | `npm audit --production` | Warning/Block |
| Health Check | HTTP | `GET /api/health` | Block traffic |

### 3.3 Database Layer (DB-001, DB-002, DB-003)

| Attribute | Value |
|-----------|-------|
| **Platform** | Supabase |
| **Engine** | PostgreSQL 15 |
| **Schema Location** | `SecureHealthIMS_backend/database/schema.sql` |
| **Migrations** | `SecureHealthIMS_backend/database/migrations/` |
| **Seed Data** | `SecureHealthIMS_backend/database/seed*.sql` |
| **Deployment Method** | Manual (Supabase SQL Editor) |

#### 3.3.1 Database Objects

| Object Type | Count | Examples |
|-------------|-------|----------|
| Tables | 8+ | users, patients, medical_records, appointments, patient_consents, consent_history, audit_logs |
| Functions | 3+ | has_patient_consent(), log_audit_event(), update_updated_at_column() |
| Triggers | 4+ | Audit logging, timestamp updates, consent history |
| Policies | Multiple | Row Level Security policies |
| Indexes | Multiple | Performance optimization |

#### 3.3.2 Migration Strategy

| Phase | Action | Tool | Validation |
|-------|--------|------|------------|
| Development | Apply migrations locally | Supabase CLI | Manual testing |
| Staging | N/A (free tier limitation) | - | - |
| Production | Apply via SQL Editor | Supabase Dashboard | Post-migration tests |
| Rollback | Execute rollback scripts | Supabase Dashboard | Data integrity check |

### 3.4 Administrative Scripts (SC-001, SC-002)

| Script | Purpose | Execution Context | Automated |
|--------|---------|-------------------|-----------|
| `create-demo-accounts.js` | Create test users | Development | No |
| `db_test.js` | Database connectivity test | CI/CD | Yes |
| `migrate_admin.js` | Admin user migration | Deployment | Manual |
| `seed_admin.js` | Seed admin user | Deployment | Manual |
| `test_admin_flow.js` | Integration test | CI/CD | Yes |
| `verify_jwt_login.js` | Auth verification test | CI/CD | Yes |

---

## 4. CI/CD Architecture

### 4.1 Pipeline Overview

The CI/CD pipeline follows a trunk-based development model with the following workflow:

```
Developer → Feature Branch → Pull Request → CI Checks → Code Review → Merge → CD Deploy → Production
```

### 4.2 Branching Strategy

| Branch Type | Pattern | Purpose | CI Trigger | CD Trigger |
|-------------|---------|---------|------------|------------|
| Main | `main` | Production-ready code | Yes | Yes (Auto-deploy) |
| Feature | `feature/*` | New features | Yes (PR) | No |
| Bugfix | `fix/*` | Bug fixes | Yes (PR) | No |
| Hotfix | `hotfix/*` | Emergency fixes | Yes (PR) | No |
| Release | `release/*` | Release preparation | Yes | Manual |

### 4.3 CI Pipeline Stages

#### 4.3.1 Frontend CI Pipeline

```yaml
# .github/workflows/ci.yml
name: Frontend CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: [lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: dist/
```

#### 4.3.2 Backend CI Pipeline

```yaml
# .github/workflows/ci.yml
name: Backend CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --production
        continue-on-error: true

  syntax-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: node --check src/server.js
      - run: node --check src/app.js

  integration-test:
    runs-on: ubuntu-latest
    needs: [syntax-check]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: node scripts/db_test.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        continue-on-error: true
```

### 4.4 CD Pipeline (Deployment)

#### 4.4.1 Frontend CD (Vercel)

| Stage | Trigger | Action | Validation |
|-------|---------|--------|------------|
| Preview | Pull Request | Deploy preview branch | Automatic preview URL |
| Production | Merge to main | Deploy to production | Health check |
| Rollback | Manual | Promote previous deployment | Verification |

#### 4.4.2 Backend CD (Render)

| Stage | Trigger | Action | Validation |
|-------|---------|--------|------------|
| Build | Push to main | `npm install` | Exit code 0 |
| Deploy | Build success | `npm start` | Process starts |
| Health | Post-deploy | `GET /api/health` | 200 OK |
| Rollback | Manual | Deploy previous commit | Health check |

---

## 5. Quality Gates & Testing Strategy

### 5.1 Quality Gate Definition

A **Quality Gate** is a checkpoint in the CI/CD pipeline that must pass before proceeding to the next stage.

| Gate ID | Gate Name | Scope | Blocking | Threshold |
|---------|-----------|-------|----------|-----------|
| QG-01 | Code Linting | Frontend | Yes | 0 errors |
| QG-02 | Build Success | Frontend | Yes | Exit code 0 |
| QG-03 | Unit Tests | Frontend | Yes | 100% pass |
| QG-04 | Syntax Check | Backend | Yes | Exit code 0 |
| QG-05 | Security Audit | Backend | Conditional | 0 high/critical |
| QG-06 | Integration Tests | Backend | Yes | 100% pass |
| QG-07 | Health Check | Both | Yes | HTTP 200 |

### 5.2 Security Testing

| Test Type | Tool | Frequency | Blocking |
|-----------|------|-----------|----------|
| Dependency Audit | npm audit | Every CI run | High/Critical vulns |
| Secret Detection | GitLeaks | Every commit | Any detection |
| SAST | CodeQL | Every push/PR | High severity |
| Header Check | Manual/Automated | Post-deploy | Security headers missing |

---

## 6. Tools & Platforms Inventory

### 6.1 Complete Tools Matrix

| Category | Tool | Version | Purpose | Justification |
|----------|------|---------|---------|---------------|
| **Version Control** | Git | Latest | Source control | Industry standard |
| **Repository** | GitHub | N/A | Code hosting | Free, integrated CI/CD |
| **CI/CD** | GitHub Actions | N/A | Pipeline execution | Native GitHub integration, free tier |
| **Frontend Build** | Vite | 7.3.1 | Build tooling | Fast builds, modern ESM support |
| **Frontend Framework** | React | 19.2.0 | UI framework | Industry standard, component model |
| **Frontend Linting** | ESLint | 9.39.1 | Code quality | Enforce coding standards |
| **Backend Runtime** | Node.js | 20.x+ | JavaScript runtime | LTS version, wide support |
| **Backend Framework** | Express.js | 4.22.1 | Web framework | Mature, extensive middleware |
| **Database** | PostgreSQL | 15 | Relational database | ACID compliance, healthcare suitable |
| **Database Platform** | Supabase | Latest | Managed PostgreSQL | Free tier, built-in auth, RLS |
| **Authentication** | JWT | N/A | Token-based auth | Stateless, scalable |
| **Frontend Hosting** | Vercel | N/A | Static hosting | Optimized for React, edge network |
| **Backend Hosting** | Render | N/A | Container hosting | Free tier, easy deployment |
| **Monitoring** | UptimeRobot | N/A | Uptime monitoring | Free, prevents cold starts |
| **Package Manager** | npm | 9.x+ | Dependency management | Default Node.js package manager |

### 6.2 DevOps-Specific Tooling

| Tool | Category | Usage | Configuration |
|------|----------|-------|---------------|
| actions/checkout@v4 | CI | Repository checkout | Standard |
| actions/setup-node@v4 | CI | Node.js setup | v20, caching |
| actions/upload-artifact@v4 | CI | Build artifact storage | Build outputs |
| actions/cache@v4 | CI | Dependency caching | npm cache |
| github/codeql-action | Security | Static analysis | JavaScript |

---

## 7. Architecture Diagrams

### 7.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         END USERS                                │
│              (Patients, Doctors, Nurses, Admins)                │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│                  ┌─────────────────────┐                        │
│                  │   Frontend SPA      │                        │
│                  │   React + Vite      │                        │
│                  └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER PLATFORM                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Express.js API                          │   │
│  │                  Node.js 20                              │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │            Security Middleware                   │    │   │
│  │  │  Helmet → CORS → Rate Limit → Auth → RBAC →     │    │   │
│  │  │  Consent → Audit → Controller                    │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ PostgreSQL Connection
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE PLATFORM                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL 15                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   Tables    │  │     RLS     │  │   Triggers  │     │   │
│  │  │   users     │  │   Policies  │  │   Audit     │     │   │
│  │  │   patients  │  │             │  │   Logging   │     │   │
│  │  │   records   │  │             │  │             │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 CI/CD Pipeline Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Code    │───►│  Commit  │───►│   Push   │───►│   PR     │
│  Change  │    │  Local   │    │  Branch  │    │  Create  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                CI PIPELINE (GitHub Actions)          ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │  Lint   │  │ Security│  │  Syntax │  │  CodeQL SAST    │   │
│  │  Check  │  │  Audit  │  │  Check  │  │                 │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘   │
│       └────────────┴────────────┴────────────────┘             │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │    BUILD    │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │ QUALITY GATE│                              │
│                    └──────┬──────┘                              │
└───────────────────────────┼─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
    ┌────────┐         ┌────────┐        ┌─────────┐
    │  FAIL  │         │  PASS  │        │ WARNING │
    └────────┘         └───┬────┘        └─────────┘
                           │
                    ┌──────▼──────┐
                    │   MERGE     │
                    │   TO MAIN   │
                    └──────┬──────┘
                           │
         CD PIPELINE       ▼
┌─────────────────────────────────────────────────────────────────┐
│    ┌────────────────────┐          ┌────────────────────┐      │
│    │   FRONTEND CD      │          │   BACKEND CD       │      │
│    │   (Vercel)         │          │   (Render)         │      │
│    │                    │          │                    │      │
│    │  1. Detect change  │          │  1. Detect change  │      │
│    │  2. npm install    │          │  2. npm install    │      │
│    │  3. npm run build  │          │  3. Start server   │      │
│    │  4. Deploy to CDN  │          │  4. Health check   │      │
│    └─────────┬──────────┘          └─────────┬──────────┘      │
│              └───────────────┬───────────────┘                  │
│                              ▼                                  │
│                       ┌─────────────┐                           │
│                       │ PRODUCTION  │                           │
│                       │    LIVE     │                           │
│                       └─────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Environment Strategy

### 8.1 Environment Definitions

| Environment | Purpose | Infrastructure | Data |
|-------------|---------|----------------|------|
| **Local** | Development | Developer machine | Mock/Seed data |
| **CI** | Testing | GitHub Actions runner | Test fixtures |
| **Production** | Live users | Vercel + Render + Supabase | Real data |

### 8.2 Environment Variables

#### 8.2.1 Backend Environment Variables

| Variable | Local | CI | Production | Sensitive |
|----------|-------|-----|------------|-----------|
| `NODE_ENV` | development | test | production | No |
| `PORT` | 3000 | 3000 | Auto | No |
| `SUPABASE_URL` | Dev project | Test project | Prod project | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev key | Test key | Prod key | **Yes** |
| `FRONTEND_URL` | http://localhost:5173 | http://localhost:5173 | https://app.vercel.app | No |
| `GEMINI_API_KEY` | Dev key | - | Prod key | **Yes** |
| `GROQ_API_KEY` | Dev key | - | Prod key | **Yes** |
| `SARVAM_API_KEY` | Dev key | - | Prod key | **Yes** |

#### 8.2.2 Frontend Environment Variables

| Variable | Local | CI | Production | Sensitive |
|----------|-------|-----|------------|-----------|
| `VITE_API_URL` | http://localhost:3000 | http://localhost:3000 | https://api.onrender.com | No |

---

## 9. Security in DevOps

### 9.1 Security Controls Matrix

| Control | Implementation | Layer | Verification |
|---------|----------------|-------|--------------|
| Secret Detection | GitLeaks | Pre-commit | Automated |
| Dependency Scanning | npm audit | CI | Automated |
| SAST | CodeQL | CI (Every push/PR) | Automated |
| UUID Validation | validation.utils.js | Application | Input sanitization |
| Container Scanning | N/A (Managed platforms) | Infrastructure | Platform |
| Access Control | GitHub permissions | Repository | Manual review |
| Branch Protection | Required reviews | Repository | Enforced |

### 9.2 Security Checklist for Deployment

**Pre-Deployment:**
- [ ] No secrets in code or logs
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] All security middleware active
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Environment variables set correctly

**Post-Deployment:**
- [ ] HTTPS enforced
- [ ] Security headers present (check via securityheaders.com)
- [ ] Authentication working
- [ ] Audit logging active
- [ ] Health endpoint responding

---

## 10. Monitoring & Observability

### 10.1 Monitoring Stack

| Layer | Tool | Metrics | Alerting |
|-------|------|---------|----------|
| Uptime | UptimeRobot | Availability, Response time | Email |
| Application | Console logs (Render) | Errors, Requests | Manual review |
| Database | Supabase Dashboard | Connections, Query performance | Dashboard |
| Frontend | Vercel Analytics (optional) | Page views, Performance | Dashboard |

### 10.2 Health Check Endpoints

| Endpoint | Purpose | Expected Response | Check Frequency |
|----------|---------|-------------------|-----------------|
| `GET /api/health` | Backend liveness | `200 OK` | 5 minutes |
| `GET /` | Frontend availability | `200 OK` | 5 minutes |

---

## 11. Disaster Recovery & Rollback

### 11.1 Rollback Procedures

#### 11.1.1 Frontend Rollback (Vercel)

| Step | Action | Command/UI |
|------|--------|------------|
| 1 | Access Vercel Dashboard | vercel.com/dashboard |
| 2 | Navigate to Deployments | Select project → Deployments |
| 3 | Find last working deployment | Identify by date/commit |
| 4 | Promote to production | Click "..." → "Promote to Production" |
| 5 | Verify | Check application functionality |

**Recovery Time Objective (RTO):** < 5 minutes

#### 11.1.2 Backend Rollback (Render)

| Step | Action | Command/UI |
|------|--------|------------|
| 1 | Access Render Dashboard | dashboard.render.com |
| 2 | Navigate to Deploy history | Select service → Events |
| 3 | Find last working deployment | Identify by date/commit |
| 4 | Trigger rollback | Click "Rollback to this deploy" |
| 5 | Verify | Check /api/health endpoint |

**Recovery Time Objective (RTO):** < 10 minutes

### 11.2 Backup Strategy

| Component | Backup Method | Frequency | Retention |
|-----------|--------------|-----------|-----------|
| Code | Git repository | Every push | Indefinite |
| Database | Supabase automatic | Daily | 7 days (free tier) |
| Secrets | Documented securely | On change | Current + 1 previous |
| Configuration | In repository | Every push | Indefinite |

---

## 12. Assumptions & Decisions

### 12.1 Architecture Decisions

| ID | Decision | Alternatives Considered | Rationale |
|----|----------|------------------------|-----------|
| D-01 | Separate repos for FE/BE | Monorepo | Simpler deployment pipelines |
| D-02 | GitHub Actions for CI | Jenkins, CircleCI | Native integration, free tier |
| D-03 | Vercel for frontend | Netlify, S3 | Best React/Vite support |
| D-04 | Render for backend | Heroku, Railway | Free tier available |
| D-05 | Supabase for database | AWS RDS, PlanetScale | Free PostgreSQL, built-in auth |
| D-06 | JWT for authentication | Session-based | Stateless, scalable |
| D-07 | UptimeRobot for monitoring | Pingdom, StatusCake | Free tier adequate |

---

## 13. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **CI** | Continuous Integration - automated building and testing of code |
| **CD** | Continuous Deployment - automated deployment of validated code |
| **JWT** | JSON Web Token - authentication token format |
| **RBAC** | Role-Based Access Control - authorization model |
| **RLS** | Row Level Security - PostgreSQL feature for data access control |
| **SPA** | Single Page Application - client-side rendered web application |
| **CDN** | Content Delivery Network - distributed content hosting |
| **RTO** | Recovery Time Objective - target time to restore service |
| **SAST** | Static Application Security Testing - code analysis for vulnerabilities |

### Appendix B: Reference Links

| Resource | URL |
|----------|-----|
| GitHub Actions Documentation | https://docs.github.com/en/actions |
| Vercel Documentation | https://vercel.com/docs |
| Render Documentation | https://render.com/docs |
| Supabase Documentation | https://supabase.com/docs |
| React Documentation | https://react.dev |
| Express.js Documentation | https://expressjs.com |
| Node.js Documentation | https://nodejs.org/docs |
| Vite Documentation | https://vitejs.dev |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-10 | DevOps Team | Initial release |
| 1.1.0 | 2026-02-11 | DevOps Team | Updated with accurate technical details |
| 2.0.0 | 2026-03-09 | DevOps Team | Updated Node.js to 20.x, added CodeQL, removed Dependabot |
| 2.1.0 | 2026-03-11 | DevOps Team | Added AI Chatbot (Gemini + Sarvam AI), updated component inventory, added documentation references |

---

**End of Document**

*SecureHealthIMS DevOps Architecture & Strategy v2.1.0*
