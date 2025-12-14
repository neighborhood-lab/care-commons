# Folk Care Neon PostgreSQL Configuration

# =============================================================================
# Neon Project
# =============================================================================

resource "neon_project" "folkcare" {
  name      = local.project_name
  region_id = var.neon_region

  # Organization ID is required to prevent duplicate projects
  org_id = var.neon_org_id

  # Point-in-time recovery history retention
  history_retention_seconds = var.neon_history_retention

  # Default compute size for endpoints
  default_endpoint_settings = {
    autoscaling_limit_min_cu = var.neon_compute_size.min_cu
    autoscaling_limit_max_cu = var.neon_compute_size.max_cu
    suspend_timeout_seconds  = 300 # Suspend after 5 minutes of inactivity
  }

  # Enable connection pooling
  pg_version = 15
}

# =============================================================================
# Database Branches
# =============================================================================

# Production branch (main branch is created automatically with the project)
resource "neon_branch" "production" {
  project_id = neon_project.folkcare.id
  name       = "production"

  # Production uses the main branch which is created with the project
  # This is a reference to ensure proper dependency ordering
  depends_on = [neon_project.folkcare]
}

# Preview branch for staging/development
resource "neon_branch" "preview" {
  project_id = neon_project.folkcare.id
  name       = "preview"

  # Branch from production to include schema
  parent_id = neon_branch.production.id
}

# =============================================================================
# Compute Endpoints
# =============================================================================

resource "neon_endpoint" "production" {
  project_id = neon_project.folkcare.id
  branch_id  = neon_branch.production.id

  type = "read_write"

  autoscaling_limit_min_cu = var.neon_compute_size.min_cu
  autoscaling_limit_max_cu = var.neon_compute_size.max_cu
  suspend_timeout_seconds  = 0 # Never suspend in production
}

resource "neon_endpoint" "preview" {
  project_id = neon_project.folkcare.id
  branch_id  = neon_branch.preview.id

  type = "read_write"

  autoscaling_limit_min_cu = var.neon_compute_size.min_cu
  autoscaling_limit_max_cu = var.neon_compute_size.max_cu
  suspend_timeout_seconds  = 300 # Suspend after 5 minutes in preview
}

# =============================================================================
# Database Roles
# =============================================================================

resource "neon_role" "app" {
  project_id = neon_project.folkcare.id
  branch_id  = neon_branch.production.id
  name       = "folkcare_app"
}

# =============================================================================
# Databases
# =============================================================================

resource "neon_database" "production" {
  project_id = neon_project.folkcare.id
  branch_id  = neon_branch.production.id
  name       = "folkcare"
  owner_name = neon_role.app.name
}

resource "neon_database" "preview" {
  project_id = neon_project.folkcare.id
  branch_id  = neon_branch.preview.id
  name       = "folkcare"
  owner_name = neon_role.app.name
}
