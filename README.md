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
├── docs/                      # Project documentation
│   └── database/             # Database schema and migration documentation
│       ├── schema.dbml       # DBML schema documentation
│       ├── migration-plan.md # Migration strategy and evolution plan
│       └── README.md         # Database architecture overview
├── migrations/               # Flyway database migrations
│   ├── V1__create_users_table.sql           # Initial users table
│   ├── V2__add_sample_data.sql              # Test data for development
│   ├── V3__add_authentication_fields.sql    # Enhanced authentication
│   ├── V4__create_user_profiles_table.sql   # Normalized profile table
│   └── V5__cleanup_users_table.sql          # Final schema cleanup
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
    ├── flyway-config.yaml    # Flyway migration configuration
    ├── flyway-migrations-configmap.yaml # All migration files (V1-V5)
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
    - ✅ **Learn Flyway**: Industry-standard database migration tool
      - ✅ **Migration file naming**: `V{version}__{description}.sql` format (e.g., `V2__create_users_table.sql`)
      - ✅ **Schema history tracking**: Flyway creates `flyway_schema_history` table to track applied migrations
      - ✅ **Version-controlled database**: Database schema changes managed like application code
      - ✅ **Production safety**: Migrations run once and are tracked to prevent re-execution
    - ✅ **Create Flyway init container for schema management**
      - ✅ **Sequential init containers**: `wait-for-postgres` → `flyway-migrate` → `express` application startup
      - ✅ **Flyway configuration**: Created `flyway-config` ConfigMap with JDBC URL and connection settings
      - ✅ **Environment variable mapping**: `FLYWAY_PASSWORD` from existing `postgres-secret`
      - ✅ **Init container pattern**: Flyway runs as second init container after database readiness check
    - ✅ **Write your first migration files (V1__initial_schema.sql)**
      - ✅ **Created `migrations/V1__create_users_table.sql`**: Complete users table with proper structure
      - ✅ **Migration content**: Users table with id, username, email, timestamps, and indexes
      - ✅ **Test data inclusion**: Added sample users for testing database connectivity
      - ✅ **ConfigMap automation**: Used `kubectl create configmap flyway-migrations --from-file=migrations/` 
    - ✅ **Configure Flyway with database connection from Secrets**
      - ✅ **JDBC URL configuration**: `jdbc:postgresql://postgres-service:5432/discbaboons_db`
      - ✅ **Credential reuse**: Same database user and password as PostgreSQL deployment
      - ✅ **ConfigMap integration**: `flyway-config` for connection settings, volume mount for migration files
      - ✅ **Environment variables**: `FLYWAY_URL`, `FLYWAY_USER`, `FLYWAY_LOCATIONS`, `FLYWAY_BASELINE_ON_MIGRATE`
    - ✅ **Migration pattern: Init container runs Flyway → Main app starts**
      - ✅ **Zero-downtime potential**: Database schema guaranteed current before application startup
      - ✅ **Production reliability**: Handles database restarts and ensures schema consistency
      - ✅ **Dependency ordering**: PostgreSQL ready → migrations applied → application starts with current schema
      - ✅ **Rolling update compatibility**: Works seamlessly with Kubernetes deployment updates
    - ✅ **Advanced Flyway troubleshooting and concepts**:
      - ✅ **Baseline conflict resolution**: Learned about `FLYWAY_BASELINE_ON_MIGRATE` and version conflicts
      - ✅ **Migration versioning strategy**: V1 baseline vs V2+ actual migrations when database exists
      - ✅ **ConfigMap file management**: Automated ConfigMap creation vs manual duplication
      - ✅ **Init container debugging**: Reading Flyway logs, understanding schema history table
      - ✅ **Production patterns**: Industry-standard migration practices and deployment safety
      - ✅ **Volume mounting verification**: Ensuring migration files are properly accessible in containers
      - ✅ **Schema validation**: Verifying successful migration execution and database table creation

  - ✅ **Day 5**: Database Schema Design & Documentation (COMPLETE! ✅)
    - ✅ **Learn database documentation standards**: Using DBML (Database Markup Language)
      - ✅ **DBML Mastery**: Complete Database Markup Language syntax for professional schema documentation
      - ✅ **Table Definitions**: Primary keys, foreign keys, unique constraints, and data types
      - ✅ **Relationship Modeling**: One-to-one and one-to-many relationships with proper referential integrity
      - ✅ **Documentation Structure**: Created `docs/database/` directory with schema.dbml, migration-plan.md, and README.md
    - ✅ **Database Design Principles**: Normalized architecture separating concerns
      - ✅ **Authentication vs Profile Separation**: Pure authentication table (users) separate from profile data (user_profiles)
      - ✅ **Foreign Key Relationships**: Proper 1:1 relationship between users and user_profiles with CASCADE behavior
      - ✅ **Constraint Strategy**: Unique indexes, NOT NULL constraints, and referential integrity enforcement
      - ✅ **Normalization Benefits**: Reduced data redundancy, improved data integrity, flexible schema evolution
    - ✅ **Advanced Migration Evolution (V3→V4→V5)**:
      - ✅ **V3 Migration**: Enhanced users table with authentication fields using nullable→populate→constrain pattern
        - Added `password_hash TEXT NOT NULL` and `last_password_change TIMESTAMP` 
        - Production-safe migration strategy avoiding downtime
      - ✅ **V4 Migration**: Created normalized user_profiles table with comprehensive data migration
        - Foreign key relationship: `user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE`
        - Cross-table data migration using `INSERT INTO user_profiles (user_id, email) SELECT id, email FROM users`
        - Baboon personality test data: Alice (Analytical), Bob (Expressive), Alpha Baboon (Driver leadership style)
        - Unique constraint ensuring 1:1 relationship between users and profiles
      - ✅ **V5 Migration**: Final cleanup removing redundant columns for pure authentication focus
        - Dropped `email` and `updated_at` columns from users table (moved to profiles)
        - Clean separation: users for authentication, user_profiles for all profile information
    - ✅ **Advanced SQL Patterns & Production Techniques**:
      - ✅ **Foreign Key Constraints**: `ON DELETE CASCADE` for data consistency and automatic cleanup
      - ✅ **Unique Indexes**: Enforcing 1:1 relationships at database level
      - ✅ **Cross-Table Data Migration**: Safe data movement using `INSERT...SELECT` patterns
      - ✅ **Conditional Updates**: Using subqueries for targeted data modifications
      - ✅ **Transaction Safety**: All migrations wrapped in implicit transactions for rollback safety
    - ✅ **Production Migration Deployment**:
      - ✅ **ConfigMap Generation**: Created comprehensive `flyway-migrations-configmap.yaml` with all 5 migrations (V1-V5)
      - ✅ **Deployment Verification**: Successfully applied all migrations through Kubernetes Flyway init container
      - ✅ **Schema Validation**: Confirmed perfect normalized database architecture in production
      - ✅ **Flyway History Tracking**: All migrations tracked in `flyway_schema_history` table
    - ✅ **Database Architecture Achievement**: Production-ready two-table authentication system
      - ✅ **Pure Authentication Table**: `users` table focused solely on authentication with username, password_hash, timestamps
      - ✅ **Complete Profile Table**: `user_profiles` table with foreign key, email, name, location, bio, personality data
      - ✅ **Referential Integrity**: Foreign key constraints ensuring data consistency
      - ✅ **Enterprise Migration Patterns**: Industry-standard versioned migration approach with proper documentation

  - ✅ **Day 6**: Express.js + PostgreSQL Integration with Prisma ORM (COMPLETE! ✅)
    - ✅ **Prisma ORM Setup**: Type-safe database access with schema introspection
      - ✅ **Database Introspection**: Generated Prisma schema from existing V5 database structure
      - ✅ **Type Safety**: Auto-generated TypeScript types from database schema
      - ✅ **Client Generation**: Created optimized Prisma client with foreign key relationships
      - ✅ **Environment Configuration**: Database connection via environment variables with graceful shutdown
    - ✅ **Test-Driven Development (TDD)**: Red-Green-Blue cycle implementation
      - ✅ **Jest Configuration**: ES6 module support with comprehensive test setup
      - ✅ **API Integration Testing**: Supertest for HTTP endpoint validation
      - ✅ **TDD Workflow**: Write failing tests → implement features → refactor code
      - ✅ **Test Coverage**: Complete test suite for all API endpoints
    - ✅ **Production API Endpoints**: Type-safe database queries with security patterns
      - ✅ **GET /api/users**: List all users with joined user_profiles using Prisma `include`
      - ✅ **GET /api/users/:username**: Get specific user with profile data
      - ✅ **Security Implementation**: Excluded password_hash from API responses
      - ✅ **Error Handling**: Comprehensive JSON error responses with proper HTTP status codes
      - ✅ **Foreign Key Navigation**: Utilized Prisma's relationship queries for normalized data access
    - ✅ **Database Integration**: Connected to production-ready two-table authentication system
      - ✅ **Prisma Schema**: Auto-generated models for users and user_profiles with proper relationships
      - ✅ **Connection Management**: Environment-aware database connections with connection pooling
      - ✅ **Query Optimization**: Type-safe queries leveraging database indexes and foreign keys
      - ✅ **Data Validation**: Prisma's built-in validation and type checking
    - ✅ **Production Patterns**: Industry-standard ORM integration with security best practices
      - ✅ **Environment Variables**: Database credentials from Kubernetes secrets
      - ✅ **Graceful Shutdown**: Proper Prisma client disconnection in server shutdown
      - ✅ **Logging Integration**: Database operation logging for production debugging
      - ✅ **Performance Monitoring**: Query introspection capabilities for optimization
    - ✅ **Critical Production Lesson**: **Flyway + Prisma Synchronization Workflow**
      - ✅ **The Challenge**: Maintaining consistency between Flyway migrations (V1-V5) and Prisma schema
      - ✅ **The Workflow**: Database migrations → Schema introspection → Client generation
      - ✅ **Production Pipeline**: 
        1. Flyway applies versioned migrations to database (V1-V5)
        2. Prisma introspects updated database schema
        3. Prisma generates type-safe client from current database state
        4. Application uses generated client with guaranteed schema consistency
      - ✅ **Why This Matters**: Prevents schema drift between migration files and ORM models
      - ✅ **CI/CD Integration**: Automated pipeline ensures Prisma client matches migrated database

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
    - **🚨 CRITICAL: Flyway + Prisma Synchronization in Production Pipelines**
      - **The Production Challenge**: Keeping database migrations (Flyway) in sync with ORM schema (Prisma)
      - **Schema Drift Prevention**: Ensuring migration files and generated Prisma client are always consistent
      - **CI/CD Pipeline Integration**: Automated workflow to maintain synchronization
        1. **Flyway Migration**: Apply versioned migrations to database (V1-V5+)
        2. **Prisma Introspection**: Generate schema from migrated database state
        3. **Client Generation**: Create type-safe Prisma client matching current schema
        4. **Deployment**: Use generated client guaranteed to match database structure
      - **Why This Matters**: Prevents runtime errors from schema mismatches in production
      - **Pipeline Safety**: Automated verification that Prisma schema matches migrated database
      - **Team Coordination**: Clear workflow for developers adding new migrations and ORM changes
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
- PostgreSQL database with normalized schema and foreign key relationships
- Database migrations using Flyway with proper versioning (V1-V5+)
- DBML schema documentation and migration planning
- Redis caching layer
- Multi-environment deployment (dev/prod namespaces)
- Ingress with TLS termination
- Comprehensive monitoring and logging
- Automated testing and deployment pipeline
- Production-ready database backup and recovery strategies

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

