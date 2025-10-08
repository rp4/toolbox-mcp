# Security

## Dependency Management

### SheetJS (xlsx) Version

We use SheetJS version **0.20.3** to address the ReDoS vulnerability (CVE GHSA-5pgg-2g8v-p4x9) present in versions < 0.20.2.

**Vulnerability Details:**
- **Type**: Regular Expression Denial of Service (ReDoS)
- **Severity**: High (CVSS 7.5)
- **CWE**: CWE-1333
- **Affected versions**: < 0.20.2
- **Fixed in**: 0.20.2+

Both `apps/web-ui/package.json` and `packages/adapters/package.json` specify:
```json
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

### Checking for Vulnerabilities

```bash
# Run npm audit from project root
npm audit

# Run audit for specific package
cd apps/web-ui
npm audit

cd packages/adapters
npm audit
```

### Updating Dependencies

When updating the xlsx package in the future:

1. Check the [SheetJS CDN](https://cdn.sheetjs.com/) for the latest version
2. Update both package.json files:
   - `apps/web-ui/package.json`
   - `packages/adapters/package.json`
3. Run `npm install` to update lockfiles
4. Test thoroughly before deploying

## Security Best Practices

### Client-Side Processing

This application processes all data **client-side** in the browser:
- ✅ No server-side file uploads
- ✅ No data persistence
- ✅ No external API calls (except loading from own CDN)
- ✅ Files never leave the user's machine

### iframe Security

The Next.js app is configured with proper security headers in `next.config.js`:

```javascript
{
  key: 'X-Frame-Options',
  value: 'ALLOWALL',
},
{
  key: 'Content-Security-Policy',
  value: "frame-ancestors 'self' https://*.openai.com https://*.chatgpt.com",
}
```

This allows embedding only from:
- Same origin (for testing)
- OpenAI/ChatGPT domains

### Content Security Policy

Recommended CSP for production:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'self' https://*.openai.com https://*.chatgpt.com;
worker-src 'self' blob:;
```

Note: `unsafe-inline` and `unsafe-eval` are required for:
- Three.js dynamic shader compilation
- React development mode
- Dynamic component loading

### Data Privacy

1. **No Tracking**: No analytics or tracking scripts
2. **No Telemetry**: No error reporting to external services
3. **No Storage**: No localStorage, sessionStorage, or IndexedDB usage
4. **No Cookies**: No cookies set by the application

### File Upload Security

When integrating with ChatGPT:

1. **Validate file types**: Check MIME types before processing
2. **Size limits**: Consider implementing max file size checks
3. **Sanitization**: All user inputs are validated with Zod schemas
4. **No execution**: Files are parsed, never executed

### Dependencies

All dependencies are specified with exact versions or version ranges:
- Using `^` for semantic versioning (minor updates allowed)
- Direct CDN links for SheetJS (specific version)
- Regular audit checks recommended

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to: [your-email@domain.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Checklist for Deployment

Before deploying to production:

- [ ] Run `npm audit` and address all high/critical vulnerabilities
- [ ] Enable HTTPS (required for iframe embedding)
- [ ] Configure CSP headers properly
- [ ] Test with malicious file inputs (large files, malformed data)
- [ ] Review all dependencies for known issues
- [ ] Set up dependency update alerts (GitHub Dependabot, Snyk, etc.)
- [ ] Test iframe embedding only works from allowed origins
- [ ] Verify no data is transmitted to external services
- [ ] Check browser console for security warnings

## Regular Maintenance

### Monthly Tasks
- Run `npm audit` across all packages
- Check for dependency updates
- Review security advisories

### Quarterly Tasks
- Update all dependencies to latest stable versions
- Review and update CSP headers
- Security audit of custom code
- Penetration testing (if applicable)

## References

- [SheetJS Security Advisories](https://github.com/SheetJS/sheetjs/security/advisories)
- [OWASP Client-Side Security](https://owasp.org/www-project-web-security-testing-guide/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
