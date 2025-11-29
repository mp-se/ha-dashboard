#!/bin/bash

# Self-signed SSL Certificate Generation Script
# For use in development and home LAN deployments

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Self-Signed SSL Certificate Generator ===${NC}"
echo ""

# Check if openssl is installed
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is not installed${NC}"
    echo "Please install OpenSSL:"
    echo "  macOS (Homebrew): brew install openssl"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  CentOS/RHEL: sudo yum install openssl"
    exit 1
fi

# Function to prompt with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local response

    if [ -z "$default" ]; then
        read -p "$prompt: " response
    else
        read -p "$prompt [$default]: " response
        response="${response:-$default}"
    fi
    echo "$response"
}

echo "Enter certificate details (press Enter to use defaults):"
echo ""

# Prompt for certificate details
COUNTRY=$(prompt_with_default "Country code (C)" "US")
STATE=$(prompt_with_default "State or Province (ST)" "State")
CITY=$(prompt_with_default "City or Locality (L)" "City")
ORG=$(prompt_with_default "Organization (O)" "Organization")
DOMAIN=$(prompt_with_default "Common Name (domain)" "domain.local")
VALIDITY=$(prompt_with_default "Validity in days" "365")

echo ""
echo -e "${YELLOW}Generating certificate with the following details:${NC}"
echo "  Country: $COUNTRY"
echo "  State: $STATE"
echo "  City: $CITY"
echo "  Organization: $ORG"
echo "  Domain: $DOMAIN"
echo "  Valid for: $VALIDITY days"
echo ""

# Generate private key and self-signed certificate
echo "Generating private key and certificate..."
openssl req -x509 \
    -newkey rsa:4096 \
    -keyout server.key \
    -out server.crt \
    -days "$VALIDITY" \
    -nodes \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$DOMAIN"

# Copy certificate as CA for client distribution
cp server.crt ca.crt

echo ""
echo -e "${GREEN}✓ Certificate generated successfully!${NC}"
echo ""
echo "Generated files:"
echo "  - server.crt (Server certificate)"
echo "  - server.key (Private key)"
echo "  - ca.crt (CA certificate for client installation)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Distribute ca.crt to devices that need to trust this certificate"
echo "2. Restart the Docker container: docker-compose restart"
echo "3. Access the dashboard at: https://$DOMAIN:8443"
echo ""
echo -e "${YELLOW}⚠ Security Reminder:${NC}"
echo "  - Never commit server.key to version control"
echo "  - Keep server.key secure - only Docker needs access"
echo "  - Install ca.crt on client devices for seamless PWA access"
echo ""
