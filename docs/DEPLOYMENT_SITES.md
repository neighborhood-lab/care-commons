# Deployment: Showcase & About Sites

## Overview

Folk Care uses a **mixed hosting strategy** for optimal performance:

| Site | Host | Custom Domain | Deploy Method |
|------|------|---------------|---------------|
| **Showcase** | GitHub Pages | showcase.folk.care | GitHub Actions (auto on push to develop) |
| **About** | Vercel | about.folk.care | Vercel CLI or dashboard |

## Why Mixed Hosting?

- **GitHub Pages** is perfect for the showcase (static React SPA with localStorage)
- **Vercel** is ideal for the about site (simple HTML, instant deploys, easy custom domains)
- Both stay in the **same repository**
- No need for separate repos or complex build processes

---

## Showcase Deployment (GitHub Pages)

### Automatic Deployment

Pushes to `develop` branch automatically trigger deployment via `.github/workflows/deploy-showcase.yml`

### DNS Configuration

Add CNAME record:
```
showcase.folk.care  CNAME  neighborhood-lab.github.io.
```

### Manual Deployment

```bash
cd showcase
npm run build
# Artifact uploaded by GitHub Actions
```

### GitHub Pages Setup

1. Go to repository **Settings → Pages**
2. Source: **GitHub Actions**
3. Wait for first deployment to complete
4. SSL certificate auto-provisions (~5 minutes)

---

## About Site Deployment (Vercel)

### Automatic Deployment via GitHub Integration

The about site **automatically deploys** to Vercel when you push to `develop` branch.

**One-Time Setup:**

1. **Connect GitHub Repository to Vercel:**
   - Visit [Vercel Dashboard](https://vercel.com/new)
   - Import `neighborhood-lab/folk-care` repository
   - Configure project settings:
     - **Root Directory:** `about`
     - **Framework Preset:** Other
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`
   - Set **Production Branch:** `develop`
   - Deploy

2. **Configure Custom Domain via CLI:**

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to project
cd about
vercel link
# Choose: neighborhood-lab/folk-care

# Add custom domain
vercel domains add about.folk.care

# Check domain status
vercel domains ls
```

3. **Configure DNS CNAME Record:**

Vercel will provide the CNAME target (usually `cname.vercel-dns.com`):

```
about.folk.care  CNAME  cname.vercel-dns.com.
```

Add this record to your DNS provider (Cloudflare, Route53, etc.).

**Verify domain:**
```bash
vercel domains inspect about.folk.care
```

### Deployment Workflow

**Automatic (No Manual Steps Needed):**
- Push to `develop` → Vercel auto-deploys to production
- Open PR → Vercel creates preview deployment
- Merge PR → Production deployment updates

**Manual deployment (NOT recommended):**
```bash
cd about
vercel --prod
```

---

## Vercel Configuration

**File:** `about/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": null,
  "regions": ["iad1"]
}
```

**Region:** `iad1` (US East - closest to target audience)

---

## Testing Both Sites

### Local Testing

**Showcase:**
```bash
cd showcase
npm run dev
# http://localhost:5173
```

**About:**
```bash
cd about  
npm run dev
# http://localhost:5173
```

### Production Testing

```bash
# Check DNS
dig showcase.folk.care
dig about.folk.care

# Test HTTPS
curl -I https://showcase.folk.care
curl -I https://about.folk.care
```

---

## Troubleshooting

### Showcase (GitHub Pages)

**Problem:** 404 errors on assets

**Solution:**
- Check `showcase/vite.config.ts` has `base: '/'`
- Verify `showcase/public/CNAME` contains `showcase.folk.care`
- Check GitHub Pages is enabled (Settings → Pages)

**Problem:** Custom domain not working

**Solution:**
- Verify DNS CNAME record: `dig showcase.folk.care`
- Wait for DNS propagation (up to 48 hours)
- Check CNAME file exists in built artifact

### About Site (Vercel)

**Problem:** Domain not connecting

**Solution:**
- Verify domain in Vercel dashboard (Settings → Domains)
- Check DNS CNAME points to Vercel target
- Use `vercel domains inspect about.folk.care` to check status

**Problem:** Build fails

**Solution:**
```bash
# Test build locally
cd about
npm run build

# Check Vercel logs
vercel logs <deployment-url>
```

---

## Deployment Workflow

### Showcase Updates

1. Make changes in `showcase/` directory
2. Commit and push to `develop`
3. GitHub Actions automatically builds and deploys
4. Site live at https://showcase.folk.care within 2-3 minutes

### About Site Updates

**Automatic deployment (after one-time Vercel setup):**

1. Make changes in `about/` directory
2. Commit and push to `develop`
3. Vercel automatically deploys to production
4. Site live at https://about.folk.care within 1-2 minutes

**No manual deployment needed!** Vercel Git integration handles everything.

---

## Marketing Assets

Both sites use images from `marketing/` folder:

```
marketing/
├── logo-1.png           # Primary logo
├── logo-2.png           # Logo variant (used in about site)
├── header-1.png         # Hero background option 1
├── header-2.png         # Hero background (used in about site)
├── background-1.png     # Background texture option 1
├── background-2.png     # Background texture option 2
├── social-preview-1.png # Open Graph image (used)
└── social-preview-2.png # Social preview variant
```

Images are copied to:
- `about/public/images/` (for about site)
- `showcase/public/images/` (if needed for showcase)

---

## SSL Certificates

Both hosting providers auto-provision SSL certificates:

- **GitHub Pages:** Let's Encrypt (auto-renews)
- **Vercel:** Let's Encrypt (auto-renews)

Force HTTPS:
- **GitHub Pages:** Settings → Pages → Enforce HTTPS ✓
- **Vercel:** Automatic (always enforced)

---

## Monitoring

### GitHub Pages

Check deployment status:
```bash
gh run list --workflow=deploy-showcase.yml
```

### Vercel

Check deployments:
```bash
vercel ls
```

View logs:
```bash
vercel logs <deployment-url>
```

---

## Cost

- **GitHub Pages:** Free (for public repos)
- **Vercel:** Free tier includes:
  - Unlimited deployments
  - Custom domains
  - SSL certificates
  - 100 GB bandwidth/month
  - Automatic edge caching

---

**Last Updated:** December 3, 2025  
**Deployment Strategy:** Mixed hosting (GitHub Pages + Vercel)
