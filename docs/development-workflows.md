# Development Workflows & Commands

This document contains development workflows, debugging commands, and operational procedures for the Kubernetes cluster.

## Daily Development Workflow

### Multi-Environment Quick Start (Recommended)

#### Development Environment (Fast Iteration)
```bash
# Quick development environment deployment
./rebuild-dev.sh

# Verify development configuration
kubectl exec deployment/express-deployment -- env | grep -E '(NODE_ENV|LOG_LEVEL)'
# Expected: NODE_ENV=development, LOG_LEVEL=debug

# Check replica count (should be 1 for dev)
kubectl get pods -l app=express
```

#### Production Environment (Testing Production Config)
```bash
# Deploy production environment (with safety confirmation)
./rebuild-prod.sh

# Verify production configuration
kubectl exec deployment/express-deployment -- env | grep -E '(NODE_ENV|LOG_LEVEL)'
# Expected: NODE_ENV=production, LOG_LEVEL=info

# Check replica count (should be 3 for prod)
kubectl get pods -l app=express
```

#### Environment-Specific Deployment
```bash
# Deploy specific environment using main script
./rebuild-apps.sh dev     # Development environment
./rebuild-apps.sh prod    # Production environment
./rebuild-apps.sh staging # Error: Invalid environment (shows usage)
```

### Legacy Workflows (Manual Deployment)

#### Option 1: Quick Resume (Cluster Already Running)
```bash
# Check if cluster is running
kubectl get nodes

# Check what's deployed
kubectl get pods,services

# Access your Express app
kubectl port-forward service/express-service 8080:3000
# Visit: http://localhost:8080
```

#### Option 2: Fresh Start (Cluster Stopped/Deleted)
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

#### Option 3: App-Only Restart (Cluster Running, Want Fresh Deploy)
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

## Code Changes Workflow

### When You Modify Express Server Code (server.js)
```bash
# 1. Navigate to express app
cd apps/express-server

# 2. Build new Docker image with incremented version
docker build -t discbaboons-express:v4 .  # Increment version number

# 3. Load new image into Kind cluster
kind load docker-image discbaboons-express:v4 --name discbaboons-learning

# 4. Update deployment to use new image, update in express-deployment.yaml then apply
kubectl apply -f manifests/express-deployment.yaml

# 5. Verify deployment updated
kubectl get pods -w  # Watch pods restart

# 6. Test your changes
kubectl port-forward service/express-service 8080:3000
```

### When You Modify ConfigMap (Configuration Changes)
```bash
# 1. Edit the ConfigMap file
# manifests/express-configmap.yaml

# 2. Apply the updated ConfigMap
kubectl apply -f manifests/express-configmap.yaml

# 3. Restart pods to pick up new configuration
kubectl rollout restart deployment/express-deployment

# 4. Verify new config is loaded
kubectl exec deployment/express-deployment -- printenv | grep -E "(NODE_ENV|PORT|LOG_LEVEL)"
```

## Useful Commands

### Cluster Management
```bash
# List all Kind clusters
kind get clusters

# Delete cluster (when done learning for extended period)
kind delete cluster --name discbaboons-learning

# Check cluster health
kubectl cluster-info
kubectl get nodes
```

### Application Debugging
```bash
# See all resources
kubectl get all

# Check pod status
kubectl get pods -o wide

# View pod logs
kubectl logs -l app=express --follow

# Describe deployment
kubectl describe deployment express-deployment

# Scale application
kubectl scale deployment express-deployment --replicas=3
```

### ConfigMap Management
```bash
# View all ConfigMaps
kubectl get configmaps

# View specific ConfigMap details
kubectl describe configmap express-config

# View ConfigMap YAML
kubectl get configmap express-config -o yaml

# Edit ConfigMap directly (alternative to file editing)
kubectl edit configmap express-config
```

### Development & Testing
```bash
# Run tests locally
cd apps/express-server
npm test

# Lint code
npm run lint

# Build new image after changes (remember to increment version!)
docker build -t discbaboons-express:v3 .
kind load docker-image discbaboons-express:v3 --name discbaboons-learning

# Update deployment with new image
kubectl set image deployment/express-deployment express=discbaboons-express:v3
```

