#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📝 Generating Changelog${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

OUTPUT_FILE="CHANGELOG.md"

# Check if git is available
if ! command -v git &> /dev/null; then
  echo -e "${RED}❌ git not found${NC}"
  exit 1
fi

# Check if in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}❌ Not in a git repository${NC}"
  exit 1
fi

# Create changelog header
cat > "$OUTPUT_FILE" << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

EOF

echo "▶ Generating changelog from git history..."

# Get all tags, sorted by version (most recent first)
TAGS=$(git tag -l --sort=-v:refname)

if [ -z "$TAGS" ]; then
  echo -e "${YELLOW}⚠️  No git tags found${NC}"
  echo ""
  echo "## Unreleased" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"

  # Get all commits
  git log --pretty=format:"- %s (%h) - %an" --no-merges >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
else
  # Add unreleased changes first
  LATEST_TAG=$(echo "$TAGS" | head -1)
  UNRELEASED_COUNT=$(git log "$LATEST_TAG"..HEAD --oneline --no-merges | wc -l)

  if [ "$UNRELEASED_COUNT" -gt 0 ]; then
    echo "## Unreleased" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    git log "$LATEST_TAG"..HEAD --pretty=format:"- %s (%h) - %an" --no-merges >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi

  # Process each tag
  PREV_TAG=""
  for TAG in $TAGS; do
    # Get tag date
    TAG_DATE=$(git log -1 --format=%ai "$TAG" | cut -d' ' -f1)

    # Get tag message (if annotated tag)
    TAG_MESSAGE=$(git tag -l --format='%(contents:subject)' "$TAG")

    echo "## [$TAG] - $TAG_DATE" >> "$OUTPUT_FILE"

    if [ -n "$TAG_MESSAGE" ]; then
      echo "" >> "$OUTPUT_FILE"
      echo "$TAG_MESSAGE" >> "$OUTPUT_FILE"
    fi

    echo "" >> "$OUTPUT_FILE"

    if [ -z "$PREV_TAG" ]; then
      # First tag - compare with HEAD
      git log "$TAG"..HEAD --pretty=format:"- %s (%h) - %an" --no-merges >> "$OUTPUT_FILE" 2>/dev/null || true
    else
      # Compare with previous tag
      git log "$PREV_TAG".."$TAG" --pretty=format:"- %s (%h) - %an" --no-merges >> "$OUTPUT_FILE"
    fi

    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"

    PREV_TAG=$TAG
  done

  # Add initial commits (before first tag)
  FIRST_TAG=$(echo "$TAGS" | tail -1)
  INITIAL_COUNT=$(git log "$FIRST_TAG" --oneline --no-merges | wc -l)

  if [ "$INITIAL_COUNT" -gt 0 ]; then
    echo "## Initial Commits" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    git log "$FIRST_TAG" --pretty=format:"- %s (%h) - %an" --no-merges >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
fi

# Add footer
cat >> "$OUTPUT_FILE" << 'EOF'

---

**Note**: This changelog is automatically generated from git commit history.
For a more detailed view, see the [commit history](https://github.com/neighborhood-lab/care-commons/commits).

EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Changelog generated: $OUTPUT_FILE${NC}"
echo ""

# Display statistics
TOTAL_COMMITS=$(git rev-list --all --count)
TOTAL_TAGS=$(echo "$TAGS" | wc -l)

echo "Statistics:"
echo "  • Total commits: $TOTAL_COMMITS"
echo "  • Total tags: $TOTAL_TAGS"
echo ""
