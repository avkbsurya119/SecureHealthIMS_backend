# 🏥 Secure Healthcare Backend - Project Structure

## 📁 Directory Structure

```
SecureHealthIMS_backend/
│
├── database/
│   ├── schema.sql                      # Original database schema
│   ├── migrations/
│   │   ├── 001_harden_schema_rbac_consent_audit.sql
│   │   ├── 002_data_migration.sql
│   │   ├── 001_rollback_harden_schema.sql
│   │   └── README.md
│   ├── seed.sql                        # Seed data (optional)
│
├── src/
│   ├── config/
│   │   └── supabaseClient.js           # Supabase configuration
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js          # JWT authentication
│   │   ├── rbac.middleware.js          # Role-based access control
│   │   ├── consent.middleware.js       # Consent enforcement
│   │   ├── audit.middleware.js         # Audit logging
│   │   ├── validation.middleware.js    # Input validation
│   │   └── errorHandler.middleware.js  # Error handling
│   │
│   ├── services/
│   │   ├── consent.service.js          # Consent business logic
│   │   └── audit.service.js            # Audit logging logic
│   │
│   ├── controllers/
│   │   ├── medicalRecords.controller.js
│   │   ├── appointments.controller.js
│   │   ├── consent.controller.js
│   │   └── audit.controller.js
│   │
│   ├── routes/
│   │   ├── health.routes.js            # Health check (legacy)
│   │   ├── patients.routes.js          # Patient CRUD (legacy)
│   │   ├── medicalRecords.routes.js    # Medical records API
│   │   ├── appointments.routes.js      # Appointments API
│   │   ├── consent.routes.js           # Consent management API
│   │   └── audit.routes.js             # Audit logs API
│   │
│   ├── utils/
│   │   └── errors.js                   # Custom error classes
│   │
│   ├── app.js                          # Express app configuration
│   └── server.js                       # Server entry point
│
├── .env                                # Environment variables (not in git)
├── .gitignore
├── package.json
├── API_DOCUMENTATION.md                # Complete API documentation
└── README.md                           # This file
```

---

## 🔐 Security Architecture

### 1. Authentication Layer
**File**: `src/middleware/auth.middleware.js`

- Verifies JWT tokens from Supabase Auth
- Extracts user information (id, role, email)
- Checks `is_active` status
- Attaches user to `req.user` for downstream use

**Usage**:
```javascript
router.get('/protected', authenticate, controller);
```

---

### 2. Authorization Layer (RBAC)
**File**: `src/middleware/rbac.middleware.js`

Middleware functions:
- `requireRole(role)` - Requires specific role
- `requireAnyRole([roles])` - Requires any of specified roles
- `requirePatientOrAdmin` - Patient or admin access
- `requireDoctor` - Doctor only + attaches doctor record
- `requireRecordOwnership` - Only creator can modify
- `requireAppointmentAccess` - Ownership-based access

**Usage**:
```javascript
router.post('/medical-records', authenticate, requireDoctor, controller);
```

---

### 3. Consent Enforcement
**Files**: 
- `src/middleware/consent.middleware.js`
- `src/services/consent.service.js`

**Rules**:
1. **DEFAULT DENY** - No access without explicit consent
2. Patients always access their own data (no consent check)
3. Admins can access (logged and monitored)
4. Doctors/Nurses MUST have explicit consent

**Usage**:
```javascript
router.get('/medical-records/:patientId', 
  authenticate, 
  requireMedicalRecordsConsent,  // ← Consent check
  controller
);
```

---

### 4. Audit Logging
**Files**: 
- `src/middleware/audit.middleware.js`
- `src/services/audit.service.js`

**Features**:
- Logs all READ/CREATE/UPDATE/DELETE actions
- Captures user_id, patient_id, resource, timestamp, IP
- Immutable logs (protected by database triggers)
- Patients can see who accessed their data

**Usage**:
```javascript
router.get('/medical-records', 
  authenticate, 
  auditLog('medical_records'),  // ← Auto-audit
  controller
);
```

---

### 5. Input Validation
**File**: `src/middleware/validation.middleware.js`

**Features**:
- UUID validation
- Required field checks
- Enum validation
- Length validation
- Date/time format validation
- XSS protection (sanitization)

**Usage**:
```javascript
router.post('/medical-records',
  authenticate,
  validate(schemas.medicalRecord.create),  // ← Validation
  controller
);
```

---

### 6. Error Handling
**File**: `src/middleware/errorHandler.middleware.js`

