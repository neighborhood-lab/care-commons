#!/bin/bash
set -e

# Usage: ./restore-database.sh backup_file.sql.gz

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

BACKUP_FILE=$1
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-care_commons}
DB_USER=${DATABASE_USER:-postgres}

# Confirmation prompt
echo "⚠️  WARNING: This will DROP and restore the database '$DB_NAME'"
echo "   Backup file: $BACKUP_FILE"
echo "   Database host: $DB_HOST"
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 1
fi

# Decompress if gzipped
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "Decompressing backup..."
  gunzip -k $BACKUP_FILE
  BACKUP_FILE=${BACKUP_FILE%.gz}
fi

# Drop connections
echo "Terminating active connections..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
echo "Dropping database..."
dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME || true

echo "Creating database..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

# Restore
echo "Restoring from backup..."
if [[ $BACKUP_FILE == *.sql ]]; then
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE
else
  pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME $BACKUP_FILE
fi

echo "✅ Database restored successfully"

# Verify
RECORD_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM clients;")
echo "Verification: $RECORD_COUNT clients in database"
