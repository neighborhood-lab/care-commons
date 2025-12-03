# Folk.care Rebrand - GitHub Issues

## Issue 1: Configure folk.care domain in Vercel
**Labels**: rebrand, infrastructure, priority-high

### Summary
Configure the new folk.care domain as the production domain in Vercel.

### Tasks
- [ ] Add folk.care as a custom domain in Vercel project settings
- [ ] Configure DNS records at domain registrar (Namecheap)
- [ ] Verify domain ownership in Vercel
- [ ] Set folk.care as primary production domain
- [ ] Configure SSL/TLS certificate (automatic via Vercel)

### DNS Records Required
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

---

## Issue 2: Rename npm packages from @folkcare to @folkcare
**Labels**: rebrand, breaking-change, priority-high

### Summary
Rename all npm package scopes from `@folkcare` to `@folkcare`.

### Files to Update (20 package.json files)
- Root `package.json`: `@folkcare/platform` → `@folkcare/platform`
- `packages/core/package.json`: `@folkcare/core` → `@folkcare/core`
- `packages/app/package.json`: `@folkcare/app` → `@folkcare/app`
- `packages/web/package.json`: `@folkcare/web` → `@folkcare/web`
- `packages/mobile/package.json`: `@folkcare/mobile` → `@folkcare/mobile`
- `packages/shared-components/package.json`: `@folkcare/shared-components` → `@folkcare/shared-components`
- All 14 verticals package.json files

### Import Statement Updates
After renaming packages, update all import statements:
```typescript
// Before
import { something } from '@folkcare/core';

// After  
import { something } from '@folkcare/core';
```

---

## Issue 3: Update branding text and descriptions
**Labels**: rebrand, documentation

### Summary
Update all user-facing text from "Folk" to "Folk" or "Folk.care".

### Files with High Occurrence Count
1. `packages/core/src/service/email-service.ts` (47 occurrences)
2. `README.md` (28 occurrences)
3. `docs/FAQ.md` (23 occurrences)
4. `docs/marketing/social-media-launch-posts.md` (23 occurrences)
5. `packages/core/scripts/seed-demo.ts` (22 occurrences)
6. `CLAUDE.md` (19 occurrences)
7. `AGENTS.md` (mentions)
8. All documentation in `docs/` folder

### Brand Guidelines
- Product name: **Folk** or **Folk.care**
- Tagline: "Software for the people who care"
- Legal entity: TBD (may remain Neighborhood Lab initially)

---

## Issue 4: Update GitHub repository name
**Labels**: rebrand, infrastructure, HUMAN

### Summary
Rename the GitHub repository from `folkcare` to `folkcare` (or `folk.care`).

### Tasks
- [ ] Rename repository in GitHub settings
- [ ] Update all GitHub URLs in documentation
- [ ] Update GitHub Pages URL references
- [ ] Update CI/CD workflow references
- [ ] Notify team of new repository URL

### URLs to Update
- `folk.care/` → `folk.care/`
- All `github.com/neighborhood-lab/folkcare` references

---

## Issue 5: Update showcase/demo branding
**Labels**: rebrand, frontend

### Summary
Update the showcase application branding.

### Files to Update
- `showcase/src/data/seed-data.ts`
- `showcase/src/data/enhanced-seed-data.ts`
- `showcase/src/pages/*.tsx` (multiple pages)
- `showcase/index.html`
- Any logo/brand assets in `showcase/public/`

### Visual Updates
- Logo (if exists)
- Page titles
- Footer text
- About/Why pages

---

## Issue 6: Update email templates and notifications
**Labels**: rebrand, backend

### Summary
Update email service branding.

### Files to Update
- `packages/core/src/service/email-service.ts` (47 occurrences!)
- Email templates (if separate files)
- Notification text

### Changes
- Sender name: "Folk.care" or "Folk"
- Email domain: Consider `@folk.care` for transactional emails
- Template headers/footers
- Support email references

---

## Issue 7: Update demo/seed data
**Labels**: rebrand, data

### Summary
Update demo data to reflect Folk.care branding.

### Files to Update
- `packages/core/scripts/seed-demo.ts`
- `packages/core/migrations/20251121000000_seed_base_data.ts`
- Demo organization names
- Demo email addresses (`@folkcare.example` → `@folk.care` or `@folkcare.example`)

---

## Issue 8: Update mobile app branding
**Labels**: rebrand, mobile

### Summary
Update React Native mobile app branding.

### Files to Update
- `packages/mobile/app.json` (app name, slug)
- `packages/mobile/src/screens/profile/ProfileScreen.tsx`
- `packages/mobile/README.md`
- App icon and splash screen (if branded)

---

## Issue 9: Update API documentation
**Labels**: rebrand, documentation

### Summary
Update OpenAPI spec and Postman collection.

### Files to Update
- `docs/openapi.json`
- `docs/postman-collection.json`
- `docs/API_DOCUMENTATION.md`
- `docs/API_QUICK_START.md`
- `packages/app/src/config/openapi.config.ts`

---

## Issue 10: Update configuration files
**Labels**: rebrand, infrastructure

### Summary
Update various configuration files with new branding.

### Files to Update
- `wrangler.toml` (Cloudflare worker name)
- `docker-compose.yml` (service names, labels)
- `.env.example` (example URLs)
- `.pages.toml` (if GitHub Pages config)

---

## Issue 11: Update AGENTS.md and CLAUDE.md
**Labels**: rebrand, documentation, priority-high

### Summary
Update agent instruction files with new branding.

### Files to Update
- `AGENTS.md` - Update all Folk references
- `CLAUDE.md` - Update all Folk references

---

## Issue 12: Update compliance documentation
**Labels**: rebrand, documentation, compliance

### Summary
Update compliance documentation with new branding.

### Files to Update
- `docs/compliance/README.md`
- `docs/compliance/index.md`
- State-specific documentation

---

## Issue 13: Create brand assets for Folk.care
**Labels**: rebrand, design, HUMAN

### Summary
Create visual brand assets for Folk.care.

### Assets Needed
- [ ] Logo (primary)
- [ ] Logo (icon/favicon)
- [ ] Color palette
- [ ] Typography guidelines
- [ ] Social media assets

---

## Issue 14: Update social media and external references
**Labels**: rebrand, marketing, HUMAN

### Summary
Update external presence.

### Tasks
- [ ] Update social media profiles
- [ ] Update any external documentation/links
- [ ] Update Substack/newsletter branding
- [ ] Update any third-party integrations

---

## Execution Order

1. **Issue 1**: Configure folk.care domain in Vercel (HUMAN - DNS)
2. **Issue 2**: Rename npm packages (can cause breaking builds)
3. **Issue 11**: Update AGENTS.md/CLAUDE.md (for agent context)
4. **Issue 3**: Update branding text
5. **Issue 5**: Update showcase
6. **Issue 6**: Update email service
7. **Issue 7**: Update demo data
8. **Issue 8**: Update mobile app
9. **Issue 9**: Update API docs
10. **Issue 10**: Update config files
11. **Issue 4**: Rename GitHub repo (HUMAN - requires owner)
12. **Issue 12**: Update compliance docs
13. **Issue 13**: Brand assets (HUMAN - design)
14. **Issue 14**: External references (HUMAN - marketing)
