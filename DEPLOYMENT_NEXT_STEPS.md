# 🚀 Deployment Next Steps - Production SaaS Infrastructure

**PR #388 Status**: ✅ Ready to merge (all critical CI checks passing)  
**Target**: Preview environment  
**Date**: November 18, 2025

---

## 🎯 Quick Start: 3-Step Deployment

### Step 1: Add Required Secrets (5 minutes)

You need **3 secrets** for the preview environment to work with Stripe and Resend:

#### 1.1 Get Stripe TEST Mode Secret Key

1. Visit: https://dashboard.stripe.com/test/apikeys
2. Copy the **Secret key** (starts with `sk_test_`)
3. Run:
   ```bash
   gh secret set PREVIEW_STRIPE_SECRET_KEY --body "sk_test_YOUR_KEY_HERE"
   ```

#### 1.2 Create Stripe Webhook + Get Signing Secret

1. Visit: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://care-commons-git-preview-neighborhood-lab.vercel.app/api/webhooks/stripe`
   - **Events**: Select all in "Customer" and "Subscription" categories
   - Click **"Add endpoint"**
4. Copy the **Signing secret** (starts with `whsec_`)
5. Run:
   ```bash
   gh secret set PREVIEW_STRIPE_WEBHOOK_SECRET --body "whsec_YOUR_SECRET_HERE"
   ```

#### 1.3 Get Resend API Key

1. Visit: https://resend.com/api-keys
2. Create new API key or copy existing
3. Run:
   ```bash
   gh secret set RESEND_API_KEY --body "re_YOUR_KEY_HERE"
   ```

#### 1.4 Verify Secrets

```bash
gh secret list | grep -E "(STRIPE|RESEND)"
```

Expected output:
```
PREVIEW_STRIPE_SECRET_KEY       Updated now
PREVIEW_STRIPE_WEBHOOK_SECRET   Updated now
RESEND_API_KEY                  Updated now
```

---

### Step 2: Update Deploy Workflow (2 minutes)

The deploy workflow needs to pass the new secrets to Vercel.

**Quick fix**: I can update `.github/workflows/deploy.yml` for you, or you can manually add the environment variables to the Vercel deployment commands.

**Would you like me to update the workflow file now?**

---

### Step 3: Merge PR #388 to Preview (1 minute)

#### Option A: Via GitHub UI (Recommended)

1. Go to: https://github.com/neighborhood-lab/care-commons/pull/388
2. Click **"Merge pull request"**
3. Confirm merge
4. Monitor deployment: https://github.com/neighborhood-lab/care-commons/actions

#### Option B: Via CLI

```bash
# Checkout preview branch
git checkout preview
git pull origin preview

# Merge develop
git merge origin/develop --no-ff -m "Deploy Production SaaS infrastructure to preview"

# Push to trigger deployment
git push origin preview

# Watch deployment
gh run watch
```

---

## 📊 What You've Built (PR #388 Summary)

### New Infrastructure (2,324 lines of production code)

1. **BillingRepository** (555 lines) - Subscription management and usage tracking
2. **SignupService** (299 lines) - Public organization registration
3. **EmailService** (734 lines) - Resend integration for transactional emails
4. **EmailVerificationService** (184 lines) - Secure token-based verification
5. **StripeService** (237 lines) - Customer and subscription lifecycle
6. **UsageLimitMiddleware** (315 lines) - API usage enforcement by plan tier

### New Database Tables

- `subscriptions` - Stripe subscription tracking
- `billing_usage` - API usage metrics per organization
- Email verification columns on `users` table

### New API Endpoints

- `POST /api/organizations/signup` - Public registration
- `GET /api/verify-email` - Email verification
- `POST /api/webhooks/stripe` - Stripe event processing
- `GET /api/usage/stats` - Usage statistics

---

## 🧪 Post-Deployment Testing (10 minutes)

Once deployed, the preview URL will be in the GitHub Actions output. Test these:

### 1. Health Check

```bash
PREVIEW_URL="<from deployment output>"
curl $PREVIEW_URL/health
```

Expected: `200 OK` with database connection status

### 2. Organization Signup

```bash
curl -X POST $PREVIEW_URL/api/organizations/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "organization_name": "Test Organization"
  }'
```

Expected:
- `201 Created` with JWT token
- Stripe customer created (check Stripe dashboard)
- Verification email sent (check Resend logs)

### 3. Email Verification

