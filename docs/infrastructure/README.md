# Infrastructure Documentation

DevOps, Kubernetes, and production deployment documentation.

## Quick Links

- **[Kubernetes Guide](./kubernetes-guide.md)** - Kind cluster setup and Kubernetes fundamentals
- **[CI/CD Guide](./cicd-guide.md)** - GitHub Actions pipeline configuration
- **[Production Deployment](./production-deployment-guide.md)** - DigitalOcean Kubernetes deployment
- **[Multi-Environment Setup](./multi-environment-setup.md)** - Development vs production configuration
- **[Sealed Secrets](./sealed-secrets-guide.md)** - Secret management in Kubernetes
- **[Secret Rotation](./secret-rotation-guide.md)** - Rotating secrets and certificates
- **[GitHub Branch Protection](./github-branch-protection.md)** - Repository security settings

## Architecture Overview

### Production Environment
- **Platform**: DigitalOcean Kubernetes
- **Domain**: discbaboons.spirojohn.com
- **SSL/TLS**: Let's Encrypt certificates with cert-manager
- **Ingress**: NGINX Ingress Controller
- **CI/CD**: GitHub Actions with semantic versioning

### Development Environment
- **Platform**: Kind (Kubernetes in Docker)
- **Local Access**: kubectl port-forward
- **Image Management**: Docker Hub with local loading
- **Configuration**: Development-specific ConfigMaps and Secrets

## Technology Stack

### Container Infrastructure
- **Runtime**: Node.js 22 with ES Modules
- **Framework**: Express.js with Vitest testing
- **Database**: PostgreSQL 15 with Flyway migrations
- **Container Registry**: Docker Hub
- **Orchestration**: Kubernetes (DigitalOcean managed)

### Security & Networking
- **SSL/TLS**: Let's Encrypt with cert-manager
- **Ingress**: NGINX Ingress Controller
- **RBAC**: Role-based access control
- **Network Policies**: Pod-to-pod communication rules
- **Container Security**: Non-root containers

### Monitoring & Operations
- **Health Checks**: Kubernetes liveness and readiness probes
- **Logging**: Centralized container logs
- **Secrets Management**: Sealed Secrets for GitOps
- **Automated Deployments**: Semantic release with GitHub Actions

## Deployment Workflows

### Development Deployment
1. Local development with Kind cluster
2. Manual testing and validation
3. Push to feature branch
4. Create pull request

### Production Deployment
1. Merge to main branch
2. Automated CI/CD pipeline triggers
3. Build and push Docker images
4. Deploy to DigitalOcean Kubernetes
5. Health checks and rollback if needed

## Security Practices

### Container Security
- Non-root user execution
- Read-only root filesystems where possible
- Resource limits and requests
- Security contexts

### Secret Management
- Sealed Secrets for sensitive data
- Regular secret rotation
- No secrets in container images
- Environment-specific configurations

### Network Security
- Network policies for pod isolation
- TLS encryption for all external traffic
- Internal service mesh (future consideration)

## Monitoring & Troubleshooting

### Health Monitoring
- Application health endpoints
- Kubernetes health checks
- Resource usage monitoring
- Log aggregation

### Common Operations
- Rolling updates and rollbacks
- Scaling applications
- Database maintenance
- Certificate renewal

## Next Steps

For specific implementation details, refer to the individual guides:

1. Start with [Kubernetes Guide](./kubernetes-guide.md) for local development
2. Review [CI/CD Guide](./cicd-guide.md) for deployment automation
3. Follow [Production Deployment](./production-deployment-guide.md) for live environment
4. Implement [Sealed Secrets](./sealed-secrets-guide.md) for secure GitOps