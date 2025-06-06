#!/bin/bash
# filepath: rebuild-apps.sh

set -e  # Exit on any error

# Check if environment parameter is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <environment>"
    echo "Available environments: dev, prod"
    echo ""
    echo "Examples:"
    echo "  $0 dev    # Deploy development environment"
    echo "  $0 prod   # Deploy production environment"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Error: Environment must be 'dev' or 'prod'"
    echo "You provided: $ENVIRONMENT"
    exit 1
fi

echo "🔄 DiscBaboons K8s Application Rebuild Script"
echo "============================================="
echo "Environment: $ENVIRONMENT"
echo "Keeping cluster alive, rebuilding applications..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXPRESS_IMAGE="discbaboons-express:v6"
EXPRESS_DIR="apps/express-server"
CLUSTER_NAME="discbaboons-learning"
MANIFEST_ENV_DIR="manifests/${ENVIRONMENT}"

echo -e "${RED}🗑️  TEARDOWN PHASE${NC}"
echo "==================="

echo -e "${YELLOW}Step 1: Deleting Express application...${NC}"
kubectl delete deployment express-deployment --ignore-not-found=true
kubectl delete service express-service --ignore-not-found=true
kubectl delete configmap express-config --ignore-not-found=true
kubectl delete configmap monitoring-config --ignore-not-found=true

# Environment-specific teardown
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "  - Deleting production-specific resources..."
    kubectl delete serviceaccount express-service-account --ignore-not-found=true
    kubectl delete role express-role --ignore-not-found=true
    kubectl delete rolebinding express-rolebinding --ignore-not-found=true
    kubectl delete networkpolicy express-network-policy --ignore-not-found=true
    kubectl delete networkpolicy postgres-network-policy --ignore-not-found=true
    kubectl delete ingress express-ingress --ignore-not-found=true
    kubectl delete issuer letsencrypt-issuer --ignore-not-found=true
fi
echo "✅ Express application removed"

echo -e "${YELLOW}Step 2: Deleting Flyway configurations...${NC}"
kubectl delete configmap flyway-config --ignore-not-found=true
kubectl delete configmap flyway-migrations --ignore-not-found=true
echo "✅ Flyway configurations removed"

echo -e "${YELLOW}Step 3: Deleting PostgreSQL...${NC}"
kubectl delete deployment postgres-deployment --ignore-not-found=true
kubectl delete service postgres-service --ignore-not-found=true
kubectl delete configmap postgres-config --ignore-not-found=true
kubectl delete secret postgres-secret --ignore-not-found=true
kubectl delete pvc postgres-pvc --ignore-not-found=true
echo "✅ PostgreSQL removed"

echo -e "${YELLOW}Step 4: Waiting for all pods to terminate...${NC}"
kubectl wait --for=delete pod --selector=app=express --timeout=60s || true
kubectl wait --for=delete pod --selector=app=postgres --timeout=60s || true

echo -e "${YELLOW}Step 5: Verifying clean state...${NC}"
echo "Remaining pods:"
kubectl get pods
echo "Remaining services:"
kubectl get services
echo "Remaining PVCs:"
kubectl get pvc

echo ""
echo -e "${GREEN}🏗️  BUILD PHASE${NC}"
echo "================"

echo -e "${YELLOW}Step 6: Building fresh Express Docker image...${NC}"
cd ${EXPRESS_DIR}
echo "Building ${EXPRESS_IMAGE}..."
docker build -t ${EXPRESS_IMAGE} .
cd ../..
echo "✅ Express image built"

echo -e "${YELLOW}Step 7: Loading image into Kind cluster...${NC}"
kind load docker-image ${EXPRESS_IMAGE} --name ${CLUSTER_NAME}
echo "✅ Image loaded into cluster"

echo ""
echo -e "${GREEN}🚀 DEPLOYMENT PHASE${NC}"
echo "==================="

echo -e "${YELLOW}Step 8: Deploying PostgreSQL layer...${NC}"
echo "  8a. Creating PVC (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/postgres-pvc.yaml
echo "  8b. Creating ConfigMap (shared resource)..."
kubectl apply -f manifests/postgres-configmap.yaml
echo "  8c. Creating Secret (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/postgres-secret.yaml
echo "  8d. Creating Deployment (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/postgres-deployment.yaml
echo "  8e. Creating Service (shared resource)..."
kubectl apply -f manifests/postgres-service.yaml

# Apply production-specific network policies
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "  8f. Creating PostgreSQL network policy (production only)..."
    kubectl apply -f ${MANIFEST_ENV_DIR}/postgres-network-policy.yaml
fi

echo "  8g. Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment
echo "✅ PostgreSQL layer deployed and ready"

echo -e "${YELLOW}Step 9: Deploying Flyway migration configurations...${NC}"
echo "  9a. Creating Flyway config..."
kubectl apply -f manifests/flyway-configmap.yaml
echo "  9b. Creating migration files config..."
kubectl apply -f manifests/flyway-migrations-configmap.yaml
echo "✅ Flyway configurations deployed"