Check your email for verification link, or manually construct:

```bash
# Get token from database or email
curl "$PREVIEW_URL/api/verify-email?token=YOUR_TOKEN_HERE"
```

Expected: `200 OK` with success message

### 4. Usage Stats (After Login)

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  $PREVIEW_URL/api/usage/stats
```

Expected: JSON with usage data by vertical

### 5. Stripe Webhook Test

In Stripe dashboard → Webhooks → Your endpoint → Send test webhook

Expected:
- Webhook signature verified
- Event processed successfully
- Database updated

---

## ⚠️ Important Notes

### Test Mode vs Live Mode

**Preview Environment**: Uses Stripe **TEST MODE** keys (sk_test_*)
- No real charges
- Use test card: `4242 4242 4242 4242`
- Webhooks sent from Stripe test mode

**Production Environment**: Will use Stripe **LIVE MODE** keys (sk_live_*)
- Real charges
- Real customer data
- Production webhooks

### Graceful Fallbacks

The application gracefully handles missing Stripe/Resend credentials:
- ✅ If `STRIPE_SECRET_KEY` missing: Signup works, but no Stripe customer created
- ✅ If `RESEND_API_KEY` missing: Signup works, but no verification email sent
- ✅ If webhook secret wrong: Webhooks rejected, but app continues

This means you can deploy even without these secrets, but features won't work.

### Database Migrations

Two new migrations will run automatically on deployment:
1. `20251117000001_create_subscriptions_table.ts` - Creates subscriptions + billing_usage tables
2. `20251117000002_add_email_verification.ts` - Adds email verification columns

---

## 🔄 Deployment Timeline

After merging PR #388 to `preview`:

| Phase | Duration | What Happens |
|-------|----------|--------------|
| Build | 5-10 min | Compile all packages, run tests |
| Migrations | 30 sec | Apply 2 new database migrations |
| Deploy | 2-3 min | Deploy to Vercel preview |
| Post-Deploy | 1-2 min | Reset DB, seed demo data |
| **Total** | **10-15 min** | Full deployment complete |

---

## 🛠️ Troubleshooting

### Issue: Secrets not available in deployment

**Solution**: Ensure secrets are set at the repository level (not environment level):

```bash
gh secret list
```

### Issue: Stripe webhook signature verification fails

**Solution**: Ensure `PREVIEW_STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe dashboard webhook endpoint.

### Issue: Email not sent

**Solution**: 
1. Check Resend dashboard logs: https://resend.com/emails
2. Verify `RESEND_API_KEY` is set correctly
3. Check from email domain is verified in Resend

### Issue: Database migration fails

**Solution**:
1. Check GitHub Actions logs for specific error
2. Verify `PREVIEW_DATABASE_URL` is correct
3. Ensure database is accessible

---

## 📋 Pre-Production Checklist

Before deploying to production (preview → main):

- [ ] All preview tests passing
- [ ] Stripe webhooks delivering successfully
- [ ] Email verification working
- [ ] Usage limits enforcing correctly
- [ ] No regressions in existing features
- [ ] Stripe **LIVE MODE** keys ready
- [ ] Production webhook endpoint configured
- [ ] Production database backed up

---

## 🎓 Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Resend Documentation**: https://resend.com/docs
- **PR #388**: https://github.com/neighborhood-lab/care-commons/pull/388
- **Detailed Stripe Setup**: See `STRIPE_SETUP_GUIDE.md`
- **Add Secrets Script**: `./scripts/add-stripe-secrets.sh`

---

## 🚨 Security Reminders

1. ✅ Never commit API keys to git
2. ✅ Use test mode keys for preview/staging
3. ✅ Use live mode keys only for production
4. ✅ Rotate keys if accidentally exposed
5. ✅ Store keys in GitHub Secrets (encrypted)
6. ✅ Never share secret keys publicly (publishable keys are OK)

---

## Ready to Deploy?

**Current Status**: ⏸️ Waiting for Stripe/Resend secrets

**Once secrets are added**:
1. Update deploy workflow (I can do this)
2. Merge PR #388 to preview
3. Monitor deployment
4. Test on preview environment
5. Create PR: preview → production

---

**Questions?** Check `STRIPE_SETUP_GUIDE.md` or run `./scripts/add-stripe-secrets.sh` for help.

**Last Updated**: November 18, 2025  
**Next Action**: Add Stripe test mode secrets (Step 1 above)
