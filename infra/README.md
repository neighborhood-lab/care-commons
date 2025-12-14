# Folk Care Infrastructure as Code

This directory contains Terraform configurations for managing Folk Care's infrastructure.

## Overview

| Resource | Provider | Description |
|----------|----------|-------------|
| Vercel | `vercel/vercel` | Frontend deployment, serverless functions |
| Neon | `kislerdm/neon` | PostgreSQL database (production & preview) |
| Upstash | `upstash/upstash` | Redis cache (production & preview) |

## Prerequisites

1. **Terraform** >= 1.5.0
   ```bash
   brew install terraform
   # or
   curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
   sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
   sudo apt-get update && sudo apt-get install terraform
   ```

2. **API Tokens** (set as environment variables):
   ```bash
   export VERCEL_API_TOKEN="your-vercel-token"
   export NEON_API_KEY="your-neon-api-key"
   export UPSTASH_EMAIL="your-upstash-email"
   export UPSTASH_API_KEY="your-upstash-api-key"
   ```

## Getting Started

### Initial Setup

1. **Copy the example variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit `terraform.tfvars`** with your values:
   - `neon_org_id` - Find in Neon Console → Account Settings
   - `jwt_secret` - Generate with `openssl rand -base64 32`
   - `encryption_key` - Generate with `openssl rand -base64 32`

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Review the plan:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

### Importing Existing Resources

If you have existing Vercel/Neon/Upstash resources, import them:

```bash
# Import Vercel project
terraform import vercel_project.folkcare prj_xxxxxxxx

# Import Neon project
terraform import neon_project.folkcare your-project-id

# Import Upstash Redis database
terraform import upstash_redis_database.production your-database-id
```

## File Structure

```
infra/
├── main.tf                    # Providers and shared configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output values
├── backend.tf                 # State backend configuration
├── vercel.tf                  # Vercel project and env vars
├── neon.tf                    # Neon database configuration
├── upstash.tf                 # Upstash Redis configuration
├── terraform.tfvars.example   # Example variables file
├── .gitignore                 # Ignore state and secrets
└── README.md                  # This file
```

## Environment Variables

The following environment variables are automatically configured in Vercel:

| Variable | Description | Environments |
|----------|-------------|--------------|
| `DATABASE_URL` | Neon PostgreSQL connection string | production, preview |
| `REDIS_URL` | Upstash Redis URL | production, preview |
| `REDIS_TOKEN` | Upstash Redis auth token | production, preview |
| `JWT_SECRET` | JWT signing secret | production, preview |
| `ENCRYPTION_KEY` | Data encryption key | production, preview |
| `NODE_ENV` | Environment name | production, preview |

## State Management

By default, Terraform state is stored locally. For team collaboration, configure a remote backend:

### Terraform Cloud (Recommended)

1. Create an account at [app.terraform.io](https://app.terraform.io)
2. Create an organization and workspace
3. Uncomment the `cloud` block in `backend.tf`
4. Run `terraform init -migrate-state`

### AWS S3

1. Create an S3 bucket and DynamoDB table
2. Uncomment the `s3` backend block in `backend.tf`
3. Run `terraform init -migrate-state`

## Common Operations

### Update Environment Variables

```bash
# After changing variables
terraform plan
terraform apply
```

### Scale Database Compute

Edit `terraform.tfvars`:
```hcl
neon_compute_size = {
  min_cu = 0.5
  max_cu = 4
}
```

Then apply:
```bash
terraform apply
```

### Add a New Environment

1. Add new branch resources in `neon.tf`
2. Add new Redis database in `upstash.tf`
3. Add environment variables in `vercel.tf`
4. Run `terraform apply`

## Security Notes

1. **Never commit `terraform.tfvars`** - it contains secrets
2. **Never commit `*.tfstate`** - it contains infrastructure details
3. **Rotate secrets regularly** - regenerate JWT_SECRET and ENCRYPTION_KEY periodically
4. **Use least privilege** - API tokens should have minimal required permissions

## Troubleshooting

### "Resource already exists"

Import the existing resource:
```bash
terraform import <resource_type>.<name> <resource_id>
```

### "Provider authentication failed"

Verify environment variables are set:
```bash
echo $VERCEL_API_TOKEN
echo $NEON_API_KEY
echo $UPSTASH_EMAIL
echo $UPSTASH_API_KEY
```

### "State lock error"

If using remote state and lock is stuck:
```bash
terraform force-unlock <lock_id>
```

## Resources

- [Vercel Terraform Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Neon Terraform Provider](https://registry.terraform.io/providers/kislerdm/neon/latest/docs)
- [Upstash Terraform Provider](https://registry.terraform.io/providers/upstash/upstash/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