echo -e "${YELLOW}Step 10: Deploying Express application layer...${NC}"

# Deploy production-specific security resources first
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "  10a. Creating RBAC resources (production only)..."
    kubectl apply -f ${MANIFEST_ENV_DIR}/express-rbac.yaml
    echo "  10b. Creating Express network policy (production only)..."
    kubectl apply -f ${MANIFEST_ENV_DIR}/express-network-policy.yaml
fi

echo "  10c. Creating monitoring configuration (both environments)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/monitoring-config.yaml
echo "  10d. Creating Express ConfigMap (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-configmap.yaml
echo "  10e. Creating Express Deployment (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-deployment.yaml
echo "  10f. Creating Express Service (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-service.yaml

# Deploy production-specific ingress and SSL
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "  10g. Creating Let's Encrypt issuer (production only)..."
    kubectl apply -f ${MANIFEST_ENV_DIR}/letsencrypt-issuer.yaml
    echo "  10h. Creating Express ingress (production only)..."
    kubectl apply -f ${MANIFEST_ENV_DIR}/express-ingress.yaml
fi

echo "  10i. Waiting for Express application to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/express-deployment
echo "✅ Express application deployed and ready"

echo ""
echo -e "${GREEN}✅ VERIFICATION PHASE${NC}"
echo "====================="

echo -e "${YELLOW}Step 11: Verifying deployment status...${NC}"
echo "Pod status:"
kubectl get pods -o wide

echo ""
echo "Service status:"
kubectl get services

echo ""
echo "PVC status:"
kubectl get pvc

# Environment-specific verification
if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo ""
    echo "Production-specific resources:"
    echo "Service Accounts:"
    kubectl get serviceaccounts | grep express || echo "  No express service account found"
    echo "Network Policies:"
    kubectl get networkpolicies
    echo "Ingress:"
    kubectl get ingress
    echo "SSL Issuers:"
    kubectl get issuers || echo "  No issuers found (cert-manager may not be installed)"
else
    echo ""
    echo "Development environment - RBAC and network policies not applied"
fi

echo ""
echo "ConfigMaps:"
kubectl get configmaps

echo -e "${YELLOW}Step 12: Checking database migrations...${NC}"
echo "Waiting for migrations to complete..."
sleep 5
kubectl exec deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;" 2>/dev/null || echo "Migration table not yet ready, this is normal for fresh deploys"

echo -e "${YELLOW}Step 13: Testing application health...${NC}"
# Get one of the express pods for testing
EXPRESS_POD=$(kubectl get pods -l app=express -o jsonpath='{.items[0].metadata.name}')
echo "Testing health endpoint in pod: ${EXPRESS_POD}"
kubectl exec ${EXPRESS_POD} -- wget -qO- http://localhost:3000/health || echo "Health check pending..."

echo ""
echo -e "${GREEN}🎉 APPLICATION REBUILD COMPLETE!${NC}"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"

if [[ "$ENVIRONMENT" == "prod" ]]; then
    echo "📋 Production Environment:"
    echo "- Ingress configured for external access"
    echo "- Network policies active (pod-to-pod traffic restricted)"
    echo "- RBAC enabled with minimal permissions"
    echo "- Security contexts enforced (non-root execution)"
    echo "- SSL/TLS configured via Let's Encrypt"
    echo ""
    echo "🌐 Access methods:"
    echo "1. Via ingress (if DNS configured):"
    echo "   https://your-domain.com"
    echo ""
    echo "2. Via port forwarding (bypasses network policies):"
    echo "   kubectl port-forward service/express-service 8080:3000"
    echo "   curl http://localhost:8080/health"
else
    echo "🛠️  Development Environment:"
    echo "- Security contexts active (non-root execution)"
    echo "- Monitoring configuration enabled"
    echo "- No network policies (unrestricted pod communication)"
    echo "- No RBAC (uses default service account)"
    echo ""
    echo "🌐 Access via port forwarding:"
    echo "   kubectl port-forward service/express-service 8080:3000"
fi

echo ""
echo "🔍 Common operations:"
echo "2. Test your API endpoints:"
echo "   curl http://localhost:8080/health"
echo "   curl http://localhost:8080/api/info"
echo "   curl http://localhost:8080/api/users"
echo ""
echo "3. View logs:"
echo "   kubectl logs -f deployment/express-deployment"
echo "   kubectl logs -f deployment/postgres-deployment"
echo ""
echo "4. Access PostgreSQL directly:"
echo "   kubectl port-forward service/postgres-service 5432:5432"
echo "   psql -h localhost -p 5432 -U app_user -d discbaboons_db"
echo ""

# Optional: Auto-start port forwarding
read -p "Would you like to start port forwarding now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting port forwarding on http://localhost:8080..."
    echo "Press Ctrl+C to stop"
    kubectl port-forward service/express-service 8080:3000
fi