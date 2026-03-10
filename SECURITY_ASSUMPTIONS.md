# Security Assumptions

This project is designed with the following security assumptions:

1. **HTTPS Enforcement**
   - All client-server communication is performed over HTTPS in production.
   - Insecure HTTP requests are rejected by middleware and/or proxy configuration.

2. **Authentication & Authorization**
   - All API endpoints require authentication via JWT.
   - Role-based access control (RBAC) restricts sensitive actions to authorized users only.

3. **Password Security**
   - Passwords are hashed using bcrypt before storage.
   - Plaintext passwords are never stored or logged.

4. **Audit Logging**
   - All access to sensitive data is logged in immutable audit tables.
   - Audit logs cannot be modified or deleted.

5. **Database Security**
   - Row Level Security (RLS) is enabled for all tables.
   - Database permissions are restricted; only the application can write to audit logs.

6. **Consent Management**
   - Patient consent is verified before any data access.

7. **Input Validation**
   - All user input is validated and sanitized to prevent injection attacks.

8. **Error Handling**
   - Errors are handled centrally and mapped to user-friendly messages.
   - Sensitive information is never exposed in error responses.

9. **CI/CD & Deployment**
   - Automated linting, syntax checks, and security audits are run in CI.
   - Production deployments are only accessible via HTTPS.

10. **Frontend Security**
    - No sensitive data is stored in the browser.
    - All API calls are made over HTTPS.

> For additional details, see the README and API documentation.
