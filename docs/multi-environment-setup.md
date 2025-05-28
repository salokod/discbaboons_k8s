# Multi-Environment Configuration Management

This document explains the multi-environment setup for the DiscBaboons Kubernetes learning project.

## Overview

We've implemented a folder-based approach to manage different environments (development vs production) with separate configurations while sharing common infrastructure components.

## Folder Structure

```
manifests/
├── dev/                          # Development-specific manifests
│   ├── express-configmap.yaml    # NODE_ENV: development, LOG_LEVEL: debug
│   ├── express-deployment.yaml   # Lower resource limits, 1 replica
│   ├── express-service.yaml      # Development service config
│   └── postgres-secret.yaml      # Development database credentials
├── prod/                         # Production-specific manifests
│   ├── express-configmap.yaml    # NODE_ENV: production, LOG_LEVEL: info
│   ├── express-deployment.yaml   # Higher resource limits, multiple replicas
│   ├── express-service.yaml      # Production service config
│   └── postgres-secret.yaml      # Production database credentials
└── [shared resources]            # Shared between all environments
    ├── postgres-configmap.yaml   # Database configuration
    ├── postgres-deployment.yaml  # PostgreSQL deployment
    ├── postgres-pvc.yaml         # Persistent storage
    ├── postgres-service.yaml     # Database service
    ├── flyway-configmap.yaml     # Migration tool config
    └── flyway-migrations-configmap.yaml # Database migrations
```

## Key Differences Between Environments

### Development Environment (`dev/`)
- **Node Environment**: `NODE_ENV: development`
- **Logging Level**: `LOG_LEVEL: debug` (verbose logging for debugging)
- **Replicas**: 1 (single instance for faster iteration)
- **Resources**: Lower CPU/memory limits for local development
- **Purpose**: Fast development cycles, debugging, testing

### Production Environment (`prod/`)
- **Node Environment**: `NODE_ENV: production`
- **Logging Level**: `LOG_LEVEL: info` (cleaner production logs)
- **Replicas**: Multiple (high availability)
- **Resources**: Higher CPU/memory limits for production load
- **Purpose**: Production-ready deployment with proper resource allocation

## Deployment Scripts

### 1. Main Script: `rebuild-apps.sh`
- **Usage**: `./rebuild-apps.sh <environment>`
- **Environments**: `dev` or `prod`
- **Features**: 
  - Environment parameter validation
  - Automatic path resolution for environment-specific manifests
  - Clear indication of which environment is being deployed

### 2. Development Script: `rebuild-dev.sh`
- **Usage**: `./rebuild-dev.sh`
- **Purpose**: Quick development environment deployment
- **Features**: 
  - No parameter needed
  - Optimized for development workflow
  - Shows development-specific configuration summary

### 3. Production Script: `rebuild-prod.sh`
- **Usage**: `./rebuild-prod.sh`
- **Purpose**: Production environment deployment with safety checks
- **Features**: 
  - Safety confirmation prompt
  - Production-specific warnings
  - Production monitoring guidance

## Usage Examples

```bash
# Deploy development environment (quick)
./rebuild-dev.sh

# Deploy production environment (with safety checks)
./rebuild-prod.sh

# Deploy specific environment using main script
./rebuild-apps.sh dev
./rebuild-apps.sh prod
```

## Verification Commands

### Check Current Environment Configuration
```bash
# Check environment variables
kubectl exec deployment/express-deployment -- env | grep -E '(NODE_ENV|LOG_LEVEL)'

# Check number of replicas
kubectl get pods -l app=express

# Check resource allocation
kubectl describe deployment express-deployment
```

### Expected Output

**Development Environment:**
```
NODE_ENV=development
LOG_LEVEL=debug
# Single pod running
```

**Production Environment:**
```
NODE_ENV=production
LOG_LEVEL=info
# Multiple pods running
```

## Benefits of This Approach

1. **Clear Separation**: Environment-specific configs are isolated in their own folders
2. **Shared Resources**: Common infrastructure (PostgreSQL, Flyway) remains shared
3. **Safety**: Production script requires explicit confirmation
4. **Flexibility**: Easy to add new environments (staging, qa, etc.)
5. **Maintainability**: Changes to shared resources affect all environments consistently
6. **Best Practices**: Follows Kubernetes deployment patterns for multi-environment management

## Next Steps

- [ ] Add health checks for production deployments
- [ ] Implement security contexts for production
- [ ] Create staging environment configuration
- [ ] Prepare for real DigitalOcean deployment (Week 4)

## Learning Objectives Achieved

✅ **Understanding Environment Configuration**: Learned why different environments need different settings  
✅ **Kubernetes Resource Organization**: Implemented folder-based manifest organization  
✅ **Deployment Automation**: Created environment-aware scripts with safety checks  
✅ **Production Readiness Concepts**: Understood replica management, resource limits, and logging levels  
✅ **DevOps Best Practices**: Implemented proper separation of concerns and deployment workflows  

This setup prepares you for real-world Kubernetes deployments where managing multiple environments is essential for reliable software delivery.
