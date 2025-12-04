# GitHub Pages Setup with Custom Domains

This document explains the GitHub Pages deployment setup for Folk Care's showcase and marketing sites.

## Overview

We use GitHub Pages to host two static sites with custom domains:

| Site | Custom Domain | GitHub Pages URL | Content |
|------|---------------|------------------|---------|
| **Showcase** | showcase.folk.care | neighborhood-lab.github.io/folk-care | Interactive demo with localStorage |
| **About** | about.folk.care | neighborhood-lab.github.io/folk-care | Marketing/product information |

## DNS Configuration

### Required DNS Records

Add these CNAME records to your DNS provider (e.g., Cloudflare, Route53):

```
showcase.folk.care  CNAME  neighborhood-lab.github.io.
about.folk.care     CNAME  neighborhood-lab.github.io.
```

**Important**: Include the trailing dot (`.`) in the target value for proper DNS resolution.

### DNS Provider Setup Examples

#### Cloudflare
1. Log in to Cloudflare dashboard
2. Select your domain (`folk.care`)
3. Go to DNS → Records
4. Add CNAME records:
   - **Name**: `showcase`
   - **Target**: `neighborhood-lab.github.io`
   - **Proxy status**: DNS only (gray cloud)
   - Repeat for `about` subdomain

#### AWS Route 53
1. Go to Route 53 → Hosted zones
2. Select `folk.care`
3. Create CNAME records:
   ```
   showcase.folk.care → neighborhood-lab.github.io
   about.folk.care → neighborhood-lab.github.io
   ```

## GitHub Repository Settings

### Pages Configuration

**IMPORTANT**: GitHub Pages can only serve from ONE location per repository. Since we have two sites (showcase and about), we need to choose which workflow handles deployment:

#### Option 1: Deploy Showcase (Current Setup)
The `deploy-showcase.yml` workflow is active and deploys the showcase to the repository's GitHub Pages.

#### Option 2: Deploy About Site
The `deploy-about.yml` workflow is active and deploys the about site to the repository's GitHub Pages.

**Problem**: GitHub Pages can't serve both simultaneously from the same repository.

**Solution**: Use separate repositories or a build process that combines both sites.

### Recommended Approach

**Multi-Site Deployment** (requires changes):

Create a build process that:
1. Builds showcase to `dist/showcase/`
2. Builds about site to `dist/about/`
3. Deploys both with a reverse proxy configuration

OR

**Separate Repositories** (easier):

1. Create `folk-care-showcase` repository
   - Deploys to `showcase.folk.care`
   - Uses `deploy-showcase.yml` workflow

2. Create `folk-care-about` repository
   - Deploys to `about.folk.care`
   - Uses `deploy-about.yml` workflow

## Current Implementation

### Showcase Build Configuration

**File**: `showcase/vite.config.ts`
```typescript
base: '/', // Root path for custom domain
```

**CNAME**: `showcase/public/CNAME`
```
showcase.folk.care
```

### About Site Build Configuration

**File**: `about/vite.config.ts`
```typescript
base: '/', // Root path for custom domain
```

**CNAME**: `about/public/CNAME`
```
about.folk.care
```

## Deployment Workflows

### Showcase Deployment

**Workflow**: `.github/workflows/deploy-showcase.yml`

**Triggers**:
- Push to `develop` branch (paths: `showcase/**`, `packages/shared-components/**`)
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Install dependencies (`npm ci`)
3. Build showcase (`npm run build --workspace=@folkcare/showcase`)
4. Upload to GitHub Pages artifact
5. Deploy to Pages

### About Site Deployment

**Workflow**: `.github/workflows/deploy-about.yml`

**Triggers**:
- Push to `develop` branch (paths: `about/**`)
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Install dependencies (in `about/` directory)
3. Build about site
4. Upload to GitHub Pages artifact
5. Deploy to Pages

## Manual Deployment

### Deploy Showcase

```bash
# Build locally
cd showcase
npm run build

# Deploy manually (requires gh CLI and Pages access)
# Note: This is handled automatically by GitHub Actions
```

### Deploy About Site

```bash
# Build locally
cd about
npm run build

# Deploy manually (requires gh CLI and Pages access)
# Note: This is handled automatically by GitHub Actions
```

## Troubleshooting

### CNAME File Missing

**Problem**: Custom domain not working, getting 404s.

**Solution**: Ensure `public/CNAME` file exists and contains the correct domain.

```bash
echo "showcase.folk.care" > showcase/public/CNAME
```

### Base URL Issues

**Problem**: Assets loading from wrong path (404 errors).

**Solution**: Set `base: '/'` in `vite.config.ts` for custom domains.

### GitHub Pages Not Enabled

**Problem**: Pages deployment fails.

**Solution**:
1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. Wait for deployment to complete

### DNS Not Resolving

**Problem**: Domain doesn't resolve to GitHub Pages.

**Solution**:
1. Verify CNAME record exists: `dig showcase.folk.care`
2. Wait for DNS propagation (up to 48 hours)
3. Check DNS provider for typos

### Multiple Sites Conflict

**Problem**: Only one site deploys correctly.

**Solution**: Choose one of these approaches:
1. Use separate repositories for each site
2. Build both sites to different subdirectories
3. Use a static file host that supports multiple custom domains

## Testing

### Local Testing

```bash
# Showcase
cd showcase
npm run dev
# Open http://localhost:5173

# About
cd about
npm run dev
# Open http://localhost:5173
```

### Production Testing

After deployment:

```bash
# Check DNS resolution
dig showcase.folk.care
dig about.folk.care

# Test HTTPS (may take a few minutes after first deployment)
curl -I https://showcase.folk.care
curl -I https://about.folk.care
```

## Security & HTTPS

GitHub Pages automatically provisions SSL certificates for custom domains via Let's Encrypt. This process takes a few minutes after:

1. DNS records are configured
2. First successful deployment
3. CNAME file is in place

**HTTPS Enforcement**: Enable in repository Settings → Pages → Enforce HTTPS

## Maintenance

### Updating Showcase

1. Make changes in `showcase/` directory
2. Commit and push to `develop`
3. GitHub Actions automatically builds and deploys

### Updating About Site

1. Make changes in `about/` directory
2. Commit and push to `develop`
3. GitHub Actions automatically builds and deploys

## References

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
- [Vite Base URL Configuration](https://vitejs.dev/guide/build.html#public-base-path)

---

**Last Updated**: December 3, 2025
**Maintained By**: Tove Bot (Claude Code)
