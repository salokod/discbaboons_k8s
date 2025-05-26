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

## Project Structure

```
├── kind-config.yaml           # Kind cluster configuration
├── apps/
│   └── express-server/        # Express.js application
│       ├── server.js         # Main application with /api/info endpoint
│       ├── server.test.js    # Jest tests
│       ├── package.json      # Node.js dependencies
│       └── Dockerfile        # Container definition
└── manifests/                # Kubernetes YAML files
    ├── express-configmap.yaml # Application configuration
    ├── express-deployment.yaml # Express deployment (ConfigMap + Secret)
    ├── express-service.yaml
    ├── postgres-pvc.yaml     # PostgreSQL persistent volume claim
    ├── postgres-configmap.yaml # PostgreSQL configuration (non-sensitive)
    ├── postgres-secret.yaml  # PostgreSQL credentials (gitignored)
    ├── postgres-deployment.yaml # PostgreSQL with health checks + resources
    ├── postgres-service.yaml # PostgreSQL service for local development access
    └── hello-*.yaml          # Learning examples
```

## Learning Progress

- ✅ **Week 1**: Kind setup, Pods, Services, Deployments
- ✅ **Express App**: Modern Node.js 22 + ESM + Jest + Airbnb ESLint
- ✅ **Week 2**: ConfigMaps, Secrets, Environment management (COMPLETE!)
  - ✅ ConfigMaps: External configuration management
  - ✅ Environment variables from ConfigMaps using `envFrom`
  - ✅ ConfigMap updates require pod restarts with `kubectl rollout restart`
  - ✅ Separation of configuration from application code
  - ✅ **Secrets**: Sensitive data management with production security
    - ✅ Create secrets using `kubectl create secret` and YAML with `stringData`
    - ✅ Use secrets in deployments with `secretRef`
    - ✅ Understand base64 encoding vs encryption
    - ✅ Best practices: never log secrets, use separate secrets per environment
    - ✅ Combined ConfigMap + Secret usage in single deployment (`/api/info` endpoint verification)
    - ✅ Security awareness: base64 ≠ encryption, keep secret files out of git

