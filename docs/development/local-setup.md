# Local Development Setup

Complete guide for setting up the DiscBaboons development environment locally using Kind Kubernetes.

## Prerequisites Installation

```bash
# Install required tools
brew install kind kubectl docker

# Verify installations
kind version
kubectl version --client
docker --version

# Start Docker Desktop (if not running)
open -a Docker
```

## Complete Project Setup

### First Time Setup

If you're setting up this project for the first time or on a new machine:

```bash
# 1. Clone and setup the project
git clone <your-repo-url>
cd discbaboons_k8s

# 2. Create Kind cluster
kind create cluster --config=kind-config.yaml --name discbaboons-learning

# 3. Verify cluster is running
kubectl cluster-info
kubectl get nodes

# 4. Build Express Docker image
cd apps/express-server
docker build -t discbaboons-express:v6 .
cd ../..

# 5. Load image into Kind cluster
kind load docker-image discbaboons-express:v6 --name discbaboons-learning

# 6. Apply all manifests in correct order
# PostgreSQL first (database layer)
kubectl apply -f manifests/postgres-pvc.yaml
kubectl apply -f manifests/postgres-configmap.yaml
kubectl apply -f manifests/postgres-secret.yaml
kubectl apply -f manifests/postgres-deployment.yaml
kubectl apply -f manifests/postgres-service.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment

# Flyway migrations (database schema)
kubectl apply -f manifests/flyway-configmap.yaml
kubectl apply -f manifests/flyway-migrations-configmap.yaml

# Express application (API layer)
kubectl apply -f manifests/express-configmap.yaml
kubectl apply -f manifests/express-secret.yaml
kubectl apply -f manifests/express-deployment.yaml
kubectl apply -f manifests/express-service.yaml

# 7. Wait for Express to be ready
kubectl wait --for=condition=available --timeout=300s deployment/express-deployment

# 8. Verify everything is running
kubectl get pods
kubectl get services

# 9. Access your application
kubectl port-forward service/express-service 8080:3000

# 10. Test the API endpoints
# In another terminal:
curl http://localhost:8080/health
curl http://localhost:8080/api/info
curl http://localhost:8080/api/users
```

### Quick Development Environment Deployment

For daily development (recommended approach):

```bash
# Deploy development environment to local Kind cluster
./rebuild-apps.sh

# Verify development configuration
kubectl exec deployment/express-deployment -- env | grep -E '(NODE_ENV|LOG_LEVEL)'
# Expected: NODE_ENV=development, LOG_LEVEL=debug

# Check replica count (single replica for development)
kubectl get pods -l app=express
```

**Note**: Production deployments are handled automatically via CI/CD pipeline to DigitalOcean Kubernetes. The local script only supports development environment deployment.

## Expected Output After Setup

```bash
# kubectl get pods should show:
NAME                                  READY   STATUS    RESTARTS   AGE
express-deployment-xxxxxxxxx-xxxxx    1/1     Running   0          2m
express-deployment-xxxxxxxxx-xxxxx    1/1     Running   0          2m
postgres-deployment-xxxxxxxxx-xxxxx   1/1     Running   0          5m

# kubectl get services should show:
NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
express-service    ClusterIP   10.96.xxx.xxx   <none>        3000/TCP   2m
postgres-service   ClusterIP   10.96.xxx.xxx   <none>        5432/TCP   5m
kubernetes         ClusterIP   10.96.0.1       <none>        443/TCP    10m
```

## Test Your Setup

```bash
# Test API endpoints
curl http://localhost:8080/health
# Expected: {"status":"healthy","timestamp":"..."}

curl http://localhost:8080/api/info
# Expected: {"success":true,"environment":"development","version":"1.0.0",...}

curl http://localhost:8080/api/users
# Expected: {"success":true,"data":[...users with profiles...]}

# Test database directly (optional)
kubectl port-forward service/postgres-service 5432:5432 &
psql -h localhost -p 5432 -U app_user -d discbaboons_db
# Password: secure_password_123
# \dt  # List tables
# SELECT * FROM flyway_schema_history;  # Check migrations
# \q   # Quit
```

## Common Setup Scenarios

### Scenario 1: Quick Resume (Cluster Already Running)
```bash
# Check if cluster is running
kubectl get nodes

# Check what's deployed
kubectl get pods,services

# Access your Express app
kubectl port-forward service/express-service 8080:3000
# Visit: http://localhost:8080
```

### Scenario 2: Fresh Start (Cluster Stopped/Deleted)
```bash
# 1. Create cluster
kind create cluster --config=kind-config.yaml

# 2. Build and load Express app
cd apps/express-server
docker build -t discbaboons-express:v1 .
kind load docker-image discbaboons-express:v1 --name discbaboons-learning

# 3. Deploy ConfigMap and application
cd ../../
kubectl apply -f manifests/express-configmap.yaml
kubectl apply -f manifests/express-deployment.yaml
kubectl apply -f manifests/express-service.yaml

# 4. Access application
kubectl port-forward service/express-service 8080:3000
# Visit: http://localhost:8080
```

### Scenario 3: App-Only Restart (Cluster Running, Want Fresh Deploy)
```bash
# Delete current deployment
kubectl delete -f manifests/express-deployment.yaml
kubectl delete -f manifests/express-service.yaml

# Redeploy (useful after code changes)
kubectl apply -f manifests/express-configmap.yaml
kubectl apply -f manifests/express-deployment.yaml
kubectl apply -f manifests/express-service.yaml

# Access application
kubectl port-forward service/express-service 8080:3000
```

## Next Steps

- Review [Daily Workflows](./workflows.md) for common development tasks
- Read [Testing Standards](./testing-standards.md) before writing code
- Check [Troubleshooting](./troubleshooting.md) if you encounter issues