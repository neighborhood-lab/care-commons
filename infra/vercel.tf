# Folk Care Vercel Project Configuration

# =============================================================================
# Vercel Project
# =============================================================================

resource "vercel_project" "folkcare" {
  name      = local.project_name
  framework = "vite"

  git_repository = {
    type              = var.vercel_git_repo.type
    repo              = var.vercel_git_repo.repo
    production_branch = var.vercel_git_repo.production_branch
  }

  # Build settings
  build_command    = "npm run vercel:build"
  output_directory = "public"
  install_command  = "npm ci"
  root_directory   = null

  # Serverless function configuration
  serverless_function_region = "iad1" # US East (N. Virginia)

  # Enable automatic preview deployments
  git_comments = {
    on_pull_request = true
    on_commit       = true
  }

  # Protection bypass for automation
  protection_bypass_for_automation = true
}

# =============================================================================
# Environment Variables - Production
# =============================================================================

resource "vercel_project_environment_variable" "database_url_production" {
  project_id = vercel_project.folkcare.id
  key        = "DATABASE_URL"
  value      = neon_branch.production.connection_uri
  target     = ["production"]
}

resource "vercel_project_environment_variable" "redis_url_production" {
  project_id = vercel_project.folkcare.id
  key        = "REDIS_URL"
  value      = "rediss://${upstash_redis_database.production.endpoint}:${upstash_redis_database.production.port}"
  target     = ["production"]
}

resource "vercel_project_environment_variable" "redis_token_production" {
  project_id = vercel_project.folkcare.id
  key        = "REDIS_TOKEN"
  value      = upstash_redis_database.production.password
  target     = ["production"]
}

resource "vercel_project_environment_variable" "jwt_secret_production" {
  project_id = vercel_project.folkcare.id
  key        = "JWT_SECRET"
  value      = var.jwt_secret
  target     = ["production"]
}

resource "vercel_project_environment_variable" "encryption_key_production" {
  project_id = vercel_project.folkcare.id
  key        = "ENCRYPTION_KEY"
  value      = var.encryption_key
  target     = ["production"]
}

resource "vercel_project_environment_variable" "node_env_production" {
  project_id = vercel_project.folkcare.id
  key        = "NODE_ENV"
  value      = "production"
  target     = ["production"]
}

# =============================================================================
# Environment Variables - Preview
# =============================================================================

resource "vercel_project_environment_variable" "database_url_preview" {
  project_id = vercel_project.folkcare.id
  key        = "DATABASE_URL"
  value      = neon_branch.preview.connection_uri
  target     = ["preview", "development"]
}

resource "vercel_project_environment_variable" "redis_url_preview" {
  project_id = vercel_project.folkcare.id
  key        = "REDIS_URL"
  value      = "rediss://${upstash_redis_database.preview.endpoint}:${upstash_redis_database.preview.port}"
  target     = ["preview", "development"]
}

resource "vercel_project_environment_variable" "redis_token_preview" {
  project_id = vercel_project.folkcare.id
  key        = "REDIS_TOKEN"
  value      = upstash_redis_database.preview.password
  target     = ["preview", "development"]
}

resource "vercel_project_environment_variable" "jwt_secret_preview" {
  project_id = vercel_project.folkcare.id
  key        = "JWT_SECRET"
  value      = var.jwt_secret
  target     = ["preview", "development"]
}

resource "vercel_project_environment_variable" "encryption_key_preview" {
  project_id = vercel_project.folkcare.id
  key        = "ENCRYPTION_KEY"
  value      = var.encryption_key
  target     = ["preview", "development"]
}

resource "vercel_project_environment_variable" "node_env_preview" {
  project_id = vercel_project.folkcare.id
  key        = "NODE_ENV"
  value      = "preview"
  target     = ["preview", "development"]
}

# =============================================================================
# Domain Configuration
# =============================================================================

resource "vercel_project_domain" "production" {
  project_id = vercel_project.folkcare.id
  domain     = "folk.care"
}

resource "vercel_project_domain" "www" {
  project_id = vercel_project.folkcare.id
  domain     = "www.folk.care"

  # Redirect www to apex domain
  redirect             = vercel_project_domain.production.domain
  redirect_status_code = 308
}
