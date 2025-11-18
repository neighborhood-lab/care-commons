# Stripe Setup Guide for Care Commons

**Account ID**: `acct_1RuzGq0twRCD0Nl9`  
**Dashboard**: https://dashboard.stripe.com/acct_1RuzGq0twRCD0Nl9/workbench/overview

---

## Step 1: Get Stripe API Keys

### Test Mode Keys (for Preview Environment)

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy the following keys:

   **Publishable Key** (starts with `pk_test_`):
   ```
   pk_test_xxxxxxxxxxxxxxxxxxxxx
   ```
   *(Not needed for backend, but useful for future frontend integration)*

   **Secret Key** (starts with `sk_test_`):
   ```
   sk_test_xxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **CRITICAL**: Keep this secret! This goes in GitHub Secrets.

### Live Mode Keys (for Production Environment)

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy the following keys:

   **Publishable Key** (starts with `pk_live_`):
   ```
   pk_live_xxxxxxxxxxxxxxxxxxxxx
   ```

   **Secret Key** (starts with `sk_live_`):
   ```
   sk_live_xxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **CRITICAL**: Keep this secret! This goes in GitHub Secrets.

---

## Step 2: Configure Webhook Endpoints

### Test Mode Webhook (for Preview)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Configure:
   ```
   Endpoint URL: https://care-commons-git-preview-neighborhood-lab.vercel.app/api/webhooks/stripe
   Description: Care Commons Preview Webhook
   Events to send: Select all in "Customer" and "Subscription" categories
   ```
   
   **Specific Events**:
   - `customer.created`
   - `customer.updated`
   - `customer.deleted`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`

4. Click **"Add endpoint"**
5. Copy the **Signing secret** (starts with `whsec_`):
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

### Production Webhook (for Production)

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Configure:
   ```
   Endpoint URL: https://care-commons.vercel.app/api/webhooks/stripe
   Description: Care Commons Production Webhook
   Events to send: Select all in "Customer" and "Subscription" categories
   ```
   
   **Specific Events**: Same as test mode

4. Click **"Add endpoint"**
5. Copy the **Signing secret** (starts with `whsec_`):
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## Step 3: Add Secrets to GitHub

### Add Test Mode Secrets (for Preview)

```bash
# Navigate to repository
cd /Users/bedwards/care-commons-0

# Add Stripe test secret key
gh secret set PREVIEW_STRIPE_SECRET_KEY --body "sk_test_xxxxxxxxxxxxxxxxxxxxx"

# Add Stripe test webhook secret
gh secret set PREVIEW_STRIPE_WEBHOOK_SECRET --body "whsec_xxxxxxxxxxxxxxxxxxxxx"
```

### Add Production Secrets

```bash
# Add Stripe live secret key
gh secret set STRIPE_SECRET_KEY --body "sk_live_xxxxxxxxxxxxxxxxxxxxx"

# Add Stripe live webhook secret
gh secret set STRIPE_WEBHOOK_SECRET --body "whsec_xxxxxxxxxxxxxxxxxxxxx"
```

### Verify Secrets Were Added

```bash
gh secret list
```

You should see:
```
PREVIEW_STRIPE_SECRET_KEY       Updated XXXX-XX-XX
PREVIEW_STRIPE_WEBHOOK_SECRET   Updated XXXX-XX-XX
STRIPE_SECRET_KEY               Updated XXXX-XX-XX
STRIPE_WEBHOOK_SECRET           Updated XXXX-XX-XX
```

---

## Step 4: Update Deploy Workflow to Use Stripe Secrets

The deploy workflow needs to pass Stripe environment variables to Vercel.

**File**: `.github/workflows/deploy.yml`

### For Preview Deployment (line ~206)

```yaml
- name: Deploy to Vercel Preview
  id: deploy
  run: |
    DEPLOYMENT_URL=$(vercel deploy \
      --token=${{ secrets.VERCEL_TOKEN }} \
      --env DATABASE_URL="${{ secrets.PREVIEW_DATABASE_URL }}" \
      --env STRIPE_SECRET_KEY="${{ secrets.PREVIEW_STRIPE_SECRET_KEY }}" \
      --env STRIPE_WEBHOOK_SECRET="${{ secrets.PREVIEW_STRIPE_WEBHOOK_SECRET }}" \
      --env ENVIRONMENT="preview")
    echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT
    echo "✅ Preview deployment complete: $DEPLOYMENT_URL"
  env:
    ENVIRONMENT: preview