### PostgreSQL Database Management
```bash
# Create PostgreSQL service (for local development)
kubectl apply -f manifests/postgres-service.yaml

# Port forward for local database access (DEVELOPMENT ONLY!)
kubectl port-forward service/postgres-service 5432:5432

# Get database credentials
kubectl get secret postgres-secret -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d

# Connect via command line
psql -h localhost -p 5432 -U app_user -d discbaboons_db

# DBeaver connection settings:
# Host: localhost, Port: 5432, Database: discbaboons_db, User: app_user

# ⚠️ PRODUCTION: Never use port-forward to production databases!
# Use bastion hosts, read replicas, or monitoring dashboards instead
```

## Secret Management Security
```bash
# Create secrets imperatively (not stored in files)
kubectl create secret generic express-secret \
  --from-literal=JWT_SECRET=supersecretjwtkey123 \
  --from-literal=API_KEY=mycompanyapikey456 \
  --from-literal=DB_PASSWORD=postgres123

# View secrets (base64 encoded)
kubectl get secret express-secret -o yaml

# Never commit secret YAML files to git!
echo "manifests/*-secret.yaml" >> .gitignore
```

**⚠️ Security Warning**: Base64 is encoding, NOT encryption. Anyone with access to secret YAML files can decode them easily.

## Init Container Patterns

**Standard Init Container Pattern:**
```yaml
initContainers:
- name: wait-for-postgres
  image: postgres:17-alpine
  command: ['sh', '-c', 'until pg_isready -h postgres-service -p 5432 -U app_user -d discbaboons_db; do echo "Waiting for PostgreSQL..."; sleep 2; done; echo "PostgreSQL is ready!"']
```

**Key Commands:**
```bash
# Check init container logs
kubectl logs pod-name -c init-container-name --follow

# Watch pod status during init
kubectl get pods -l app=express -w

# Force deployment rollout to pick up init container changes
kubectl rollout restart deployment/express-deployment
```

**Debugging Init Containers:**
- **Pod status `Init:0/1`**: Init container running but not completed
- **Pod status `PodInitializing`**: Init container completed, main container starting
- **Rolling updates**: Old pods without init containers may coexist with new ones
- **Target specific containers**: Use `-c container-name` for logs and debugging

## Production Health Checks

**Example production-ready PostgreSQL deployment patterns:**
```yaml
# Health checks with proper timing
livenessProbe:
  exec:
    command: ['pg_isready', '-U', 'app_user', '-d', 'discbaboons_db']
  initialDelaySeconds: 30  # Give database time to initialize
  periodSeconds: 5
  
readinessProbe:
  exec:
    command: ['pg_isready', '-U', 'app_user', '-d', 'discbaboons_db']
  initialDelaySeconds: 5   # Quick readiness check
  periodSeconds: 5

# Resource limits for stable performance
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Advanced Development Workflows

### Multi-Environment Development Strategy

#### Environment-Specific Deployment Scripts

**Development Environment (Fast Iteration)**:
```bash
# Quick development deployment
./rebuild-dev.sh

# Features:
# - NODE_ENV=development
# - LOG_LEVEL=debug  
# - Single replica for fast iteration
# - Lower resource limits
# - No network policies or RBAC
```

**Production Environment (Local Testing)**:
```bash
# Test production configuration locally
./rebuild-prod.sh

# Features:
# - NODE_ENV=production
# - LOG_LEVEL=info
# - Multiple replicas (3) for HA simulation
# - Production resource limits
# - Full RBAC and network policies
# - Security contexts enforced
```

**Parameterized Main Script**:
```bash
# Flexible deployment with environment parameter
./rebuild-apps.sh dev     # Development environment
./rebuild-apps.sh prod    # Production environment
./rebuild-apps.sh staging # Error: Invalid environment (shows usage)
```

### Code Development Workflow

#### Express Server Development Cycle
```bash
# 1. Make code changes to server.js
vim apps/express-server/server.js