### Database Schema Design & Foreign Key Relationships
- **DBML Documentation Standards**: Professional schema documentation using Database Markup Language
  - **Complete Table Definitions**: Primary keys, foreign keys, unique constraints, and comprehensive data types
  - **Relationship Modeling**: Proper one-to-one and one-to-many relationships with referential integrity
  - **Professional Structure**: Organized `docs/database/` with schema.dbml, migration-plan.md, and README.md
- **Database Normalization Strategy**: Separation of authentication and profile concerns
  - **Pure Authentication Table**: `users` table focused solely on login credentials and security
  - **Profile Data Table**: `user_profiles` table with foreign key relationships for all profile information
  - **Foreign Key Benefits**: Data consistency, automatic cleanup with CASCADE, enforced relationships
- **Advanced Migration Patterns (V3→V4→V5 Evolution)**:
  - **Nullable→Populate→Constrain Pattern**: Safe production migrations avoiding downtime
  - **Cross-Table Data Migration**: Using `INSERT...SELECT` for data movement between tables
  - **Schema Cleanup**: Removing redundant columns while maintaining data integrity
  - **1:1 Relationship Enforcement**: Unique constraints ensuring one profile per user
- **Production SQL Techniques**:
  - **Foreign Key Constraints**: `REFERENCES users(id) ON DELETE CASCADE` for automatic cleanup
  - **Unique Indexes**: Database-level relationship enforcement
  - **Conditional Updates**: Subquery-based targeted data modifications
  - **Transaction Safety**: All migrations atomically executed with rollback capability
