#!/bin/bash
# filepath: rebuild-prod.sh
# Production environment rebuild script with safety checks

set -e  # Exit on any error

echo "🚀 DiscBaboons K8s Production Rebuild"
echo "======================================"
echo "Preparing production environment deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT WARNING${NC}"
echo "=================================="
echo "You are about to deploy to PRODUCTION configuration."
echo "This will use:"
echo "• Production logging (LOG_LEVEL: info)"
echo "• Production mode (NODE_ENV: production)"
echo "• Higher resource limits"
echo "• Multiple replicas for availability"
echo ""

# Safety confirmation
read -p "Are you sure you want to proceed with PRODUCTION deployment? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Production deployment cancelled."
    exit 0
fi

echo -e "${YELLOW}Calling main rebuild script with 'prod' environment...${NC}"
echo ""

# Call the main rebuild script with prod environment
./rebuild-apps.sh prod

echo ""
echo -e "${GREEN}🎯 PRODUCTION ENVIRONMENT READY!${NC}"
echo "================================="
echo ""
echo -e "${BLUE}Production-specific features active:${NC}"
echo "• Info-level logging (LOG_LEVEL: info)"
echo "• Production mode (NODE_ENV: production)"
echo "• Production resource limits"
echo "• Multiple replicas for high availability"
echo ""
echo -e "${BLUE}Production verification commands:${NC}"
echo "• Check replicas: kubectl get pods -l app=express"
echo "• Test API: curl http://localhost:8080/health"
echo "• Monitor logs: kubectl logs -f deployment/express-deployment --all-containers=true"
echo "• Check env: kubectl exec deployment/express-deployment -- env | grep -E '(NODE_ENV|LOG_LEVEL)'"
echo ""
echo -e "${YELLOW}Remember to monitor your production deployment!${NC}"
