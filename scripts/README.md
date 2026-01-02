# Helper scripts for deployment

## Pre-deployment check script

Chạy script này để kiểm tra ứng dụng trước khi deploy:

```powershell
node scripts/pre-deploy-check.mjs
```

Script sẽ kiểm tra:
- ✅ Environment files
- ✅ Package.json configuration
- ✅ Docker files
- ✅ Deployment configs
- ✅ GitHub Actions workflows
- ✅ .gitignore
- ✅ Security (hardcoded secrets)
- ✅ Build process (optional)
- ✅ Tests (optional)

## Usage

```powershell
# Run full check
node scripts/pre-deploy-check.mjs

# If you get permission error, use:
node --experimental-modules scripts/pre-deploy-check.mjs
```

## Exit codes

- `0`: Ready for deployment
- `1`: Has errors, fix before deploying
