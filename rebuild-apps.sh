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

echo -e "${YELLOW}Step 2: Deleting Redis...${NC}"
kubectl delete deployment redis-deployment --ignore-not-found=true
kubectl delete service redis-service --ignore-not-found=true
echo "✅ Redis removed"

echo -e "${YELLOW}Step 3: Deleting Flyway configurations...${NC}"
kubectl delete configmap flyway-config --ignore-not-found=true
kubectl delete configmap flyway-migrations --ignore-not-found=true
echo "✅ Flyway configurations removed"

echo -e "${YELLOW}Step 4: Deleting PostgreSQL...${NC}"
kubectl delete deployment postgres-deployment --ignore-not-found=true
kubectl delete service postgres-service --ignore-not-found=true
kubectl delete configmap postgres-config --ignore-not-found=true
kubectl delete secret postgres-secret --ignore-not-found=true
kubectl delete pvc postgres-pvc --ignore-not-found=true
echo "✅ PostgreSQL removed"

echo -e "${YELLOW}Step 5: Waiting for all pods to terminate...${NC}"
kubectl wait --for=delete pod --selector=app=express --timeout=60s || true
kubectl wait --for=delete pod --selector=app=redis --timeout=60s || true
kubectl wait --for=delete pod --selector=app=postgres --timeout=60s || true

echo -e "${YELLOW}Step 6: Verifying clean state...${NC}"
echo "Remaining pods:"
kubectl get pods
echo "Remaining services:"
kubectl get services
echo "Remaining PVCs:"
kubectl get pvc

echo ""
echo -e "${GREEN}🏗️  BUILD PHASE${NC}"
echo "================"

echo -e "${YELLOW}Step 7: Building fresh Express Docker image...${NC}"
cd ${EXPRESS_DIR}
echo "Building ${EXPRESS_IMAGE}..."
docker build -t ${EXPRESS_IMAGE} .
cd ../..
echo "✅ Express image built"

echo -e "${YELLOW}Step 8: Loading image into Kind cluster...${NC}"
kind load docker-image ${EXPRESS_IMAGE} --name ${CLUSTER_NAME}
echo "✅ Image loaded into cluster"

echo ""
echo -e "${GREEN}🚀 DEPLOYMENT PHASE${NC}"
echo "==================="

echo -e "${YELLOW}Step 9: Deploying PostgreSQL layer...${NC}"
echo "  9a. Creating PVC (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/postgres-pvc.yaml
echo "  9b. Creating ConfigMap (shared resource)..."
kubectl apply -f manifests/postgres-configmap.yaml
echo "  9c. Creating Secret (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/postgres-secret.yaml
echo "  9d. Creating Deployment (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/postgres-deployment.yaml
echo "  9e. Creating Service (shared resource)..."
kubectl apply -f manifests/postgres-service.yaml

echo "  9f. Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment
echo "✅ PostgreSQL layer deployed and ready"

echo -e "${YELLOW}Step 10: Deploying Redis layer...${NC}"
echo "  10a. Creating Redis Deployment..."
kubectl apply -f ${MANIFEST_ENV_DIR}/redis-deployment.yaml
echo "  10b. Creating Redis Service..."
kubectl apply -f ${MANIFEST_ENV_DIR}/redis-service.yaml

echo "  10c. Waiting for Redis to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/redis-deployment
echo "✅ Redis layer deployed and ready"

echo -e "${YELLOW}Step 11: Auto-generating and deploying Flyway migration configurations...${NC}"
echo "  11a. Generating migration ConfigMap from actual files..."

# Start the ConfigMap YAML
cat > flyway-migrations-configmap-generated.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: flyway-migrations
data:
EOF

# Add each migration file to the ConfigMap
for migration_file in migrations/V*.sql; do
  if [ -f "$migration_file" ]; then
    filename=$(basename "$migration_file")
    echo "📁 Adding $filename to ConfigMap..."
    
    # Add the file to ConfigMap with proper YAML escaping
    echo -n "  $filename: \"" >> flyway-migrations-configmap-generated.yaml
    
    # Escape the SQL content for YAML (replace newlines with \n, escape quotes)
    sed 's/\\/\\\\/g; s/"/\\"/g; s/$/\\n/g' "$migration_file" | tr -d '\n' >> flyway-migrations-configmap-generated.yaml
    
    echo "\"" >> flyway-migrations-configmap-generated.yaml
  fi
done

echo "✅ Generated ConfigMap with $(ls migrations/V*.sql | wc -l) migration files"

echo "  11b. Creating Flyway config (environment-specific)..."
kubectl apply -f ${MANIFEST_ENV_DIR}/flyway-configmap.yaml

echo "  11c. Applying auto-generated migration ConfigMap..."
kubectl apply -f flyway-migrations-configmap-generated.yaml

# Verify all migrations are present
CONFIGMAP_FILES=$(kubectl get configmap flyway-migrations -o jsonpath='{.data}' | jq -r 'keys[]' | grep '^V.*\.sql$' | wc -l)
LOCAL_FILES=$(ls migrations/V*.sql | wc -l)

if [ "$CONFIGMAP_FILES" -eq "$LOCAL_FILES" ]; then
  echo "✅ All $LOCAL_FILES migration files successfully added to ConfigMap"
else
  echo "❌ Mismatch: $LOCAL_FILES local files vs $CONFIGMAP_FILES in ConfigMap"
  exit 1
fi

echo "✅ Flyway configurations deployed with auto-generated migrations"

echo -e "${YELLOW}Step 12: Deploying Express application layer...${NC}"

