# Deploying Mobile App to GitHub Pages

This guide explains how to deploy the React Native mobile app as a web application to GitHub Pages for use in the showcase demo.

## Prerequisites

- GitHub repository with Pages enabled
- Node.js 22.x installed
- All dependencies installed (`npm ci` from root)

## Step 1: Fix styleq Dependency Issue

The mobile app currently has a version conflict with `styleq`. Before exporting, ensure dependencies are aligned:

```bash
cd packages/mobile
npm install styleq@latest
npm install react-native-reanimated@~4.1.1
npm install sentry-expo@~7.0.0
```

## Step 2: Export Web Build

```bash
cd packages/mobile
npx expo export --platform web
```

This creates a `dist` directory with the web build.

## Step 3: Deploy to GitHub Pages

### Option A: Manual Deployment

1. Create a new repository: `care-commons-mobile-demo`
2. Enable GitHub Pages in Settings → Pages
3. Copy `dist/` contents to the repository
4. Push to the `gh-pages` branch:

```bash
cd dist
git init
git add .
git commit -m "Deploy mobile web app"
git branch -M gh-pages
git remote add origin git@github.com:neighborhood-lab/care-commons-mobile-demo.git
git push -u origin gh-pages --force
```

5. Your app will be available at:
   `https://neighborhood-lab.github.io/care-commons-mobile-demo`

### Option B: Automated GitHub Actions

Create `.github/workflows/deploy-mobile-web.yml`:

```yaml
name: Deploy Mobile Web to GitHub Pages

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths: ['packages/mobile/**']

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      
      - run: npm ci
      
      - name: Export web build
        run: |
          cd packages/mobile
          npx expo export --platform web --output-dir ../../dist-mobile
        env:
          NODE_ENV: production
      
      - uses: actions/configure-pages@v4
      
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist-mobile'
      
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

## Step 4: Update Showcase

Set the environment variable in showcase deployment:

### Vercel

Add environment variable:
- Key: `VITE_MOBILE_APP_URL`
- Value: `https://neighborhood-lab.github.io/care-commons-mobile-demo`

### Local Development

Create `showcase/.env.local`:
```
VITE_MOBILE_APP_URL=https://neighborhood-lab.github.io/care-commons-mobile-demo
```

Or keep the default `http://localhost:8081` for local development.

## Step 5: Test

1. Visit the showcase: `https://care-commons.vercel.app/care-commons/mobile`
2. The mobile simulator should load the deployed app
3. Verify all features work (navigation, UI, etc.)

## Limitations of Expo Web

- ❌ No native modules (camera, GPS, biometric)
- ❌ No offline storage (WatermelonDB)
- ❌ Different performance characteristics
- ✅ Good for UI/UX demonstration
- ✅ Works in iframe for showcase

## Troubleshooting

### Build fails with module resolution errors

Update `package.json` dependencies to match Expo SDK version:
```bash
npx expo install --fix
```

### App doesn't load in iframe

Check browser console for CORS or CSP errors. GitHub Pages should allow iframe embedding by default.

### Blank screen after deployment

Verify the build output includes:
- `index.html`
- `_expo/static/js/web/` directory
- Asset bundles

## Maintenance

Redeploy whenever the mobile app code changes:
```bash
cd packages/mobile
npx expo export --platform web
# Then push to gh-pages branch
```

Consider automating with GitHub Actions (Option B above).
