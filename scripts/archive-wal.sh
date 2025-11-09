#!/bin/bash

# PostgreSQL WAL archiving script for point-in-time recovery

WAL_FILE="$1"
WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:-/var/lib/postgresql/wal_archive}"
S3_BUCKET="${S3_BUCKET:-}"

# Create archive directory
mkdir -p "${WAL_ARCHIVE_DIR}"

# Copy WAL file to archive
cp "${WAL_FILE}" "${WAL_ARCHIVE_DIR}/"

# Upload to S3 if configured
if [ -n "${S3_BUCKET}" ]; then
  aws s3 cp "${WAL_FILE}" "s3://${S3_BUCKET}/wal/$(basename ${WAL_FILE})"
fi

echo "[$(date)] WAL file archived: $(basename ${WAL_FILE})"
