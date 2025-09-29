#!/bin/bash

# Security audit script for Activation app
# This script checks for sensitive information that shouldn't be in the codebase

set -e

echo "🔒 Running security audit for Activation app..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ISSUES=0
WARNINGS=0

# Function to check for sensitive patterns
check_pattern() {
    local pattern="$1"
    local description="$2"
    local severity="$3"
    
    echo "Checking for $description..."
    
    local matches=$(grep -r -i "$pattern" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "// TODO" | grep -v "// FIXME" | grep -v "example" | grep -v "placeholder" || true)
    
    if [ -n "$matches" ]; then
        if [ "$severity" = "error" ]; then
            echo -e "${RED}❌ FOUND: $description${NC}"
            echo "$matches"
            ISSUES=$((ISSUES + 1))
        else
            echo -e "${YELLOW}⚠️  WARNING: $description${NC}"
            echo "$matches"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${GREEN}✅ OK: No $description found${NC}"
    fi
    echo
}

# Check for hardcoded credentials
check_pattern "admin.*password|password.*admin" "hardcoded admin credentials" "error"
check_pattern "activation2024" "hardcoded default password" "error"
check_pattern "sk-[a-zA-Z0-9]{20,}" "OpenAI API keys" "error"
check_pattern "pk_[a-zA-Z0-9]{20,}" "Stripe API keys" "error"
check_pattern "AIza[0-9A-Za-z\\-_]{35}" "Google API keys" "error"
check_pattern "AKIA[0-9A-Z]{16}" "AWS access keys" "error"
check_pattern "ya29\\.[0-9A-Za-z\\-_]+" "Google OAuth tokens" "error"

# Check for sensitive URLs
check_pattern "https://[^/]*\\.amazonaws\\.com" "AWS URLs (should use env vars)" "warning"
check_pattern "https://[^/]*\\.googleapis\\.com" "Google API URLs (should use env vars)" "warning"

# Check for console.log with sensitive data
echo "Checking for console.log with potential sensitive data..."
console_logs=$(grep -r "console\\.log" src/ --include="*.ts" --include="*.tsx" | grep -i -E "(password|secret|key|token|credential)" || true)
if [ -n "$console_logs" ]; then
    echo -e "${YELLOW}⚠️  WARNING: console.log statements with sensitive data${NC}"
    echo "$console_logs"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ OK: No console.log with sensitive data${NC}"
fi
echo

# Check for environment variable usage
echo "Checking environment variable usage..."
env_usage=$(grep -r "import\\.meta\\.env" src/ --include="*.ts" --include="*.tsx" | wc -l)
if [ "$env_usage" -gt 0 ]; then
    echo -e "${GREEN}✅ OK: Using environment variables ($env_usage instances)${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: No environment variables found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo

# Check for .env files in git
echo "Checking for .env files in git..."
if git ls-files | grep -q "\.env"; then
    echo -e "${RED}❌ ERROR: .env files are tracked in git${NC}"
    git ls-files | grep "\.env"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ OK: No .env files tracked in git${NC}"
fi
echo

# Check for secrets in package.json
echo "Checking package.json for secrets..."
if grep -q -i -E "(password|secret|key|token)" package.json; then
    echo -e "${YELLOW}⚠️  WARNING: Potential secrets in package.json${NC}"
    grep -i -E "(password|secret|key|token)" package.json
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ OK: No secrets in package.json${NC}"
fi
echo

# Check for hardcoded URLs that should be configurable
echo "Checking for hardcoded URLs..."
hardcoded_urls=$(grep -r -E "https?://[^/]*\\.(com|net|org)" src/ --include="*.ts" --include="*.tsx" | grep -v "example" | grep -v "placeholder" | grep -v "localhost" || true)
if [ -n "$hardcoded_urls" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Hardcoded URLs found${NC}"
    echo "$hardcoded_urls"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ OK: No hardcoded URLs found${NC}"
fi
echo

# Check for TODO/FIXME comments with sensitive info
echo "Checking TODO/FIXME comments..."
todos=$(grep -r -i -E "(TODO|FIXME).*(password|secret|key|token|credential)" src/ --include="*.ts" --include="*.tsx" || true)
if [ -n "$todos" ]; then
    echo -e "${YELLOW}⚠️  WARNING: TODO/FIXME comments with sensitive references${NC}"
    echo "$todos"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ OK: No sensitive TODO/FIXME comments${NC}"
fi
echo

# Summary
echo "=========================================="
echo "🔒 Security Audit Summary"
echo "=========================================="

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ PASS: No security issues found!${NC}"
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS warnings found (no critical issues)${NC}"
    exit 0
else
    echo -e "${RED}❌ FAIL: $ISSUES critical issues and $WARNINGS warnings found${NC}"
    echo
    echo "Please fix the critical issues before deploying to production."
    exit 1
fi
