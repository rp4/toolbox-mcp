# Installation Notes

## ✅ Security Fix Applied

The SheetJS (xlsx) dependency has been updated to version **0.20.3** in both:
- `apps/web-ui/package.json`
- `packages/adapters/package.json`

This addresses the **high severity ReDoS vulnerability** (GHSA-5pgg-2g8v-p4x9) present in versions < 0.20.2.

## First-Time Installation

When you run the installation for the first time:

```bash
# 1. Install root dependencies
npm install

# 2. Install schemas package
cd packages/schemas
npm install
cd ../..

# 3. Install adapters package (will install xlsx 0.20.3)
cd packages/adapters
npm install
cd ../..

# 4. Install web-ui package (will install xlsx 0.20.3)
cd apps/web-ui
npm install
cd ../..
```

## Verify Security Fix

After installation, verify no vulnerabilities:

```bash
npm audit
```

You should see:
```
found 0 vulnerabilities
```

If you still see the vulnerability, delete `node_modules` and `package-lock.json` files and reinstall:

```bash
# Remove old installations
rm -rf node_modules package-lock.json
rm -rf apps/web-ui/node_modules apps/web-ui/package-lock.json
rm -rf packages/schemas/node_modules packages/schemas/package-lock.json
rm -rf packages/adapters/node_modules packages/adapters/package-lock.json

# Reinstall everything
npm install
cd packages/schemas && npm install && cd ../..
cd packages/adapters && npm install && cd ../..
cd apps/web-ui && npm install && cd ../..

# Verify
npm audit
```

## What Was Fixed

**Vulnerability**: SheetJS Regular Expression Denial of Service (ReDoS)
- **CVE**: GHSA-5pgg-2g8v-p4x9
- **Severity**: High (CVSS 7.5)
- **Affected**: xlsx versions < 0.20.2
- **Fixed in**: xlsx 0.20.3

**Impact**: A maliciously crafted Excel file could cause excessive CPU usage through ReDoS attack.

**Mitigation**: Upgraded to xlsx 0.20.3 which includes the fix for this vulnerability.

## Dependencies Overview

### xlsx Package Location

The xlsx package is used in two places:
1. **`packages/adapters`** - For server-side file processing utilities
2. **`apps/web-ui`** - For client-side Excel file handling

Both are now configured to use:
```json
"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"
```

### Why We Use Direct CDN Links

SheetJS recommends using their CDN for the latest stable versions:
- More reliable than npm registry
- Faster updates for security patches
- Specific version pinning

## Monitoring for Future Vulnerabilities

Set up automated security checks:

### Option 1: GitHub Dependabot
Already works if you push to GitHub - it will alert you to new vulnerabilities.

### Option 2: npm audit (Manual)
Run periodically:
```bash
npm audit
```

### Option 3: Snyk
```bash
npm install -g snyk
snyk test
```

## Updating SheetJS in the Future

When a new version is released:

1. Check the SheetJS CDN: https://cdn.sheetjs.com/
2. Look for the latest version (e.g., `xlsx-0.20.4`)
3. Update both package.json files:
   ```bash
   # Edit apps/web-ui/package.json
   "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.4/xlsx-0.20.4.tgz"

   # Edit packages/adapters/package.json
   "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.4/xlsx-0.20.4.tgz"
   ```
4. Reinstall dependencies
5. Test thoroughly
6. Run `npm audit` to verify

## Additional Security

See [SECURITY.md](SECURITY.md) for comprehensive security information including:
- Content Security Policy configuration
- iframe security headers
- Client-side processing architecture
- Privacy guarantees
- Regular maintenance tasks

## Support

If you encounter issues with the installation or security fixes:
1. Check [BUILD.md](BUILD.md) for troubleshooting
2. Review [SECURITY.md](SECURITY.md) for security-specific issues
3. Verify you're using Node.js 18+ (check with `node --version`)