**Custom Error Classes**:
- `UnauthenticatedError` (401)
- `UnauthorizedError` (403)
- `ConsentRequiredError` (403)
- `NotFoundError` (404)
- `ValidationError` (422)
- `InternalServerError` (500)

**Features**:
- Standardized error responses
- No sensitive data leaks
- Development vs production error details
- Async error handling

---

## 🛡️ Security Middleware Chain

Typical secure endpoint structure:

```javascript
router.post('/medical-records',
  authenticate,                          // 1. Verify JWT token
  requireDoctor,                         // 2. Check role = doctor
  validate(schemas.medicalRecord.create), // 3. Validate input
  auditLog('medical_records'),           // 4. Log the action
  createMedicalRecord                    // 5. Controller
);
```

---

## 📊 Database Security

### Tables
- `users` - Extended with `is_active` and roles
- `patient_consents` - Current consent state (DEFAULT DENY)
- `consent_history` - Immutable log of consent changes
- `audit_logs` - Immutable log of all data access
- `medical_records` - Enhanced with `created_by`, `updated_by`
- `appointments` - Enhanced with `created_by`, cancellation tracking

### Triggers
- Auto-update `updated_at` fields
- Auto-log consent changes to `consent_history`
- Auto-log medical record changes to `audit_logs`
- Prevent UPDATE/DELETE on audit logs and consent history

### Functions
- `has_patient_consent(patient_id, consent_type)` - Check consent
- `log_audit_event(...)` - Manual audit logging
- `update_updated_at_column()` - Auto-update timestamps

---

## 🔑 Key Design Principles

### 1. **Deny by Default**
- No access without explicit permission
- Consent defaults to DENIED
- All endpoints require authentication

### 2. **Defense in Depth**
- Multiple security layers (auth → RBAC → consent → audit)
- Each layer is independent and reusable
- Fail-safe on security checks

### 3. **Immutability**
- Audit logs cannot be modified or deleted
- Consent history is append-only
- Database triggers enforce immutability

### 4. **Transparency**
- Patients can see who accessed their data
- All actions are logged
- Consent status is visible

### 5. **Least Privilege**
- Users only access what they need
- Ownership checks prevent cross-access
- Role-based restrictions

---

## 🚀 Running the Application

### Start Development Server
```bash
npm run dev
```

### Start Production Server
```bash
npm start
```

### Environment Variables Required
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
FRONTEND_URL=http://localhost:5173
PORT=3000
```

---

## 🧪 Testing

### Manual Testing (Postman)
1. Import API documentation
2. Set JWT token in environment
3. Test each endpoint with different roles
4. Verify consent enforcement
5. Check audit logs

### Test Scenarios
1. **Consent Enforcement**:
   - Create medical record as doctor
   - Try to access without consent → should fail
   - Grant consent as patient
   - Try to access again → should succeed

2. **Ownership**:
   - Create record as Doctor A
   - Try to update as Doctor B → should fail
   - Update as Doctor A → should succeed

3. **Audit Logging**:
   - Perform any action
   - Check audit logs as patient
   - Verify action was logged

---

## 📝 Adding New Endpoints

### 1. Create Controller
```javascript
// src/controllers/newResource.controller.js
export const createResource = asyncHandler(async (req, res) => {
  // Business logic
  return ApiResponse.created(res, data);
});
```

### 2. Create Routes
```javascript
// src/routes/newResource.routes.js
router.post('/',
  authenticate,
  requireRole('admin'),
  validate(schema),
  auditLog('resource'),
  createResource
);
```

### 3. Register in app.js
```javascript
import newResourceRoutes from './routes/newResource.routes.js';
app.use('/api/new-resource', newResourceRoutes);
```

### 4. Add Validation Schema
```javascript
// src/middleware/validation.middleware.js
export const schemas = {
  newResource: {
    create: {
      field: { required: true, type: 'string' }
    }
  }
};
```

---

## 🔒 Security Checklist

Before deploying:

- [ ] All endpoints have authentication
- [ ] RBAC is enforced
- [ ] Consent checks are in place
- [ ] Audit logging is enabled
- [ ] Input validation is complete
- [ ] Error messages don't leak data
- [ ] Rate limiting is configured
- [ ] HTTPS is enabled (production)
- [ ] Environment variables are secure
- [ ] Database triggers are active
- [ ] Audit logs are immutable
- [ ] Consent history is immutable

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Database Migration README](./database/migrations/README.md)
- [Supabase Documentation](https://supabase.com/docs)

---

**Status**: Production-Ready ✅  
**Last Updated**: January 15, 2026  
**Version**: 1.0.0
