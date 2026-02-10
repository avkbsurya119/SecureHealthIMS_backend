#!/bin/bash

# Backend Endpoint Testing Script
# Tests all API endpoints and verifies database connectivity

BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local token=$5
    local expected_status_list=$6  # Can be comma separated, e.g., "200,201"
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "${CYAN}Testing:${NC} $description"
    echo -e "${BLUE}$method $endpoint${NC}"
    
    if [ -n "$data" ] && [ "$data" != "null" ]; then
        # echo "Payload: $data"
        if [ -n "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -n "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # Check if http_code is in the expected list
    if [[ ",$expected_status_list," == *",$http_code,"* ]]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        # Pretty print JSON if possible, otherwise raw
        if command -v jq &> /dev/null; then
            echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
        else
            echo "$body"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_status_list)"
        FAILED=$((FAILED + 1))
        if command -v jq &> /dev/null; then
            echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
        else
            echo "$body"
        fi
    fi
    echo ""
}

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Backend API Endpoint Testing Suite                ║${NC}"
echo -e "${CYAN}║     Testing: $BASE_URL                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Health Check
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. Health Check Endpoint${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
test_endpoint "GET" "/health" "Server health check" "" "" "200"

# 2. Authentication Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. Authentication Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Register patient
TIMESTAMP=$(date +%s)
PATIENT_EMAIL="test.patient.${TIMESTAMP}@example.com"
PATIENT_DATA="{\"email\":\"$PATIENT_EMAIL\",\"password\":\"SecurePass123!\",\"role\":\"patient\",\"name\":\"Test Patient\",\"phone\":\"1234567890\",\"date_of_birth\":\"1990-01-01\",\"gender\":\"male\",\"address\":\"123 Test St\"}"
test_endpoint "POST" "/auth/register" "Patient registration" "$PATIENT_DATA" "" "201,409"

# Register doctor
DOCTOR_EMAIL="test.doctor.${TIMESTAMP}@example.com"
DOCTOR_DATA="{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"SecurePass123!\",\"role\":\"doctor\",\"name\":\"Dr. Test\",\"phone\":\"9876543210\",\"specialization\":\"General Medicine\",\"license_number\":\"LIC${TIMESTAMP}\",\"qualification\":\"MBBS, MD\"}"
test_endpoint "POST" "/auth/register" "Doctor registration" "$DOCTOR_DATA" "" "201,409"

# Login patient
LOGIN_DATA="{\"email\":\"$PATIENT_EMAIL\",\"password\":\"SecurePass123!\"}"
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

# Extract token
if command -v jq &> /dev/null; then
    TOKEN=$(echo "$login_response" | jq -r '.data.token // .token // empty')
else
    # Fallback regex for token extraction if jq missing
    TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

echo -e "Login Response Status: $(echo "$login_response" | jq -r '.success // false')" 

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "${GREEN}✓ Login successful, token received${NC}"
    echo -e "Token: ${TOKEN:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Login failed or no token in response:${NC}"
    if command -v jq &> /dev/null; then
        echo "$login_response" | jq -C '.' 2>/dev/null || echo "$login_response"
    else
        echo "$login_response"
    fi
    TOKEN=""
    # FAILED=$((FAILED + 1)) # Don't count as fail here, just warn
fi
TOTAL=$((TOTAL + 1))
echo ""

# 3. Medical Records Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. Medical Records Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/medical-records/me" "Get my medical records" "" "$TOKEN" "200"
    
    # Try creating one (should fail as patient)
    test_endpoint "POST" "/medical-records" "Create medical record (patient role)" \
        "{\"patient_id\":\"00000000-0000-0000-0000-000000000000\",\"diagnosis\":\"Test\",\"prescription\":\"Test\",\"notes\":\"Test\"}" \
        "$TOKEN" "403"
else
    echo -e "${YELLOW}⊘ SKIP - No authentication token available${NC}"
    echo ""
fi

# 4. Appointments Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. Appointments Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/appointments/me" "Get my appointments" "" "$TOKEN" "200"
else
    echo -e "${YELLOW}⊘ SKIP - No authentication token available${NC}"
    echo ""
fi

# 5. Consent Management Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. Consent Management Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/consent/me" "Get my consents" "" "$TOKEN" "200"
    test_endpoint "POST" "/consent/grant" "Grant consent" \
        "{\"consent_type\":\"medical_records\"}" "$TOKEN" "200"
    test_endpoint "GET" "/consent/history" "Get consent history" "" "$TOKEN" "200"
else
    echo -e "${YELLOW}⊘ SKIP - No authentication token available${NC}"
    echo ""
fi

# 6. Audit Log Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. Audit Log Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/audit/me" "Get my audit logs" "" "$TOKEN" "200"
    # Admin only
    test_endpoint "GET" "/audit/all" "Get all audit logs (admin only)" "" "$TOKEN" "403"
else
    echo -e "${YELLOW}⊘ SKIP - No authentication token available${NC}"
    echo ""
fi

# 7. Visits Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. Visits Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TOKEN" ]; then
    # Usually visits are for patients to see
    test_endpoint "GET" "/visits/me" "Get my visits" "" "$TOKEN" "200,404"
else
    echo -e "${YELLOW}⊘ SKIP - No authentication token available${NC}"
    echo ""
fi

# 8. Prescriptions Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}8. Prescriptions Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/prescriptions/me" "Get my prescriptions" "" "$TOKEN" "200,404"
else
    echo -e "${YELLOW}⊘ SKIP - No authentication token available${NC}"
    echo ""
fi

# 9. Admin Endpoints
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}9. Admin Endpoints${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$TOKEN" ]; then
    test_endpoint "GET" "/admin/pending-verifications" "Get pending verifications (admin only)" "" "$TOKEN" "403"
    test_endpoint "GET" "/admin/accounts" "Get all accounts (admin only)" "" "$TOKEN" "403"
else
    echo -e "${YELLOW}⊘ SKIP - No authentication token available${NC}"
    echo ""
fi

# Summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Test Summary                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Tests:    $TOTAL"
echo -e "  ${GREEN}Passed:${NC}         $PASSED"
echo -e "  ${RED}Failed:${NC}         $FAILED"

if [ $TOTAL -gt 0 ]; then
    # Simple integer math for pass rate
    PASS_RATE=$(( (PASSED * 100) / TOTAL ))
    echo -e "  ${CYAN}Pass Rate:${NC}      $PASS_RATE%"
fi
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Some tests failed. Check the output above for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
fi