# 2. Run tests locally before building
cd apps/express-server
npm test                    # Unit tests
npm run test:integration   # Integration tests  
npm run lint               # Code quality

# 3. Build new Docker image (increment version)
docker build -t discbaboons-express:v8 .

# 4. Load into Kind cluster
kind load docker-image discbaboons-express:v8 --name discbaboons-learning

# 5. Update deployment manifest
vim manifests/dev/express-deployment.yaml
# Change: image: discbaboons-express:v8

# 6. Apply updated deployment
kubectl apply -f manifests/dev/express-deployment.yaml

# 7. Watch pods restart
kubectl get pods -w

# 8. Test changes
kubectl port-forward service/express-service 8080:3000
curl http://localhost:8080/health
```

#### Configuration Management Workflow
```bash
# When modifying ConfigMaps
vim manifests/dev/express-configmap.yaml

# Apply ConfigMap changes
kubectl apply -f manifests/dev/express-configmap.yaml

# Restart pods to pick up new configuration
kubectl rollout restart deployment/express-deployment

# Verify new configuration loaded
kubectl exec deployment/express-deployment -- printenv | grep -E "(NODE_ENV|LOG_LEVEL|PORT)"
```

#### Database Schema Development
```bash
# Create new migration file
vim migrations/V$(date +%Y%m%d%H%M%S)__add_user_profiles.sql

# Update Flyway ConfigMap
kubectl apply -f manifests/flyway-migrations-configmap.yaml

# Run migrations
kubectl apply -f manifests/flyway-job.yaml

# Verify migration success
kubectl exec deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank;"
```

## Debugging & Troubleshooting

### Application Debugging Commands

#### Pod Inspection
```bash
# Get detailed pod information
kubectl get pods -o wide
kubectl describe pod <pod-name>

# Check pod logs
kubectl logs -l app=express --follow
kubectl logs -l app=postgres --follow

# Access pod shell for debugging
kubectl exec -it deployment/express-deployment -- /bin/sh
kubectl exec -it deployment/postgres-deployment -- /bin/bash
```

#### Service & Network Debugging
```bash
# Test service connectivity
kubectl exec deployment/express-deployment -- nc -zv postgres-service 5432
kubectl exec deployment/express-deployment -- wget -qO- http://localhost:3000/health

# Check service endpoints
kubectl get endpoints
kubectl describe service express-service
kubectl describe service postgres-service

# Test external connectivity (if network policies allow)
kubectl exec deployment/express-deployment -- nc -zv google.com 80
```

#### Resource Monitoring
```bash
# Check resource usage
kubectl top pods
kubectl top nodes

# Describe resource constraints
kubectl describe deployment express-deployment
kubectl describe deployment postgres-deployment

# Check resource quotas and limits
kubectl describe resourcequota
kubectl describe limitrange
```

### Database Operations

#### Direct Database Access
```bash
# Port forward to PostgreSQL
kubectl port-forward service/postgres-service 5432:5432 &

# Connect with psql
psql -h localhost -p 5432 -U app_user -d discbaboons_db
# Password: secure_password_123

# Useful SQL commands:
# \dt                    # List tables
# \d users              # Describe users table  
# SELECT * FROM users;  # Query data
# \q                    # Quit
```

#### Database Troubleshooting
```bash
# Check PostgreSQL logs
kubectl logs -l app=postgres --tail=100

# Check database connectivity from Express
kubectl exec deployment/express-deployment -- nc -zv postgres-service 5432

# Verify database initialization
kubectl exec deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "\dt"

# Check migration status
kubectl exec deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "SELECT version, description FROM flyway_schema_history ORDER BY installed_rank;"
```

### Performance Testing & Optimization

#### Load Testing
```bash
# Simple load test with curl
for i in {1..100}; do
  curl -s http://localhost:8080/api/users > /dev/null &
done
wait

# Monitor performance during load test
kubectl top pods
kubectl logs -l app=express --tail=50
```

#### Resource Optimization
```bash
# Check current resource usage
kubectl top pods

# Modify resource limits
vim manifests/dev/express-deployment.yaml
# Update resources.requests and resources.limits