- ✅ **Week 3**: PostgreSQL Database with Persistent Storage + Database Migrations
  - ✅ **Day 1**: Persistent Volumes and Claims (local Kind testing)
    - ✅ **Dynamic Provisioning**: Created `postgres-pvc.yaml` with 1Gi storage using `WaitForFirstConsumer` binding mode
    - ✅ **Volume Persistence Testing**: Used busybox test pod to verify data survives pod deletion
    - ✅ **Storage Classes**: Leveraged Kind's default StorageClass for dynamic volume provisioning
    - ✅ **Access Modes**: Implemented ReadWriteOnce (RWO) for single-node PostgreSQL access
    - ✅ **Storage Best Practices**: Learned about ephemeral vs persistent storage patterns

  - ✅ **Day 2**: PostgreSQL Deployment with Persistent Storage (COMPLETE! ✅)
    - ✅ **PostgreSQL 17-alpine**: Deployed latest PostgreSQL with minimal attack surface
    - ✅ **Complete Configuration Management**: 
      - `postgres-configmap.yaml`: Non-sensitive config (POSTGRES_DB="discbaboons_db", POSTGRES_USER="app_user")
      - `postgres-secret.yaml`: Secure credentials using `stringData` (POSTGRES_PASSWORD, POSTGRES_ROOT_PASSWORD)
    - ✅ **Production Volume Setup**: Persistent storage at `/var/lib/postgresql/data` without `subPath` complexity
    - ✅ **Health Monitoring**: Comprehensive liveness and readiness probes using `pg_isready` command
      - Liveness probe: 30s initial delay, 10s period - prevents unnecessary restarts
      - Readiness probe: 5s initial delay, 5s period - ensures traffic only goes to ready pods
    - ✅ **Resource Management**: Production resource limits (256Mi-512Mi memory, 250m-500m CPU)
    - ✅ **Data Persistence Verified**: Created test tables, inserted data, verified survival across pod deletion/recreation
    - ✅ **Security Patterns**: Updated `.gitignore` to exclude secret YAML files from version control
    - ✅ **Local Database Access for Development** (WORKING! 🎉): 
      - ✅ Created `postgres-service.yaml` for cluster communication
      - ✅ Port-forward setup: `kubectl port-forward service/postgres-service 5432:5432`
      - ✅ **Successfully connected via psql, DBeaver, and pgAdmin** - Database fully accessible locally!
      - ✅ Database credentials retrieval: `kubectl get secret postgres-secret -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d`
      - ✅ **Connection Details**: localhost:5432, Database: discbaboons_db, User: app_user, Password: secure_password_123
      - ✅ **Troubleshooting Experience**: Learned volume corruption recovery, PVC cleanup, and fresh deployment strategies
      - **Security Note**: This is for local development only - production requires different patterns

  - ✅ **Day 3**: Init Containers - Database Readiness Patterns (COMPLETE! ✅)
    - ✅ **Learn init containers**: Containers that run before your main app
      - ✅ **Sequential execution**: Init containers must complete before main containers start
      - ✅ **Dependency management**: Perfect for checking external service readiness
      - ✅ **Production pattern**: Industry-standard approach for startup ordering
    - ✅ **Create init container to wait for PostgreSQL to be ready**
      - ✅ **Implemented in [`express-deployment.yaml`](manifests/express-deployment.yaml )**: Added `wait-for-postgres` init container
      - ✅ **Standard Kubernetes format**: Used single-line command following official documentation patterns
      - ✅ **Real-world testing**: Scaled PostgreSQL down/up to demonstrate dependency protection
    - ✅ **Use `pg_isready` to check database connectivity**
      - ✅ **Command mastery**: `pg_isready -h postgres-service -p 5432 -U app_user -d discbaboons_db`
      - ✅ **Live log analysis**: Witnessed "no response" → "accepting connections" → "PostgreSQL is ready!"
      - ✅ **Production readiness**: Uses same connection details as main application
    - ✅ **Understand init container vs sidecar container patterns**
      - ✅ **Init containers**: Run once before main container, exit on completion
      - ✅ **Sidecar containers**: Run alongside main container throughout pod lifecycle
      - ✅ **Use cases**: Init for setup/dependencies, sidecars for ongoing support (logging, proxies)
    - ✅ **Why this matters: Prevents app crashes when database isn't ready yet**
      - ✅ **Race condition prevention**: Eliminates startup timing issues
      - ✅ **Zero error logs**: No more "connection refused" spam in application logs
      - ✅ **Production reliability**: Handles database restarts, maintenance, scaling events gracefully
    - ✅ **Advanced patterns learned**:
      - ✅ **Rolling update behavior**: Experienced how Kubernetes handles deployment updates with init containers
      - ✅ **Debugging skills**: Learned to target specific containers (`-c wait-for-postgres`)
      - ✅ **Pod status interpretation**: `Init:0/1` → `PodInitializing` → `Running`
      - ✅ **Multiple init containers**: Understanding sequential execution for complex dependencies
      - ✅ **Resource management**: Learned about setting limits for init containers
      - ✅ **Timeout patterns**: Using `until` loops with proper sleep intervals

  - ✅ **Day 4**: Flyway Database Migrations Setup (COMPLETE! ✅)
    - ✅ **Learn Flyway**: Industry-standard database migration tool for version-controlled schema changes
    - ✅ **Create Flyway init container for schema management**
      - ✅ **Sequential init container pattern**: `wait-for-postgres` → `flyway-migrate` → `express` application
      - ✅ **Flyway Docker image**: Used `flyway/flyway:10.8.1` for latest features and stability
      - ✅ **Migration execution**: Flyway automatically applies pending migrations on container startup
    - ✅ **Write your first migration files** 
      - ✅ **Migration naming convention**: `V{version}__{description}.sql` (e.g., `V2__create_users_table.sql`)
      - ✅ **Created V2__create_users_table.sql**: Users table with id, username, email, password_hash, created_at, updated_at
      - ✅ **Why V2**: V1 was used for Flyway baseline, V2 contains actual schema changes
    - ✅ **Configure Flyway with database connection from Secrets**
      - ✅ **Flyway ConfigMap**: Created `flyway-configmap.yaml` with JDBC URL and connection settings
      - ✅ **Environment variables**: `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_PASSWORD` from existing postgres-secret
      - ✅ **Connection string format**: `jdbc:postgresql://postgres-service:5432/discbaboons_db`
    - ✅ **Migration files management with ConfigMaps**
      - ✅ **ConfigMap automation**: `kubectl create configmap flyway-migrations --from-file=migrations/`
      - ✅ **Volume mounting**: Migration files mounted at `/flyway/sql` in Flyway container
      - ✅ **File structure**: All `.sql` files automatically discovered and executed in version order
    - ✅ **Production-ready migration pattern**: Init container runs Flyway → Main app starts
      - ✅ **Zero-downtime deployments**: Database schema updated before application starts
      - ✅ **Migration safety**: Flyway tracks applied migrations in `flyway_schema_history` table
      - ✅ **Rollback protection**: Prevents accidental re-execution of completed migrations
    - ✅ **Advanced Flyway concepts learned**:
      - ✅ **Baseline vs migrations**: Understanding Flyway's versioning system and baseline conflicts
      - ✅ **Schema history tracking**: Flyway maintains metadata about applied migrations
      - ✅ **Migration state management**: SUCCESS, FAILED, PENDING migration states
      - ✅ **Debugging migrations**: Using Flyway logs to troubleshoot version conflicts
      - ✅ **Production considerations**: Schema changes should be backward-compatible during rolling updates
    - ✅ **Implementation breadcrumbs & troubleshooting experience**:
      - ✅ **ConfigMap creation workflow**: `kubectl create configmap flyway-migrations --from-file=migrations/` (automated vs manual YAML)
      - ✅ **Flyway baseline issue resolution**: Discovered V1 migration conflicts with baseline, solved by using V2__create_users_table.sql
      - ✅ **Init container debugging**: Learned to check init container logs with `kubectl logs pod-name -c flyway-migrate`
      - ✅ **File structure learned**: Flyway expects migrations at `/flyway/sql/` mount point with proper volume mapping
      - ✅ **Environment variable patterns**: Reused existing `postgres-secret` for Flyway database connection
      - ✅ **Verification workflow**: Confirmed working setup with `flyway_schema_history` table and `users` table creation
      - ✅ **ConfigMap best practices**: Automation with `--from-file` prevents manual file duplication and sync issues

  - ✅ **Day 5**: Database Schema Design & Documentation (COMPLETE! ✅)
    - ✅ **Learn database documentation standards**: Industry-standard DBML (Database Markup Language) for clear schema visualization
      - ✅ **DBML syntax mastery**: Tables, columns, relationships, and constraints documentation
      - ✅ **Visual schema design**: DBML generates readable diagrams for stakeholder communication
      - ✅ **Version control friendly**: Plain text format integrates well with git workflows
    - ✅ **Create comprehensive schema documentation**: Document table relationships, constraints, and business logic
      - ✅ **Users table design**: Core authentication fields (id, username, password_hash, timestamps)
      - ✅ **User profiles separation**: Normalized design separating auth from profile data
      - ✅ **Foreign key relationships**: Proper referential integrity between users and profiles
      - ✅ **Index planning**: Strategic indexing for username lookups and profile queries
    - ✅ **Database design best practices learned**:
      - ✅ **Normalization principles**: Separating authentication data from profile information
      - ✅ **Primary key strategies**: Auto-incrementing integers vs UUIDs trade-offs
      - ✅ **Timestamp patterns**: created_at and updated_at for audit trails
      - ✅ **Constraint design**: Unique constraints, NOT NULL validation, and data integrity
      - ✅ **Performance considerations**: Index placement for common query patterns
    - ✅ **Migration planning and execution**:
      - ✅ **Migration V3**: Enhanced users table with additional authentication fields
      - ✅ **Migration V4**: User profiles table with foreign key relationships and cascading rules
      - ✅ **Migration V5**: Performance indexes for username and email lookups
      - ✅ **Iterative schema evolution**: Building complex schemas through incremental migrations
    - ✅ **Production database design patterns**:
      - ✅ **Schema versioning**: Using migration numbers to track database evolution
      - ✅ **Rollback planning**: Designing migrations with safe rollback strategies
      - ✅ **Data migration vs schema migration**: Understanding when to include data changes
      - ✅ **Backward compatibility**: Ensuring schema changes don't break existing application code
      - ✅ **Change documentation**: Clear migration descriptions for team collaboration
    - ✅ **Advanced schema design concepts learned**:
      - ✅ **Referential integrity**: ON DELETE CASCADE vs RESTRICT patterns for data consistency
      - ✅ **Email verification patterns**: Boolean flags vs verification token approaches
      - ✅ **Password security**: Separate password_hash storage with salt considerations
      - ✅ **User profile extensibility**: JSON columns vs separate tables for flexible user data
      - ✅ **Audit trail design**: Tracking user actions and data changes over time
    - ✅ **Implementation breadcrumbs & database design experience**:
      - ✅ **DBML tooling workflow**: Created schema.dbml and learned visualization tools for database design
      - ✅ **Migration file organization**: Established patterns for V3, V4, V5 migration numbering and descriptions
      - ✅ **Schema validation**: Used PostgreSQL's built-in constraints to enforce data integrity rules
      - ✅ **Performance testing approach**: Learned to plan indexes before table grows large
      - ✅ **Team collaboration patterns**: DBML as documentation for both developers and stakeholders
      - ✅ **Migration testing workflow**: Created test data to validate schema changes work correctly
      - ✅ **Database design iteration**: Experienced the process of refining schema through multiple migration cycles
      - ✅ **Production readiness**: Schema designed with scalability and maintainability in mind

  - **Day 6**: Connect Express to PostgreSQL
    - Add PostgreSQL client library to Express app (`pg` or `pg-pool`)
    - Update Express app with database connection using environment variables
    - Create database connection health checks
    - **Deployment order**: PostgreSQL → Flyway migrations → Express app
    - **API endpoints**: CRUD operations for users and profiles

  - **Day 6.5**: Database Backup Strategies (Production Essential!)
    - **Learn backup fundamentals**: Why backups are critical for production databases
    - **Backup types**: Full backups vs incremental vs differential
    - **PostgreSQL backup tools**: `pg_dump`, `pg_basebackup`, and continuous archiving
    - **Kubernetes backup patterns**: CronJobs for automated backups
    - **Storage considerations**: Where to store backups (separate from primary storage)
    - **Testing backups**: Regular restore testing to verify backup integrity
    - **Backup retention policies**: How long to keep backups and cleanup strategies

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
  - **Day 6**: **Production Database Access & Security**
    - **Database Security Best Practices**: Why direct production database access is dangerous
    - **Secure Access Patterns**: Bastion hosts, jump servers, and database proxies
    - **Read Replicas**: Create read-only database replicas for analytics and monitoring
    - **Database Monitoring**: Set up database observability without direct access
    - **Audit Trails**: Track database access and changes for compliance
    - **Emergency Access**: Controlled break-glass procedures for critical issues
  - **Day 7**: Production hardening and monitoring
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
    - **Production Backup Strategies**: Automated database backups with Kubernetes CronJobs
    - **Backup Storage**: External storage solutions (cloud storage, NFS, S3-compatible)
    - **Point-in-time Recovery**: PostgreSQL WAL archiving and continuous backup
    - **Backup Testing**: Automated restore testing and backup validation
    - **Cross-region Backups**: Disaster recovery with geographically distributed backups
    - **Backup Monitoring**: Alerting on backup failures and monitoring backup health
    - **Persistent Volume Snapshots**: Volume-level backups for complete system recovery
    - **Recovery Procedures**: Step-by-step disaster recovery playbooks
    - **Backup Retention**: Automated cleanup policies and long-term archival strategies
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

