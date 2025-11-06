-- HIPAA requires 6 years retention for healthcare records

-- Soft-delete old records (move to archive)
BEGIN;

-- Archive visits older than 7 years
UPDATE visits
SET deleted_at = NOW()
WHERE scheduled_date < NOW() - INTERVAL '7 years'
  AND deleted_at IS NULL;

-- Archive audit logs older than 7 years
-- (Keep audit logs longer for compliance)
UPDATE audit_logs
SET archived = true
WHERE timestamp < NOW() - INTERVAL '7 years'
  AND archived = false;

-- Hard delete soft-deleted records older than 1 year
DELETE FROM visits
WHERE deleted_at < NOW() - INTERVAL '1 year';

COMMIT;

-- Vacuum to reclaim space
VACUUM ANALYZE visits;
VACUUM ANALYZE audit_logs;
