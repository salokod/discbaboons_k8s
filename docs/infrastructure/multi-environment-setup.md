# Multi-Environment Configuration Management

This document explains the multi-environment setup for the DiscBaboons Kubernetes learning project.

## Overview

The project maintains separate environment configurations to support both local development and production deployment. Local development uses Kind cluster with development-specific settings, while production deployment is handled via CI/CD pipeline to DigitalOcean Kubernetes.

**Current Approach**:
- **Development**: Local Kind cluster managed by `rebuild-apps.sh` script
- **Production**: DigitalOcean Kubernetes managed via CI/CD pipeline

## Folder Structure

```
manifests/
├── dev/                          # Development-specific manifests
│   ├── express-configmap.yaml    # NODE_ENV: development, LOG_LEVEL: debug
│   ├── express-deployment.yaml   # Lower resource limits, 1 replica
│   ├── express-service.yaml      # Development service config
│   └── postgres-secret.yaml      # Development database credentials
├── prod/                         # Production manifests (used by CI/CD)
│   ├── express-configmap.yaml    # NODE_ENV: production, LOG_LEVEL: info
│   ├── express-deployment.yaml   # Higher resource limits, multiple replicas
│   ├── express-service.yaml      # Production service config
│   ├── express-ingress.yaml      # HTTPS ingress with Let's Encrypt
│   ├── express-rbac.yaml         # Production security policies
│   └── postgres-sealed-v2.yaml   # Sealed secrets for production
└── [shared resources]            # Shared between environments
    ├── postgres-configmap.yaml   # Database configuration
    ├── postgres-service.yaml     # Database service
    ├── flyway-migrations-configmap.yaml # Database migrations
```

## Key Differences Between Environments

### Development Environment (`dev/`)
- **Node Environment**: `NODE_ENV: development`
- **Logging Level**: `LOG_LEVEL: debug` (verbose logging for debugging)
- **Replicas**: 1 (single instance for faster iteration)
- **Deployment**: Local Kind cluster via `rebuild-apps.sh`
- **Resources**: Lower CPU/memory limits for local development
- **Purpose**: Fast development cycles, debugging, testing

### Production Environment (`prod/`)
- **Node Environment**: `NODE_ENV: production`
- **Logging Level**: `LOG_LEVEL: info` (cleaner production logs)
- **Replicas**: Multiple (high availability)
- **Resources**: Higher CPU/memory limits for production load
- **Deployment**: DigitalOcean Kubernetes via CI/CD pipeline
- **Security**: RBAC, network policies, sealed secrets, HTTPS
- **Purpose**: Production-ready deployment with full security and monitoring

## Deployment Scripts

### Main Script: `rebuild-apps.sh`
- **Usage**: `./rebuild-apps.sh` (development environment only)
- **Environment**: Hardcoded to `dev` for local development
- **Features**: 
  - Automatic configuration for development environment
  - Uses local Kind cluster (`kind-discbaboons-learning`)
  - Clear indication of development-only deployment
  - Production deployments handled via CI/CD pipeline

**Note**: Production deployments are managed through the CI/CD pipeline to DigitalOcean Kubernetes. The local script only supports development environment deployment.

## Usage Examples

```bash
# Deploy development environment
./rebuild-apps.sh

# Access the application
kubectl port-forward service/express-service 8080:3000
curl http://localhost:8080/health
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
