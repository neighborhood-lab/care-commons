# Folk Care Terraform Outputs

# =============================================================================
# Vercel Outputs
# =============================================================================

output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.folkcare.id
}

output "vercel_project_name" {
  description = "Vercel project name"
  value       = vercel_project.folkcare.name
}

output "vercel_production_url" {
  description = "Vercel production URL"
  value       = "https://${vercel_project_domain.production.domain}"
}

# =============================================================================
# Neon Database Outputs
# =============================================================================

output "neon_project_id" {
  description = "Neon project ID"
  value       = neon_project.folkcare.id
}

output "neon_production_host" {
  description = "Neon production database host"
  value       = neon_endpoint.production.host
  sensitive   = true
}

output "neon_preview_host" {
  description = "Neon preview database host"
  value       = neon_endpoint.preview.host
  sensitive   = true
}

output "neon_production_connection_uri" {
  description = "Neon production connection URI (pooled)"
  value       = neon_branch.production.connection_uri
  sensitive   = true
}

output "neon_preview_connection_uri" {
  description = "Neon preview connection URI (pooled)"
  value       = neon_branch.preview.connection_uri
  sensitive   = true
}

# =============================================================================
# Upstash Redis Outputs
# =============================================================================

output "upstash_production_endpoint" {
  description = "Upstash Redis production endpoint"
  value       = upstash_redis_database.production.endpoint
  sensitive   = true
}

output "upstash_production_port" {
  description = "Upstash Redis production port"
  value       = upstash_redis_database.production.port
}

output "upstash_preview_endpoint" {
  description = "Upstash Redis preview endpoint"
  value       = upstash_redis_database.preview.endpoint
  sensitive   = true
}

output "upstash_preview_port" {
  description = "Upstash Redis preview port"
  value       = upstash_redis_database.preview.port
}

# =============================================================================
# Connection String Outputs (for local development reference)
# =============================================================================

output "connection_strings" {
  description = "Connection strings for reference (sensitive)"
  sensitive   = true
  value = {
    production = {
      database = neon_branch.production.connection_uri
      redis    = "rediss://:${upstash_redis_database.production.password}@${upstash_redis_database.production.endpoint}:${upstash_redis_database.production.port}"
    }
    preview = {
      database = neon_branch.preview.connection_uri
      redis    = "rediss://:${upstash_redis_database.preview.password}@${upstash_redis_database.preview.endpoint}:${upstash_redis_database.preview.port}"
    }
  }
}
