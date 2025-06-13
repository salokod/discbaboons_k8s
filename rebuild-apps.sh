#!/bin/bash
# filepath: rebuild-apps.sh

set -e  # Exit on any error

# Force dev environment - no production deployments allowed
ENVIRONMENT="dev"

# Ensure we're using k-local kubectl context
echo "🔄 Switching to k-local context..."
kubectl config use-context kind-discbaboons-learning

# Verify we're connected to the correct cluster
CURRENT_CONTEXT=$(kubectl config current-context)
EXPECTED_CONTEXT="kind-discbaboons-learning"

if [[ "$CURRENT_CONTEXT" != "$EXPECTED_CONTEXT" ]]; then
    echo "❌ Error: kubectl is not connected to the expected local cluster"
    echo "Expected: $EXPECTED_CONTEXT"
    echo "Current:  $CURRENT_CONTEXT"
    echo ""
    echo "Please ensure k-local alias is correctly configured to connect to kind-discbaboons-learning"
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
kubectl delete secret express-secrets --ignore-not-found=true

# Environment-specific teardown
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

echo "  8g. Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment
echo "✅ PostgreSQL layer deployed and ready"

echo -e "${YELLOW}Step 9: Preparing and deploying Flyway migration configurations...${NC}"
echo "  9a. Regenerating migrations ConfigMap from migration files..."
# Auto-generate flyway-migrations-configmap.yaml from migration files
kubectl create configmap flyway-migrations \
  --from-file=migrations/ \
  --dry-run=client \
  -o yaml > manifests/flyway-migrations-configmap.yaml
echo "  9b. Creating Flyway config (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/flyway-configmap.yaml
echo "  9c. Creating migration files config (shared)..."
kubectl apply -f manifests/flyway-migrations-configmap.yaml
echo "✅ Flyway configurations deployed with latest migrations"

echo -e "${YELLOW}Step 10: Deploying Express application layer...${NC}"

echo "  10a. Creating Express secrets..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-secrets.yaml
echo "  10c. Creating monitoring configuration..."
kubectl apply -f ${MANIFEST_ENV_DIR}/monitoring-config.yaml
echo "  10d. Creating Express ConfigMap..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-configmap.yaml
echo "  10e. Creating Express Deployment..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-deployment.yaml
echo "  10f. Creating Express Service..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-service.yaml

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

echo ""
echo "Development environment - RBAC and network policies not applied"

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

echo "🛠️  Development Environment:"
echo "- Security contexts active (non-root execution)"
echo "- Monitoring configuration enabled"
echo "- No network policies (unrestricted pod communication)"
echo "- No RBAC (uses default service account)"
echo ""
echo "🌐 Access via port forwarding:"
echo "   kubectl port-forward service/express-service 8080:3000"

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