- **Enterprise Database Architecture**: Two-table normalized authentication system
  - **Separation of Concerns**: Authentication data separate from profile/business data
  - **Referential Integrity**: Foreign keys ensuring data consistency across tables
  - **Scalable Design**: Schema evolution supporting future feature additions
  - **Production Ready**: Industry-standard patterns with proper constraints and relationships

**DBML Schema Documentation Example:**
```dbml
Table users {
    id INT [pk, increment]
    username VARCHAR(50) [unique, not null]
    password_hash TEXT [not null]
    created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
    last_password_change TIMESTAMP [default: `CURRENT_TIMESTAMP`]
}

Table user_profiles {
    id INT [pk, increment]
    user_id INT [unique, not null, ref: > users.id]
    email VARCHAR(255) [unique, not null]
    name VARCHAR(100)
    location VARCHAR(100)
    bio TEXT
    personality_type VARCHAR(50)
    created_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
    updated_at TIMESTAMP [default: `CURRENT_TIMESTAMP`]
}

Ref: user_profiles.user_id > users.id [delete: cascade]
```

**Migration Evolution Strategy:**
- **V3**: Add authentication fields to existing users table (password_hash, last_password_change)
- **V4**: Create user_profiles table with foreign key, migrate email data, add personality test data
- **V5**: Remove redundant columns from users table for clean separation of concerns

