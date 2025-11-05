# Quick Database Reference

## 🚀 Quick Start

### Initialize Preview Database (Staging)
```bash
./scripts/db-env.sh reset:demo --env=preview
```

### Initialize Production Database
```bash
./scripts/db-env.sh reset --env=production
```

### Local Development (Default)
```bash
npm run db:reset:demo
```

---

## 📋 Common Commands

| What I Want | Command |
|-------------|---------|
| **Setup preview with demo data** | `./scripts/db-env.sh reset:demo --env=preview` |
| **Setup production (minimal)** | `./scripts/db-env.sh reset --env=production` |
| **Update preview schema** | `./scripts/db-env.sh migrate --env=preview` |
| **Update production schema** | `./scripts/db-env.sh migrate --env=production` |
| **Reset local dev** | `npm run db:reset:demo` |
| **Migrate local dev** | `npm run db:migrate` |

---

## 🗂️ Environment Files

- `.env` - Local development (default)
- `.env.preview` - Neon staging database
- `.env.production` - Neon production database

**All files are gitignored** - credentials stay local!

---

## 🔐 Login After Seeding

- **Email**: `admin@carecommons.example`
- **Password**: `Admin123!`

---

## ⚠️ Important Notes

- Production commands require typing `YES` to confirm
- Use `reset:demo` for preview/staging (includes test data)
- Use `reset` or `migrate` for production (no demo data)
- Local dev doesn't need `--env` flag (it's the default)

---

**Full documentation**: See `DATABASE_ENVIRONMENTS.md`
