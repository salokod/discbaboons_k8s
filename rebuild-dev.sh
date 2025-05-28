#!/bin/bash
# filepath: rebuild-dev.sh
# Quick development environment rebuild script

set -e  # Exit on any error

echo "🔄 DiscBaboons K8s Development Rebuild"
echo "======================================"
echo "Rebuilding development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Calling main rebuild script with 'dev' environment...${NC}"
echo ""

# Call the main rebuild script with dev environment
./rebuild-apps.sh dev

echo ""
echo -e "${GREEN}🎯 DEVELOPMENT ENVIRONMENT READY!${NC}"
echo "================================="
echo ""
echo -e "${BLUE}Development-specific features active:${NC}"
echo "• Debug logging enabled (LOG_LEVEL: debug)"
echo "• Development mode (NODE_ENV: development)"
echo "• Lower resource limits for local development"
echo "• Single replica for faster iteration"
echo ""
echo -e "${BLUE}Quick dev commands:${NC}"
echo "• Test API: curl http://localhost:8080/health"
echo "• View logs: kubectl logs -f deployment/express-deployment"
echo "• Check env: kubectl exec deployment/express-deployment -- env | grep -E '(NODE_ENV|LOG_LEVEL)'"
