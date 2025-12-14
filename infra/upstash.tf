# Folk Care Upstash Redis Configuration

# =============================================================================
# Production Redis Database
# =============================================================================

resource "upstash_redis_database" "production" {
  database_name = "${local.project_name}-production"
  region        = var.upstash_region
  tls           = var.upstash_tls_enabled
  eviction      = var.upstash_eviction_enabled

  # Multi-zone for high availability in production
  multi_zone = true

  # Cost control: set a budget limit
  # Default $20/month, increase as needed
  auto_scale = true

  lifecycle {
    prevent_destroy = true
  }
}

# =============================================================================
# Preview Redis Database
# =============================================================================

resource "upstash_redis_database" "preview" {
  database_name = "${local.project_name}-preview"
  region        = var.upstash_region
  tls           = var.upstash_tls_enabled
  eviction      = var.upstash_eviction_enabled

  # Single zone is sufficient for preview
  multi_zone = false

  # Cost control for preview
  auto_scale = false
}
