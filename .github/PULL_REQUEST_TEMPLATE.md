## 📋 Description

<!-- Provide a brief description of the changes -->

## 🔄 Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation update
- [ ] 🔒 Security fix
- [ ] ♻️ Refactoring (no functional changes)
- [ ] 🔧 Configuration change

## 🔒 Security Considerations

<!-- For healthcare data, security is critical -->

- [ ] This change does not expose sensitive patient data
- [ ] Authentication/Authorization is properly enforced
- [ ] Input validation is implemented
- [ ] Audit logging is in place for sensitive operations

## 🧪 Testing

- [ ] I have tested these changes locally
- [ ] I have tested with the Supabase database
- [ ] API endpoints return expected responses
- [ ] Error handling works correctly

## 📋 API Changes (if applicable)

<!-- Document any API endpoint changes -->

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/...` | GET/POST/etc | Added/Modified/Removed |

## ✅ Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] Security middleware is properly applied
- [ ] No secrets are hardcoded
- [ ] Database queries are parameterized (SQL injection safe)
- [ ] Rate limiting is considered

## 🔗 Related Issues

<!-- Link any related issues: Fixes #123 -->

---
*This PR was created following SecureHealthIMS HIPAA/GDPR compliance guidelines.*