### Database Design & Migrations
- **DBML Documentation**: Use Database Markup Language for clear schema documentation
- **Migration Versioning**: Sequential numbering (V1, V2, V3) with descriptive names
- **Schema Evolution**: Plan table relationships and constraints from the beginning
- **Migration Best Practices**:
  - One logical change per migration file
  - Always test rollback procedures
  - Document the purpose and impact of each migration
  - Use descriptive migration names (V1__create_users_table.sql)

### 🚨 Critical Production Pattern: Flyway + Prisma Synchronization
**The Challenge**: In production, you need database migrations (Flyway) and ORM schema (Prisma) to stay perfectly synchronized.

**The Solution**: Automated pipeline workflow that prevents schema drift:
```bash
# Production deployment pipeline
1. Apply Flyway migrations → Database schema updated
2. Run Prisma introspection → Schema file generated from database
3. Generate Prisma client → Type-safe client matches database
4. Deploy application → Guaranteed schema consistency
```

**Why This Matters**:
- **Runtime Safety**: Prevents "table doesn't exist" errors in production
- **Type Safety**: Generated Prisma client exactly matches migrated database
- **Team Coordination**: Clear workflow for adding new migrations and ORM changes
- **Schema Drift Prevention**: Database and ORM models never get out of sync

**CI/CD Integration**:
```yaml
# Example pipeline step
- name: Sync Database Schema
  run: |
    flyway migrate                    # Apply pending migrations
    npx prisma db pull               # Update schema from database
    npx prisma generate              # Generate client from schema
    npm test                         # Verify everything works
```

**Production Benefits**:
- Zero schema drift between teams
- Automated verification of database-ORM consistency
- Safe migrations with type-safe application code
- Clear audit trail of schema changes

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