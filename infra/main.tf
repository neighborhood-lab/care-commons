# Folk Care Infrastructure as Code
# Terraform configuration for managing Vercel, Neon, and Upstash resources

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.6"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.5"
    }
  }
}

# Provider configurations
# API tokens should be set via environment variables:
# - VERCEL_API_TOKEN
# - NEON_API_KEY
# - UPSTASH_EMAIL and UPSTASH_API_KEY

provider "vercel" {
  # Uses VERCEL_API_TOKEN environment variable
  team = var.vercel_team_id
}

provider "neon" {
  # Uses NEON_API_KEY environment variable
}

provider "upstash" {
  # Uses UPSTASH_EMAIL and UPSTASH_API_KEY environment variables
}

# Local values for consistent naming
locals {
  project_name = "folkcare"
  common_tags = {
    project     = local.project_name
    managed_by  = "terraform"
    repository  = "neighborhood-lab/folk-care"
  }
}
