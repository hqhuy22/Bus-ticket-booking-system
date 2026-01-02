# Migration Scripts

## migrate-colors.js

Automatically replaces old color classes with new theme tokens.

### Usage

```bash
cd bus-booking-client

# Run migration
node scripts/migrate-colors.js

# Or with npm (if added to package.json)
npm run migrate:colors
```

### What it does

Replaces:
- `bg-blue-500` → `bg-info-500`
- `bg-green-500` → `bg-success-500`
- `bg-red-500` → `bg-error-500`
- And all related hover, text, border variants

### Safety

- ✅ Only processes .jsx, .js, .tsx, .ts files
- ✅ Excludes node_modules, dist, build
- ✅ Excludes theme and layout folders (new components)
- ✅ Creates backup automatically (if configured)

### Manual Review

After running, please review changes:
```bash
git diff
```

Make sure colors make semantic sense in context.