### Init Containers & Dependency Management
- **Purpose**: Run setup tasks before main application containers start
- **Sequential Execution**: Each init container must complete successfully before the next starts
- **Use Cases**: 
  - Database readiness checking (prevents startup race conditions)
  - Data preparation and file downloads
  - Secret fetching from external systems
  - Database migrations (coming in Day 4!)
- **Production Benefits**:
  - Eliminates application startup errors due to dependency unavailability
  - Provides predictable startup behavior during scaling and updates
  - Centralizes dependency checking logic outside application code

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

### PostgreSQL Production Deployment
- **Image Selection**: PostgreSQL 17-alpine for latest features with minimal attack surface
- **Persistent Storage**: Always use PersistentVolumeClaims for stateful workloads like databases
- **Volume Mount Best Practices**: Use direct mount (`/var/lib/postgresql/data`) without `subPath` for simplicity
- **Configuration Strategy**: Split sensitive (Secrets) from non-sensitive (ConfigMaps) configuration
- **Health Monitoring**: Implement both liveness and readiness probes using `pg_isready`
  - **Liveness probe**: Detects hung processes, restarts unhealthy containers
  - **Readiness probe**: Controls traffic routing, removes unready pods from service
- **Resource Management**: Set appropriate requests/limits based on workload (256Mi-512Mi memory)
- **Data Persistence Testing**: Always verify data survives pod deletion/recreation
- **Security**: Never store database passwords in ConfigMaps, always use Secrets
- **Local Development Access**: Use Services + port-forward for database connectivity
- **Troubleshooting Database Issues**: 
  - **Volume corruption**: Delete PVC and recreate for fresh start
  - **Initialization errors**: Check for leftover files in data directory
  - **subPath complications**: Avoid unless specifically needed
  - **Clean deployment**: `kubectl delete deployment && kubectl delete pvc` for complete reset

```yaml
# Example production-ready PostgreSQL deployment patterns
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

### Flyway & Database Migrations
- **Industry Standard Tool**: Flyway provides version-controlled database schema management
- **Migration File Naming**: `V{version}__{description}.sql` format (e.g., `V2__create_users_table.sql`)
- **Sequential Init Container Pattern**: `wait-for-postgres` → `flyway-migrate` → `express` application startup
- **ConfigMap Integration**: Use `kubectl create configmap flyway-migrations --from-file=migrations/` for automated file management
- **Production Migration Safety**: Flyway tracks applied migrations in `flyway_schema_history` table to prevent re-execution
- **Connection Configuration**: Reuse existing database secrets, configure JDBC URL format: `jdbc:postgresql://postgres-service:5432/dbname`
- **Troubleshooting Experience**: V1 conflicts with baseline - use V2+ for actual schema changes
- **Zero-downtime Deployments**: Database schema updated before application containers start

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