# Folk Care Terraform Backend Configuration
#
# This file configures where Terraform stores its state.
# For team collaboration, we recommend using a remote backend.
#
# Options:
# 1. Terraform Cloud (free tier available)
# 2. AWS S3 + DynamoDB
# 3. Azure Storage
# 4. Google Cloud Storage
#
# For now, we use local state. To migrate to remote:
# 1. Uncomment one of the backend blocks below
# 2. Run: terraform init -migrate-state

# =============================================================================
# Local Backend (Default - for initial setup)
# =============================================================================

# State is stored locally in terraform.tfstate
# WARNING: Do not commit terraform.tfstate to git (it contains secrets)

# =============================================================================
# Terraform Cloud Backend (Recommended for teams)
# =============================================================================

# terraform {
#   cloud {
#     organization = "neighborhood-lab"
#     workspaces {
#       name = "folkcare-infrastructure"
#     }
#   }
# }

# =============================================================================
# AWS S3 Backend (Alternative)
# =============================================================================

# terraform {
#   backend "s3" {
#     bucket         = "folkcare-terraform-state"
#     key            = "infrastructure/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "folkcare-terraform-locks"
#   }
# }
