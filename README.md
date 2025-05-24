# Kubernetes Learning Journey 🚀

Learning Kubernetes fundamentals with Kind, building up to a full-stack application with Express.js and PostgreSQL.

## Quick Start

### Prerequisites
- Docker Desktop
- Kind: `brew install kind`
- kubectl: `brew install kubectl`

## Daily Development Workflow

### Option 1: Quick Resume (Cluster Already Running)
```bash
# Check if cluster is running
kubectl get nodes

# Check what's deployed
kubectl get pods,services

# Access your Express app
kubectl port-forward service/express-service 8080:3000
# Visit: http://localhost:8080
```

### Option 2: Fresh Start (Cluster Stopped/Deleted)
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

### Option 3: App-Only Restart (Cluster Running, Want Fresh Deploy)
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

## Project Structure

```
├── kind-config.yaml           # Kind cluster configuration
├── apps/
│   └── express-server/        # Express.js application
│       ├── server.js         # Main application
│       ├── server.test.js    # Jest tests
│       ├── package.json      # Node.js dependencies
│       └── Dockerfile        # Container definition
└── manifests/                # Kubernetes YAML files
    ├── express-configmap.yaml # Application configuration
    ├── express-deployment.yaml
    ├── express-service.yaml
    └── hello-*.yaml          # Learning examples
```

## Learning Progress

- ✅ **Week 1**: Kind setup, Pods, Services, Deployments
- ✅ **Express App**: Modern Node.js 22 + ESM + Jest + Airbnb ESLint
- ✅ **Week 2**: ConfigMaps, Secrets, Environment management
  - ✅ ConfigMaps: External configuration management
  - ✅ Environment variables from ConfigMaps using `envFrom`
  - ✅ ConfigMap updates require pod restarts with `kubectl rollout restart`
  - ✅ Separation of configuration from application code
  - ⏳ **Next**: Secrets for sensitive data (JWT tokens, API keys, database passwords)
    - Create secrets using `kubectl create secret`
    - Use secrets in deployments with `secretRef`
    - Understand base64 encoding vs encryption
    - Best practices: never log secrets, use separate secrets per environment

- ⏳ **Week 3**: PostgreSQL Database with Persistent Storage + Database Migrations
  - **Day 1**: Persistent Volumes and Claims (local Kind testing)
    - Understand ephemeral vs persistent storage in Kubernetes
    - Create PersistentVolume and PersistentVolumeClaim
    - Volume types: hostPath (local), cloud providers (AWS EBS, GCP PD)
    - Test volume persistence by deleting/recreating pods

  - **Day 2**: PostgreSQL Deployment with Persistent Storage
    - Deploy PostgreSQL with persistent storage
    - Configure database with ConfigMaps and Secrets (database name, user, password)
    - Database initialization scripts and environment variables
    - Verify data persists across pod restarts

  - **Day 3**: Init Containers - Database Readiness Patterns
    - **Learn init containers**: Containers that run before your main app
    - Create init container to wait for PostgreSQL to be ready
    - Use `pg_isready` to check database connectivity
    - Understand init container vs sidecar container patterns
    - **Why this matters**: Prevents app crashes when database isn't ready yet

  - **Day 4**: Flyway Database Migrations Setup
    - **Learn Flyway**: Industry-standard database migration tool
    - Create Flyway init container for schema management
    - Write your first migration files (V1__initial_schema.sql)
    - Configure Flyway with database connection from Secrets
    - **Migration pattern**: Init container runs Flyway → Main app starts

  - **Day 5**: Connect Express to PostgreSQL
    - Add PostgreSQL client library to Express app (`pg` or `pg-pool`)
    - Update Express app with database connection using environment variables
    - Create database connection health checks
    - **Deployment order**: PostgreSQL → Flyway migrations → Express app

  - **Day 6**: Advanced Migration Patterns
    - Create more complex migrations (tables, indexes, data seeding)
    - Learn migration versioning and rollback strategies
    - Handle migration failures and debugging
    - Test the complete stack: PostgreSQL + Flyway + Express

  - **Day 7**: Integration Testing and Troubleshooting
    - End-to-end testing of the full stack locally
    - Database connection pooling and optimization
    - Common troubleshooting: connection timeouts, migration failures
    - Prepare for production deployment patterns

- ⏳ **Week 3.5**: Local Development Workflow & Production Preparation
  - **Day 1**: Multi-environment configs (dev vs prod)
    - Create separate ConfigMaps for local vs production
    - Environment-specific secrets management
    - Docker image tagging strategies (dev, staging, prod)
  - **Day 2**: Local testing workflows
    - Comprehensive local testing before production deployment
    - Integration testing with PostgreSQL locally
    - Load testing and performance validation in Kind
  - **Day 3**: Production readiness checklist
    - Resource limits and requests for production workloads
    - Health check optimization for production traffic
    - Security hardening (non-root containers, security contexts)

- ⏳ **Week 4**: 🚀 **REAL DEPLOYMENT** - DigitalOcean Kubernetes + HTTPS + Domain
  - **Day 1**: Setup DigitalOcean Kubernetes cluster
    - Create DO Kubernetes cluster
    - Configure kubectl for DO cluster
    - Deploy your Express + PostgreSQL stack to production
  - **Day 2**: Domain and DNS setup
    - Configure your domain (buy one or use a subdomain)
    - Point DNS to DigitalOcean Load Balancer
    - Understand LoadBalancer vs NodePort in cloud environments
  - **Day 3-4**: Ingress and HTTPS
    - Install NGINX Ingress Controller on DO
    - Configure Ingress for your domain
    - Setup Let's Encrypt with cert-manager for free SSL
  - **Day 5**: Production hardening
    - Environment-specific configs for production
    - Secrets management in production
    - Basic monitoring setup
  - **Day 6-7**: Celebrate and iterate! 🎉
    - Test your live application
    - Share your achievement
    - Plan next features

- ⏳ **Week 5**: Production Operations
  - **Day 1-2**: Monitoring and Logging (on real cluster)
  - **Day 3-4**: Backup and Recovery strategies
  - **Day 5-7**: CI/CD pipeline (GitHub Actions → DigitalOcean)

- ⏳ **Week 6**: Advanced Features
  - **Day 1-2**: Add Redis caching layer
  - **Day 3-4**: Database migrations and schema management
  - **Day 5-7**: Performance optimization and scaling

## Key Learnings

### ConfigMaps
- **Purpose**: Store non-sensitive configuration data separately from application code
- **Benefits**: 
  - Change configuration without rebuilding Docker images
  - Share configuration across multiple pods
  - Environment-specific configurations (dev/staging/prod)
- **Important**: ConfigMap changes don't automatically update running pods
- **Workflow**: Edit ConfigMap → Apply changes → Restart pods to pick up new config

### Image Updates
- **Remember**: Any change to `server.js` requires rebuilding and reloading the Docker image
- **Version Management**: Always increment image tag (v1 → v2 → v3) to track changes
- **Workflow**: Edit code → Build image → Load to Kind → Update deployment

## Endpoints

When port-forwarding is active (`kubectl port-forward service/express-service 8080:3000`):

- **Main**: http://localhost:8080/
- **Health**: http://localhost:8080/health  
- **Info**: http://localhost:8080/api/info (shows ConfigMap values like `logLevel`)

## Shutting Down

### End of Day (Keep Cluster for Tomorrow)
```bash
# Just stop port-forwarding (Ctrl+C)
# Cluster and apps keep running
```

### End of Week (Clean Shutdown)
```bash
# Delete applications
kubectl delete -f manifests/

# Delete cluster
kind delete cluster --name discbaboons-learning
```