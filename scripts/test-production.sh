#!/bin/bash

# Production testing script
set -e

echo "🧪 Running production tests..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL=${1:-"http://localhost:5000"}
TEST_RESULTS=()

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

test_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3

    log_info "Testing: $description"

    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint")

    if [ "$response" -eq "$expected_status" ]; then
        log_info "✅ $description - PASSED"
        TEST_RESULTS+=("PASS: $description")
    else
        log_error "❌ $description - FAILED (Expected: $expected_status, Got: $response)"
        TEST_RESULTS+=("FAIL: $description")
    fi
}

# Health checks
log_info "Starting health checks..."
test_endpoint "/api/health" 200 "Health endpoint"
test_endpoint "/api/users" 200 "Users endpoint"
test_endpoint "/api/messages" 200 "Messages endpoint"

# Test static file serving
test_endpoint "/" 200 "Root endpoint"
test_endpoint "/static/js/nonexistent.js" 404 "404 handling"

# Test rate limiting (if enabled)
log_info "Testing rate limiting..."
for i in {1..15}; do
    curl -s "$BASE_URL/api/health" > /dev/null
done
response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/health")
if [ "$response" -eq 429 ]; then
    log_info "✅ Rate limiting - WORKING"
    TEST_RESULTS+=("PASS: Rate limiting")
else
    log_warn "⚠️  Rate limiting - NOT DETECTED"
    TEST_RESULTS+=("WARN: Rate limiting")
fi

# Test WebSocket connection
log_info "Testing WebSocket connection..."
if command -v wscat &> /dev/null; then
    timeout 5 wscat -c "ws://localhost:5000/socket.io/?EIO=4&transport=websocket" &
    sleep 2
    if ps aux | grep -q "[w]scat"; then
        log_info "✅ WebSocket connection - WORKING"
        TEST_RESULTS+=("PASS: WebSocket connection")
        pkill wscat 2>/dev/null || true
    else
        log_error "❌ WebSocket connection - FAILED"
        TEST_RESULTS+=("FAIL: WebSocket connection")
    fi
else
    log_warn "⚠️  wscat not installed, skipping WebSocket test"
    TEST_RESULTS+=("SKIP: WebSocket connection")
fi

# Performance test
log_info "Running basic performance test..."
if command -v ab &> /dev/null; then
    ab_result=$(ab -n 100 -c 10 "$BASE_URL/api/health" 2>/dev/null | grep "Requests per second" | awk '{print $4}')
    if [ -n "$ab_result" ]; then
        log_info "✅ Performance test - $ab_result requests/sec"
        TEST_RESULTS+=("PASS: Performance test - $ab_result req/s")
    else
        log_warn "⚠️  Performance test - NO RESULT"
        TEST_RESULTS+=("WARN: Performance test")
    fi
else
    log_warn "⚠️  Apache Bench not installed, skipping performance test"
    TEST_RESULTS+=("SKIP: Performance test")
fi

# Summary
echo ""
log_info "🔍 Test Summary:"
for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == PASS* ]]; then
        echo -e "${GREEN}$result${NC}"
    elif [[ $result == FAIL* ]]; then
        echo -e "${RED}$result${NC}"
    else
        echo -e "${YELLOW}$result${NC}"
    fi
done

# Count results
pass_count=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c "^PASS" || true)
fail_count=$(printf '%s\n' "${TEST_RESULTS[@]}" | grep -c "^FAIL" || true)
total_count=${#TEST_RESULTS[@]}

echo ""
if [ "$fail_count" -eq 0 ]; then
    log_info "🎉 All tests passed! ($pass_count/$total_count)"
    exit 0
else
    log_error "💥 $fail_count tests failed! ($pass_count/$total_count passed)"
    exit 1
fi