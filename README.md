# SecureHealthIMS Backend

A secure healthcare information management system API built with Node.js and Express.js.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Express.js | 4.22.1 | Web Framework |
| Supabase | 2.90.1 | Database & Auth |
| JWT | 9.0.3 | Authentication |
| Helmet | 8.1.0 | Security Headers |

## Live Demo

**Production:** https://securehealthims-backend.onrender.com/

**Health Check:** https://securehealthims-backend.onrender.com/api/health

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/avkbsurya119/SecureHealthIMS_backend.git

# Install dependencies
cd SecureHealthIMS_backend
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 3000) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── config/        # Configuration (Supabase client)
├── controllers/   # Request handlers
├── middleware/    # Express middleware
│   ├── auth.middleware.js       # JWT verification
│   ├── rbac.middleware.js       # Role-based access
│   ├── consent.middleware.js    # Patient consent
│   ├── audit.middleware.js      # Access logging
│   └── errorHandler.middleware.js
├── routes/        # API route definitions
├── services/      # Business logic
├── utils/         # Utilities
├── app.js         # Express app setup
└── server.js      # Server entry point

database/
├── schema.sql     # Database schema
├── migrations/    # Schema migrations
└── seed.sql       # Seed data
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register/initiate` | Start registration |
| POST | `/api/auth/register/verify` | Verify OTP |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/search` | Search patients |
| GET | `/api/patients/:id` | Get patient by ID |
| GET | `/api/patients/me` | Get own patient data |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments/me` | Get my appointments |
| POST | `/api/appointments` | Create appointment |
| PATCH | `/api/appointments/:id/status` | Update status |

### Medical Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medical-records/me` | Get my records |
| POST | `/api/medical-records` | Create record |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/approve` | Approve user |

## Security Features

### Middleware Pipeline
```
Request -> Helmet -> CORS -> Rate Limit -> Auth -> RBAC -> Consent -> Audit -> Controller
```

| Middleware | Purpose |
|------------|---------|
| Helmet | Security headers (CSP, HSTS, etc.) |
| CORS | Cross-origin control |
| Rate Limiter | Request throttling |
| Auth | JWT verification |
| RBAC | Role-based access control |
| Consent | Patient consent verification |
| Audit | Access logging for compliance |

### HIPAA Compliance

- Patient consent verification before data access
- Complete audit trail of all data access
- Role-based access control
- Input validation and sanitization
- UUID validation for all IDs

## CI/CD Pipeline

The project uses GitHub Actions for CI and Render for CD.

| Stage | Tool | Status |
|-------|------|--------|
| Lint | ESLint | Non-blocking |
| Syntax Check | Node.js | Required |
| Security Audit | npm audit | Warning |
| Integration Tests | Custom scripts | Non-blocking |
| Deploy | Render | Auto on main |

## Database

Uses Supabase PostgreSQL with:
- Row Level Security (RLS)
- Audit logging triggers
- Consent management tables

### Key Tables
- `users` - All user accounts
- `patients` - Patient records
- `medical_records` - Medical records
- `appointments` - Appointments
- `patient_consents` - Consent settings
- `audit_logs` - Access audit trail

## Related

- [Frontend Repository](https://github.com/avkbsurya119/SecureHealthIMS_frontend)
- [API Documentation](./API_DOCUMENTATION.md)

## License

MIT
