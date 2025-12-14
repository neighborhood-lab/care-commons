# Folk Care Terraform Variables

# =============================================================================
# Vercel Configuration
# =============================================================================

variable "vercel_team_id" {
  description = "Vercel team ID (optional, for team deployments)"
  type        = string
  default     = null
}

variable "vercel_git_repo" {
  description = "GitHub repository for Vercel project"
  type = object({
    type              = string
    repo              = string
    production_branch = string
  })
  default = {
    type              = "github"
    repo              = "neighborhood-lab/folk-care"
    production_branch = "production"
  }
}

# =============================================================================
# Neon Database Configuration
# =============================================================================

variable "neon_org_id" {
  description = "Neon organization ID (required to prevent duplicate projects)"
  type        = string
  sensitive   = true
}

variable "neon_region" {
  description = "Neon database region"
  type        = string
  default     = "aws-us-east-1"
}

variable "neon_compute_size" {
  description = "Compute size for Neon endpoints (CU = Compute Units)"
  type = object({
    min_cu = number
    max_cu = number
  })
  default = {
    min_cu = 0.25
    max_cu = 2
  }
}

variable "neon_history_retention" {
  description = "Point-in-time recovery history retention in seconds (default 7 days)"
  type        = number
  default     = 604800 # 7 days
}

# =============================================================================
# Upstash Redis Configuration
# =============================================================================

variable "upstash_region" {
  description = "Upstash Redis region"
  type        = string
  default     = "us-east-1"
}

variable "upstash_tls_enabled" {
  description = "Enable TLS for Upstash Redis connections"
  type        = bool
  default     = true
}

variable "upstash_eviction_enabled" {
  description = "Enable eviction when database reaches max size"
  type        = bool
  default     = true
}

# =============================================================================
# Environment Configuration
# =============================================================================

variable "environments" {
  description = "List of environments to create (production, preview)"
  type        = list(string)
  default     = ["production", "preview"]
}

variable "jwt_secret" {
  description = "JWT secret for authentication (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Encryption key for sensitive data (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}