echo "  12a. Creating Express secrets..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-secrets.yaml
echo "  12b. Creating monitoring configuration..."
kubectl apply -f ${MANIFEST_ENV_DIR}/monitoring-config.yaml
echo "  12c. Creating Express ConfigMap..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-configmap.yaml
echo "  12d. Creating Express Deployment..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-deployment.yaml
echo "  12e. Creating Express Service..."
kubectl apply -f ${MANIFEST_ENV_DIR}/express-service.yaml

echo "  12f. Waiting for Express application to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/express-deployment
echo "✅ Express application deployed and ready"

echo ""
echo -e "${YELLOW}Step 15.5: Loading disc-data.json into disc_master table...${NC}"

# Convert disc-data.json to SQL insert statements and load into Postgres
if [ -f "disc-data.json" ]; then
  echo "Parsing disc-data.json and inserting into disc_master..."

  # Generate a temp SQL file
  python3 -c '
import json
with open("disc-data.json") as f:
    discs = json.load(f)
with open("disc_master_seed.sql", "w") as out:
    for d in discs:
        brand = d.get("brand", "Unknown").replace("\x27", "\x27\x27")
        model = d.get("title", "Unknown").replace("\x27", "\x27\x27")
        speed = d.get("speed", "NULL")
        glide = d.get("glide", "NULL")
        turn = d.get("turn", "NULL")
        fade = d.get("fade", "NULL")
        out.write(f"INSERT INTO disc_master (id, brand, model, speed, glide, turn, fade, approved, added_by_id, created_at, updated_at) VALUES (gen_random_uuid(), \x27{brand}\x27, \x27{model}\x27, {speed}, {glide}, {turn}, {fade}, TRUE, 1, NOW(), NOW());\n")
  '

  # Copy the SQL file into the Postgres pod and execute it
  POSTGRES_POD=$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl cp disc_master_seed.sql $POSTGRES_POD:/tmp/disc_master_seed.sql
  kubectl exec $POSTGRES_POD -- psql -U app_user -d discbaboons_db -f /tmp/disc_master_seed.sql

  echo "✅ disc_master table seeded from disc-data.json"
else
  echo "disc-data.json not found, skipping disc_master seeding."
fi

echo ""
echo -e "${YELLOW}Step 15.6: Loading course-data.csv into courses table...${NC}"

# Convert course-data.csv to SQL insert statements and load into Postgres
if [ -f "course-data.csv" ]; then
  echo "Parsing course-data.csv and inserting into courses..."

  # Generate a temp SQL file using dedicated Python script
  python3 scripts/import_courses.py

  # Copy the SQL file into the Postgres pod and execute it
  POSTGRES_POD=$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')
  kubectl cp courses_seed.sql $POSTGRES_POD:/tmp/courses_seed.sql
  kubectl exec $POSTGRES_POD -- psql -U app_user -d discbaboons_db -f /tmp/courses_seed.sql

  echo "✅ courses table seeded from course-data.csv"
else
  echo "course-data.csv not found, skipping courses seeding."
fi

echo ""
echo -e "${GREEN}✅ VERIFICATION PHASE${NC}"
echo "====================="

echo -e "${YELLOW}Step 13: Verifying deployment status...${NC}"
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

echo -e "${YELLOW}Step 14: Testing Redis connectivity...${NC}"
echo "Testing Redis connection..."
kubectl run redis-test --image=redis:7-alpine --rm -it --restart=Never -- redis-cli -h redis-service ping || echo "Redis connection test pending..."

echo -e "${YELLOW}Step 15: Checking database migrations...${NC}"
echo "Waiting for migrations to complete..."
sleep 5
kubectl exec deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;" 2>/dev/null || echo "Migration table not yet ready, this is normal for fresh deploys"

echo -e "${YELLOW}Step 16: Testing application health...${NC}"
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
echo "- Auto-generated migration ConfigMap from source files"
echo "- Security contexts active (non-root execution)"
echo "- Monitoring configuration enabled"
echo "- Redis cache layer deployed"
echo "- No network policies (unrestricted pod communication)"
echo "- No RBAC (uses default service account)"
echo ""
echo "🌐 Access via port forwarding:"
echo "   kubectl port-forward service/express-service 8080:3000"

echo ""
echo "🔍 Common operations:"
echo "1. Test your API endpoints:"
echo "   curl http://localhost:8080/health"
echo "   curl http://localhost:8080/api/info"
echo "   curl http://localhost:8080/api/users"
echo ""
echo "2. View logs:"
echo "   kubectl logs -f deployment/express-deployment"
echo "   kubectl logs -f deployment/postgres-deployment"
echo "   kubectl logs -f deployment/redis-deployment"
echo ""
echo "3. Access PostgreSQL directly:"
echo "   kubectl port-forward service/postgres-service 5432:5432"
echo "   psql -h localhost -p 5432 -U app_user -d discbaboons_db"
echo ""
echo "4. Test Redis directly:"
echo "   kubectl run redis-test --image=redis:7-alpine --rm -it --restart=Never -- redis-cli -h redis-service"
echo ""

# Cleanup generated file
echo -e "${YELLOW}Cleaning up temporary files...${NC}"
rm -f flyway-migrations-configmap-generated.yaml
rm -f disc_master_seed.sql
rm -f courses_seed.sql
echo "✅ Temporary files cleaned up"

# Optional: Auto-start port forwarding
read -p "Would you like to start port forwarding now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting port forwarding on http://localhost:8080..."
    echo "Press Ctrl+C to stop"
    kubectl port-forward service/express-service 8080:3000
fi