# Apply changes and monitor
kubectl apply -f manifests/dev/express-deployment.yaml
kubectl rollout status deployment/express-deployment
```

### Development Environment Management

#### Cluster Lifecycle Management
```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# List all Kind clusters
kind get clusters

# Clean restart (nuclear option)
kind delete cluster --name discbaboons-learning
kind create cluster --config=kind-config.yaml --name discbaboons-learning
./rebuild-dev.sh
```

#### Image Management
```bash
# List images in Kind cluster
docker exec -it discbaboons-learning-control-plane crictl images

# Remove old images to save space
docker image prune -f

# Check image sizes
docker images | grep discbaboons-express
```

#### ConfigMap and Secret Management
```bash
# View all ConfigMaps
kubectl get configmaps -o wide

# View ConfigMap content
kubectl get configmap express-config -o yaml
kubectl describe configmap express-config

# Edit ConfigMap directly (for testing)
kubectl edit configmap express-config

# View secrets (base64 encoded)
kubectl get secrets
kubectl get secret postgres-secret -o yaml
```

### Testing & Validation Workflows

#### API Testing Suite
```bash
# Health check
curl http://localhost:8080/health
# Expected: {"status":"healthy","timestamp":"..."}

# Environment info
curl http://localhost:8080/api/info
# Expected: {"success":true,"environment":"development",...}

# User data with database connectivity
curl http://localhost:8080/api/users
# Expected: {"success":true,"data":[...users...]}

# Test error handling
curl http://localhost:8080/api/nonexistent
# Expected: 404 with proper error response
```

#### Environment Validation
```bash
# Verify environment-specific configuration
kubectl exec deployment/express-deployment -- env | grep -E "(NODE_ENV|LOG_LEVEL)"

# Development environment expectations:
# NODE_ENV=development
# LOG_LEVEL=debug

# Production environment expectations:  
# NODE_ENV=production
# LOG_LEVEL=info

# Check replica count
kubectl get pods -l app=express
# Dev: 1 replica, Prod: 3 replicas
```

#### Security Testing (Production Mode)
```bash
# Test RBAC permissions (prod only)
kubectl auth can-i get configmaps --as=system:serviceaccount:default:express-service-account
# Expected: yes (for monitoring-config only)

kubectl auth can-i create pods --as=system:serviceaccount:default:express-service-account
# Expected: no

# Test network policies (prod only)
kubectl exec deployment/express-deployment -- nc -zv postgres-service 5432
# Expected: success (allowed by policy)

kubectl exec deployment/express-deployment -- nc -zv google.com 80  
# Expected: failure (blocked by policy)

# Test container security
kubectl exec deployment/express-deployment -- whoami
# Expected: app (uid 1000, non-root)
```

## Development Best Practices

### Code Quality Workflow
```bash
# Before committing code
cd apps/express-server
npm run lint                # Fix linting issues
npm test                   # Ensure tests pass
npm run test:integration   # Verify database integration
```

### Commit Message Standards
```bash
# Use conventional commits for semantic versioning
git commit -m "feat: add user profile endpoints"     # Minor version bump
git commit -m "fix: resolve database timeout issue"  # Patch version bump  
git commit -m "feat!: redesign API structure"        # Major version bump (breaking)
```

### Branch Protection Workflow
```bash
# Create feature branch
git checkout -b feature/user-profiles

# Make changes and test locally
./rebuild-dev.sh
# Test functionality

# Push and create PR
git push origin feature/user-profiles
# Create PR to main branch

# CI/CD will automatically:
# - Run tests (unit + integration)
# - Check code quality (ESLint)
# - Verify database migrations
# - Block merge if any checks fail
```

### Production Deployment Confidence
```bash
# Local production testing before merge
./rebuild-prod.sh

# Verify production configuration
kubectl exec deployment/express-deployment -- env | grep NODE_ENV
# Should show: NODE_ENV=production

# Test with production resource limits and multiple replicas
kubectl get pods -l app=express
# Should show 3 running pods

# Merge to main triggers automatic production deployment
# with semantic versioning and Docker Hub registry
```