```

### For Production Deployment (line ~398)

```yaml
- name: Deploy to Vercel Production
  id: deploy
  run: |
    DEPLOYMENT_URL=$(vercel deploy --prod \
      --token=${{ secrets.VERCEL_TOKEN }} \
      --env DATABASE_URL="${{ secrets.DATABASE_URL }}" \
      --env STRIPE_SECRET_KEY="${{ secrets.STRIPE_SECRET_KEY }}" \
      --env STRIPE_WEBHOOK_SECRET="${{ secrets.STRIPE_WEBHOOK_SECRET }}" \
      --env ENVIRONMENT="production")
    echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT
    echo "✅ Production deployment complete: $DEPLOYMENT_URL"
  env:
    ENVIRONMENT: production
```

---

## Step 5: Resend Email Service Setup

### Get Resend API Key

1. Go to: https://resend.com/api-keys
2. Click **"Create API Key"**
3. Configure:
   ```
   Name: Care Commons
   Permission: Full Access
   Domain: resend.com (or your custom domain)
   ```
4. Copy the API key (starts with `re_`):
   ```
   re_xxxxxxxxxxxxxxxxxxxxx
   ```

### Add Resend Secret to GitHub

```bash
# Add Resend API key (used for both preview and production)
gh secret set RESEND_API_KEY --body "re_xxxxxxxxxxxxxxxxxxxxx"
```

### Update Deploy Workflow for Resend

Add to both preview and production deploy steps:

```yaml
--env RESEND_API_KEY="${{ secrets.RESEND_API_KEY }}" \
```

---

## Step 6: Verify Configuration

### Check All Required Secrets

```bash
gh secret list
```

**Expected Output**:
```
CODECOV_TOKEN                   Updated XXXX-XX-XX
CORS_ORIGIN                     Updated XXXX-XX-XX
DATABASE_URL                    Updated XXXX-XX-XX
DISCORD_WEBHOOK_URL             Updated XXXX-XX-XX
JWT_SECRET                      Updated XXXX-XX-XX
PREVIEW_DATABASE_URL            Updated XXXX-XX-XX
PREVIEW_JWT_SECRET              Updated XXXX-XX-XX
PREVIEW_STRIPE_SECRET_KEY       Updated XXXX-XX-XX  ← NEW
PREVIEW_STRIPE_WEBHOOK_SECRET   Updated XXXX-XX-XX  ← NEW
RESEND_API_KEY                  Updated XXXX-XX-XX  ← NEW
SNYK_TOKEN                      Updated XXXX-XX-XX
STRIPE_SECRET_KEY               Updated XXXX-XX-XX  ← NEW
STRIPE_WEBHOOK_SECRET           Updated XXXX-XX-XX  ← NEW
VERCEL_ORG_ID                   Updated XXXX-XX-XX
VERCEL_PROJECT_ID               Updated XXXX-XX-XX
VERCEL_TOKEN                    Updated XXXX-XX-XX
```

---

## Step 7: Test Webhook Locally (Optional)

If you want to test webhooks before deployment:

### Install Stripe CLI

```bash
brew install stripe/stripe-cli/stripe
```

### Login to Stripe

```bash
stripe login
```

### Forward Webhooks to Local Server

```bash
# Start local development server
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret for local testing (starts with `whsec_`).

---

## Step 8: Create Stripe Products and Prices

### Create Products in Test Mode

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"Add product"**

