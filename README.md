# SecureHealthIMS Backend

Enterprise-grade backend API for SecureHealthIMS, focused on healthcare data protection, consent-aware access, and operational reliability.

## Overview

SecureHealthIMS Backend provides role-aware REST APIs for patient care workflows, administration, and AI-assisted interactions. The service is built with Express and Supabase, and is designed around strict access control and auditability requirements expected in healthcare systems.

## Current Capabilities

- Authentication and profile APIs with OTP-based registration verification.
- Role-based access control for `patient`, `doctor`, `nurse`, and `admin` roles.
- Consent-first data access model with default-deny behavior for sensitive records.
- Clinical workflows for appointments, visits, prescriptions, and medical records.
- Administrative workflows for user lifecycle, approval, and oversight.
- Audit trail APIs and middleware coverage for sensitive operations.
- Chatbot API integration for text/voice healthcare assistant scenarios.

## Technology Stack

| Layer | Technology | Version |
|------|------------|---------|
| Runtime | Node.js | 20+ |
| API Framework | Express | 4.22.1 |
| Data + Auth | Supabase JS | 2.90.1 |
| Security Headers | Helmet | 8.1.0 |
| Throttling | express-rate-limit | 8.2.1 |
| Token Utilities | jsonwebtoken | 9.0.3 |

## Service Endpoints

- Production API: `https://securehealthims-backend.onrender.com/`
- Health endpoint: `https://securehealthims-backend.onrender.com/api/health`

## Documentation Index

- [API Documentation](./API_DOCUMENTATION.md)
- [DevOps / Deployment Guide](./DEVOPS_ARCHITECTURE.md)
- [Test Documentation](./TEST_DOCUMENTATION.md)
- [User Documentation](./USER_DOCUMENTATION.md)

## Repository Layout

```text
src/
  app.js
  server.js
  config/
  controllers/
  middleware/
  routes/
  services/
  utils/

database/
  schema.sql
  seed.sql
  migrations/

scripts/
  *.js
```

## Functional Modules

- `auth`: login, registration initiation/verification, current-user context.
- `patients`: search and profile access with consent and role enforcement.
- `appointments`: booking, retrieval, and status transitions.
- `medical-records`: clinician access with ownership/consent rules.
- `visits`: encounter creation and follow-up updates.
- `prescriptions`: medication workflow with access checks.
- `consent`: patient-managed grant/revoke and consent history.
- `audit`: patient and admin views of data-access events.
- `admin`: operational controls, approvals, and user governance.
- `chatbot`: AI assistant endpoints for conversational workflows.

## Security Architecture

- `Helmet` for baseline HTTP hardening.
- CORS allowlist using `FRONTEND_URL` plus approved origins.
- Route-specific rate limiting for auth, API, and consent operations.
- JWT-based authentication middleware.
- RBAC enforcement at route and controller boundaries.
- Consent middleware/service enforcing default-deny access.
- Audit middleware/service recording sensitive operations.
- UUID validation utilities for ID-bearing routes.
- HTTPS enforcement in production deployments.

## Prerequisites

- Node.js 20+
- npm 9+
- Supabase project with required schema

## Local Setup

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Service port (default `3000`) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key for backend operations |
| `JWT_SECRET` | Yes | Secret for JWT utilities |
| `FRONTEND_URL` | Yes | Allowed frontend origin |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run with nodemon for development |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |

## Data Model Notes

The service currently supports both unified user-centric flows and compatibility paths for legacy table usage. Core tables in active flows include:

- `users`
- `patients`
- `doctors`
- `appointments`
- `medical_records`
- `visits`
- `prescriptions`
- `patient_consents`
- `audit_logs`

## Testing and Validation

Detailed test coverage and execution guidance are in [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md). Debug and integration helpers are available under `tests/` and `scripts/`.

## Deployment

Primary deployment target is Render. Infrastructure and pipeline details are documented in [DEVOPS_ARCHITECTURE.md](./DEVOPS_ARCHITECTURE.md).

## Related Repositories

- [SecureHealthIMS Frontend](https://github.com/avkbsurya119/SecureHealthIMS_frontend)

## License

MIT
