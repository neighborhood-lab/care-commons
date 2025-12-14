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

  # PostgreSQL version
  pg_version = 15

  lifecycle {
    prevent_destroy = true
  }
}

# =============================================================================
# Database Branches
# =============================================================================

# Use the default "main" branch created with the project as production
# Note: Neon automatically creates a "main" branch when the project is created
# We reference it via data source to avoid conflicts
data "neon_branch" "main" {
  project_id = neon_project.folkcare.id
  name       = "main"

  depends_on = [neon_project.folkcare]
}

# Preview branch for staging/development
resource "neon_branch" "preview" {
  project_id = neon_project.folkcare.id
  name       = "preview"

  # Branch from main to inherit schema and data
  parent_id = data.neon_branch.main.id
}

# =============================================================================
# Compute Endpoints
# =============================================================================

resource "neon_endpoint" "production" {
  project_id = neon_project.folkcare.id
  branch_id  = data.neon_branch.main.id

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
# Database Roles (one per branch - roles are branch-specific in Neon)
# =============================================================================

resource "neon_role" "production_app" {
  project_id = neon_project.folkcare.id
  branch_id  = data.neon_branch.main.id
  name       = "folkcare_app"
}

resource "neon_role" "preview_app" {
  project_id = neon_project.folkcare.id
  branch_id  = neon_branch.preview.id
  name       = "folkcare_app"
}

# =============================================================================
# Databases
# =============================================================================

resource "neon_database" "production" {
  project_id = neon_project.folkcare.id
  branch_id  = data.neon_branch.main.id
  name       = "folkcare"
  owner_name = neon_role.production_app.name
}

resource "neon_database" "preview" {
  project_id = neon_project.folkcare.id
  branch_id  = neon_branch.preview.id
  name       = "folkcare"
  owner_name = neon_role.preview_app.name
}
