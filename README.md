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
  - ✅ **Secrets**: Sensitive data management (COMPLETE!)
    - ✅ Create secrets using `kubectl create secret`
    - ✅ Use secrets in deployments with `secretRef`
    - ✅ Understand base64 encoding vs encryption
    - ✅ Best practices: never log secrets, use separate secrets per environment
    - ✅ Combined ConfigMap + Secret usage in single deployment
    - ✅ Security awareness: base64 ≠ encryption, keep secret files out of git

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

  - **Day 5**: Database Schema Design & Documentation
    - **Learn database documentation standards**: Using DBML (Database Markup Language)
    - **Create schema documentation**: Document table relationships and constraints
    - **Initial schema design**: Users and user profiles tables
    - **Migration V1**: Create users table with authentication fields
    - **Migration V2**: Create user_profiles table with foreign key relationships
    - **Best practices**: Migration naming, rollback strategies, and change documentation

  - **Day 6**: Connect Express to PostgreSQL
    - Add PostgreSQL client library to Express app (`pg` or `pg-pool`)
    - Update Express app with database connection using environment variables
    - Create database connection health checks
    - **Deployment order**: PostgreSQL → Flyway migrations → Express app
    - **API endpoints**: CRUD operations for users and profiles

  - **Day 7**: Advanced Migration Patterns & Database Evolution
    - **Iterative schema changes**: Adding tables over time with proper versioning
    - **Migration V3**: Add indexes for performance optimization
    - **Migration V4**: Add additional user fields (email, email_verified, etc.)
    - **Learn migration rollback**: How to safely reverse database changes
    - **Data migrations**: Seeding initial data vs schema-only migrations
    - **Production considerations**: Zero-downtime migrations and backward compatibility

  - **Day 7**: Integration Testing and Troubleshooting
    - End-to-end testing of the full stack locally
    - Database connection pooling and optimization
    - Common troubleshooting: connection timeouts, migration failures
    - Prepare for production deployment patterns
    - **Test complete user workflow**: Registration → Profile creation → API interactions

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
  - **Day 5**: **Production Secret Management**
    - **Learn external secret management**: Never store secrets in YAML files in production
    - **DigitalOcean Spaces + SOPS**: Encrypted secret files
    - **External Secrets Operator**: Connect to cloud secret stores
    - **Environment-specific secrets**: Different secrets for dev/staging/prod
    - **Secret rotation strategies**: How to update secrets without downtime
  - **Day 6-7**: Production hardening and monitoring
    - Security contexts and non-root containers
    - Resource limits for production workloads
    - Basic monitoring setup

- ⏳ **Week 5**: Advanced Secret Management & Security
  - **Day 1-2**: **Enterprise Secret Solutions**
    - **HashiCorp Vault integration**: Industry-standard secret management
    - **Sealed Secrets**: GitOps-friendly encrypted secrets
    - **AWS Secrets Manager / Google Secret Manager**: Cloud-native solutions
  - **Day 3-4**: **Secret Lifecycle Management**
    - Automated secret rotation
    - Secret versioning and rollback
    - Audit logging for secret access
  - **Day 5-7**: **Security Hardening**
    - Pod Security Standards
    - Network policies for service isolation
    - RBAC (Role-Based Access Control) for secret access

- ⏳ **Week 6**: Advanced Deployments
  - **Day 1-2**: Rolling Updates and Rollbacks
    - Deployment strategies (RollingUpdate vs Recreate)
    - Rolling back failed deployments
    - Deployment history and versioning
  - **Day 3-4**: Resource Management
    - Resource requests and limits fine-tuning
    - Quality of Service classes (Guaranteed, Burstable, BestEffort)
    - Horizontal Pod Autoscaling basics
  - **Day 5-7**: Multi-Environment Setup
    - Namespace-based environment separation (dev, staging, prod)
    - Environment-specific ConfigMaps and Secrets
    - Deployment pipelines and GitOps concepts

- ⏳ **Week 7**: Production Readiness
  - **Day 1-2**: Observability and Monitoring
    - Centralized logging with kubectl logs
    - Structured logging in Express app
    - Application metrics and health checks
  - **Day 3-4**: Backup and Recovery
    - Database backup strategies
    - Persistent volume backup
    - Disaster recovery planning
  - **Day 5-7**: Performance and Scaling
    - Load testing your applications
    - Database connection pooling
    - Caching strategies with Redis
    - Performance monitoring and optimization

## Graduation Project: Full-Stack Application
**Week 8**: Build a complete application demonstrating all learned concepts:
- Express.js API with authentication (JWT from Secrets)
- PostgreSQL database with migrations
- Redis caching layer
- Multi-environment deployment (dev/prod namespaces)
- Ingress with TLS termination
- Comprehensive monitoring and logging
- Automated testing and deployment pipeline

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

### Secrets & Security
- **Base64 Encoding**: Not encryption! Anyone can decode base64 values
- **Local Development**: Use `kubectl create secret` commands, keep secret YAML files out of git
- **Production**: Never store secrets in YAML files - use external secret management
- **Security Principle**: Secrets should be injected at runtime, not baked into images or configs
- **Best Practices**: 
  - Use different secrets for each environment (dev/staging/prod)
  - Rotate secrets regularly
  - Audit secret access
  - Use external secret stores in production (Vault, cloud providers)

### Secret Management Security
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

### Database Design & Migrations
- **DBML Documentation**: Use Database Markup Language for clear schema documentation
- **Migration Versioning**: Sequential numbering (V1, V2, V3) with descriptive names
- **Schema Evolution**: Plan table relationships and constraints from the beginning
- **Migration Best Practices**:
  - One logical change per migration file
  - Always test rollback procedures
  - Document the purpose and impact of each migration
  - Use descriptive migration names (V1__create_users_table.sql)

### Database Schema Standards
**Initial Schema Design:**
```dbml
Table users {
    id INT [pk, increment] // Unique identifier for the user
    username VARCHAR(50) [unique, not null] // Username, must be unique
    password_hash TEXT [not null] // Hashed password
    created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`] // When the user was created
    last_password_change TIMESTAMP [default: `CURRENT_TIMESTAMP`] // Last time the password was changed
}

Table user_profiles {
    id INT [pk, increment] // Unique identifier for the profile
    user_id INT [not null, ref: > users.id] // Foreign key to the users table
    name VARCHAR(100) // Full name of the user
    location VARCHAR(100) // Location of the user
    bio TEXT // Optional bio or description
    created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`] // When the profile was created
    updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`] // When the profile was last updated
}
```

**Migration Workflow:**
- **V1__create_users_table.sql**: Core authentication table
- **V2__create_user_profiles_table.sql**: Profile information with foreign key
- **V3__add_user_indexes.sql**: Performance optimization
- **V4__add_user_email_fields.sql**: Iterative feature additions