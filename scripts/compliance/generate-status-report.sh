#!/bin/bash
#
# Generate Compliance Status Report
#
# Creates a comprehensive status report of all state compliance documentation.
# Useful for tracking progress and identifying gaps.
#
# Usage:
#   ./scripts/compliance/generate-status-report.sh [--format=markdown|json]
#
# Examples:
#   ./scripts/compliance/generate-status-report.sh
#   ./scripts/compliance/generate-status-report.sh --format=json > status.json
#

set -e

# Default format
FORMAT="${1:-markdown}"
FORMAT="${FORMAT#--format=}"

# Colors (only for markdown/terminal output)
if [ "$FORMAT" = "markdown" ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
fi

# Function to check file existence and line count
check_file_status() {
  local file="$1"
  
  if [ -f "$file" ]; then
    local lines=$(wc -l < "$file" | tr -d ' ')
    echo "$lines"
  else
    echo "0"
  fi
}

# Function to check if tests exist
check_tests_exist() {
  local state_code="$1"
  local test_dir="packages/core/src/compliance/__tests__/$state_code"
  
  if [ -d "$test_dir" ]; then
    local test_files=$(find "$test_dir" -name "*.test.ts" | wc -l | tr -d ' ')
    echo "$test_files"
  else
    echo "0"
  fi
}

# Function to extract state info
extract_state_info() {
  local state_dir="$1"
  local req_file="docs/compliance/$state_dir/REQUIREMENTS.md"
  
  # Extract state code
  local state_code=$(grep "^**State Code**:" "$req_file" 2>/dev/null | sed 's/.*: //' | tr -d '\r ' || echo "??")
  
  # Extract last updated
  local last_updated=$(grep "^**Last Updated**:" "$req_file" 2>/dev/null | sed 's/.*: //' | tr -d '\r' || echo "Unknown")
  
  # Check file sizes
  local req_lines=$(check_file_status "$req_file")
  local impl_lines=$(check_file_status "docs/compliance/$state_dir/IMPLEMENTATION.md")
  local test_scen_lines=$(check_file_status "docs/compliance/$state_dir/TEST_SCENARIOS.md")
  local changelog_lines=$(check_file_status "docs/compliance/$state_dir/CHANGELOG.md")
  
  # Check tests
  local test_files=$(check_tests_exist "$state_code")
  
  # Calculate completion percentage
  local completion=0
  [ $req_lines -gt 0 ] && completion=$((completion + 25))
  [ $impl_lines -gt 0 ] && completion=$((completion + 25))
  [ $test_scen_lines -gt 0 ] && completion=$((completion + 25))
  [ $test_files -gt 0 ] && completion=$((completion + 25))
  
  echo "$state_dir|$state_code|$last_updated|$req_lines|$impl_lines|$test_scen_lines|$changelog_lines|$test_files|$completion"
}

# Header
if [ "$FORMAT" = "markdown" ]; then
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Compliance Documentation Status Report${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  echo -e "${YELLOW}Generated:${NC} $(date)"
  echo ""
elif [ "$FORMAT" = "json" ]; then
  echo "{"
  echo "  \"generated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  echo "  \"states\": ["
fi

# Collect state data
states_data=()
total_states=0
completed_states=0

for state_dir in docs/compliance/*/; do
  # Skip template
  if [[ "$state_dir" == *"_template"* ]]; then
    continue
  fi
  
  state_name=$(basename "$state_dir")
  state_info=$(extract_state_info "$state_name")
  states_data+=("$state_info")
  total_states=$((total_states + 1))
  
  # Check if completed
  completion=$(echo "$state_info" | cut -d'|' -f9)
  [ "$completion" -eq 100 ] && completed_states=$((completed_states + 1))
done

# Output based on format
if [ "$FORMAT" = "markdown" ]; then
  echo "## Summary"
  echo ""
  echo -e "${GREEN}Total States Documented: $total_states / 50${NC}"
  echo -e "${GREEN}Fully Complete: $completed_states${NC}"
  echo -e "${YELLOW}In Progress: $((total_states - completed_states))${NC}"
  echo -e "${RED}Not Started: $((50 - total_states))${NC}"
  echo ""
  
  echo "## State Details"
  echo ""
  echo "| State | Code | Last Updated | Req | Impl | Tests | Changelog | Test Files | Complete |"
  echo "|-------|------|--------------|-----|------|-------|-----------|------------|----------|"
  
  for state_info in "${states_data[@]}"; do
    IFS='|' read -r state_name state_code last_updated req_lines impl_lines test_scen_lines changelog_lines test_files completion <<< "$state_info"
    
    # Status emoji
    if [ "$completion" -eq 100 ]; then
      status="✅"
    elif [ "$completion" -ge 50 ]; then
      status="🚧"
    else
      status="📋"
    fi
    
    echo "| $state_name | $state_code | $last_updated | ${req_lines}L | ${impl_lines}L | ${test_scen_lines}L | ${changelog_lines}L | $test_files | $status $completion% |"
  done
  
  echo ""
  echo "## Legend"
  echo ""
  echo "- **Req**: Lines in REQUIREMENTS.md"
  echo "- **Impl**: Lines in IMPLEMENTATION.md"
  echo "- **Tests**: Lines in TEST_SCENARIOS.md"
  echo "- **Changelog**: Lines in CHANGELOG.md"
  echo "- **Test Files**: Number of test files implemented"
  echo "- ✅ 100% Complete"
  echo "- 🚧 In Progress (50-99%)"
  echo "- 📋 Started (<50%)"
  echo ""
  
  echo "## Next Steps"
  echo ""
  echo "### Priority States (Not Yet Started)"
  echo ""
  echo "1. **Ohio** - Sandata aggregator, 5,000+ agencies"
  echo "2. **Pennsylvania** - Sandata aggregator, 8,000+ agencies"
  echo "3. **Georgia** - Tellus aggregator, 6,000+ agencies"
  echo "4. **North Carolina** - Sandata aggregator, 5,000+ agencies"
  echo "5. **Arizona** - Sandata aggregator, 4,000+ agencies"
  echo ""
  echo "### States Needing Completion"
  echo ""
  
  for state_info in "${states_data[@]}"; do
    IFS='|' read -r state_name state_code last_updated req_lines impl_lines test_scen_lines changelog_lines test_files completion <<< "$state_info"
    
    if [ "$completion" -lt 100 ]; then
      echo "**$state_name** ($completion% complete):"
      [ "$req_lines" -eq 0 ] && echo "  - [ ] Complete REQUIREMENTS.md"
      [ "$impl_lines" -eq 0 ] && echo "  - [ ] Complete IMPLEMENTATION.md"
      [ "$test_scen_lines" -eq 0 ] && echo "  - [ ] Complete TEST_SCENARIOS.md"
      [ "$test_files" -eq 0 ] && echo "  - [ ] Implement test files"
      echo ""
    fi
  done
  
elif [ "$FORMAT" = "json" ]; then
  # JSON output
  first=true
  for state_info in "${states_data[@]}"; do
    IFS='|' read -r state_name state_code last_updated req_lines impl_lines test_scen_lines changelog_lines test_files completion <<< "$state_info"
    
    [ "$first" = false ] && echo ","
    first=false
    
    cat << EOF
    {
      "name": "$state_name",
      "code": "$state_code",
      "lastUpdated": "$last_updated",
      "documentation": {
        "requirements": $req_lines,
        "implementation": $impl_lines,
        "testScenarios": $test_scen_lines,
        "changelog": $changelog_lines
      },
      "tests": {
        "files": $test_files
      },
      "completion": $completion
    }
EOF
  done
  
  echo ""
  echo "  ],"
  echo "  \"summary\": {"
  echo "    \"totalStates\": $total_states,"
  echo "    \"completed\": $completed_states,"
  echo "    \"inProgress\": $((total_states - completed_states)),"
  echo "    \"notStarted\": $((50 - total_states))"
  echo "  }"
  echo "}"
fi

exit 0