**Free Plan**:
```
Name: Free Plan
Description: For small teams getting started
Pricing: $0/month
Payment type: Recurring
Billing period: Monthly
Price ID: (copy this after creation)
```

**Pro Plan**:
```
Name: Pro Plan
Description: For growing agencies
Pricing: $99/month
Payment type: Recurring
Billing period: Monthly
Price ID: (copy this after creation)
```

**Enterprise Plan**:
```
Name: Enterprise Plan
Description: For large organizations
Pricing: $499/month
Payment type: Recurring
Billing period: Monthly
Price ID: (copy this after creation)
```

### Add Price IDs to Environment Variables

Update `.env.example` with the price IDs:

```bash
# Stripe Subscription Plans (Test Mode)
STRIPE_PRICE_FREE=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxx
```

Add these to GitHub Secrets as well:

```bash
gh secret set STRIPE_PRICE_FREE --body "price_xxxxxxxxxxxxxxxxxxxxx"
gh secret set STRIPE_PRICE_PRO --body "price_xxxxxxxxxxxxxxxxxxxxx"
gh secret set STRIPE_PRICE_ENTERPRISE --body "price_xxxxxxxxxxxxxxxxxxxxx"
```

---

## Step 9: Update Application Configuration

### Update Stripe Service Configuration

**File**: `packages/core/src/service/stripe.service.ts`

The service already uses environment variables, so no code changes needed. Just verify:

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});
```

### Update Webhook Handler

**File**: `packages/app/src/routes/webhooks.ts`

Already configured to use `STRIPE_WEBHOOK_SECRET` environment variable.

---

## Testing Checklist

### After Deployment to Preview

- [ ] **Webhook Endpoint Created** in Stripe test mode
- [ ] **Secrets Added** to GitHub (preview + resend)
- [ ] **Deploy Workflow Updated** to pass env vars
- [ ] **PR #388 Merged** to preview branch
- [ ] **Deployment Successful** (check GitHub Actions)
- [ ] **Webhook Delivery** working (check Stripe dashboard)

### Manual Tests

1. **Create Account**: POST to `/api/organizations/signup`
   ```bash
   curl -X POST https://preview-url.vercel.app/api/organizations/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123!",
       "organization_name": "Test Org"
     }'
   ```

2. **Check Stripe Customer**: Go to Stripe dashboard → Customers
   - Should see new customer created
   - Should have subscription (if auto-created)

3. **Send Test Webhook**: In Stripe dashboard → Webhooks → Test webhook
   - Send `customer.subscription.created` event
   - Check application logs for processing

4. **Check Usage Stats**: GET `/api/usage/stats`
   ```bash
   curl -H "Authorization: Bearer $JWT_TOKEN" \
     https://preview-url.vercel.app/api/usage/stats
   ```

---

## Common Issues and Solutions

### Issue: Webhook signature verification fails

**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe dashboard.

### Issue: No customer created in Stripe

**Solution**: Check that `STRIPE_SECRET_KEY` is set correctly and is a test key for preview.

### Issue: Email verification not sent

**Solution**: Check `RESEND_API_KEY` is set and verify domain in Resend dashboard.

### Issue: Usage limits not enforced

**Solution**: Ensure `billing_usage` table exists and migrations ran successfully.

---

## Next Steps

1. ✅ Get Stripe API keys from dashboard
2. ✅ Configure webhook endpoints
3. ✅ Add secrets to GitHub
4. ✅ Update deploy workflow
5. ✅ Get Resend API key
6. ✅ Create Stripe products/prices
7. ⏳ Wait for PR #388 CI to pass
8. ⏳ Merge PR #388 to preview
9. ⏳ Test on preview environment
10. ⏳ Create PR: preview → production

---

**Questions or Issues?** Check:
- Stripe Dashboard: https://dashboard.stripe.com/acct_1RuzGq0twRCD0Nl9
- Resend Dashboard: https://resend.com
- GitHub Actions: https://github.com/neighborhood-lab/care-commons/actions
- Vercel Dashboard: https://vercel.com/dashboard
