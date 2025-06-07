# DiscBaboons K8s - Disc Golf Tracker Backend 🥏

**Production-ready Kubernetes backend for a disc golf tracking application, built on DigitalOcean with automated CI/CD.**

## 🚀 Live Application
- **Production URL**: https://discbaboons.spirojohn.com
- **API Health**: https://discbaboons.spirojohn.com/health
- **API Info**: https://discbaboons.spirojohn.com/api/info

## 📋 Current Status
This is a **production-ready backend infrastructure** with:
- ✅ Express.js API server running on Kubernetes
- ✅ PostgreSQL database with persistent storage and migrations
- ✅ Automated CI/CD with semantic versioning
- ✅ Production security (RBAC, network policies, non-root containers)
- ✅ HTTPS with Let's Encrypt certificates
- ✅ Multi-environment configuration (dev/prod)

**Next Phase**: Building authentication and disc golf tracking APIs

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 22 with ES Modules
- **Framework**: Express.js with Jest testing
- **Database**: PostgreSQL 15 with Flyway migrations
- **ORM**: Prisma
- **Container Registry**: Docker Hub
- **Infrastructure**: DigitalOcean Kubernetes
- **CI/CD**: GitHub Actions with semantic-release
- **SSL/TLS**: Let's Encrypt with cert-manager
- **Ingress**: NGINX Ingress Controller

### Database Schema
Current normalized schema with authentication support:
- `users` table: Core authentication (username, password_hash)
- `user_profiles` table: Profile data (email, name, bio) with foreign key to users

See [Database Documentation](docs/database/) for complete schema and migration strategy.

## 🛠️ Prerequisites
- Docker Desktop
- Kind: `brew install kind`
- kubectl: `brew install kubectl`
- Node.js 22+

## ⚡ Quick Start

### Development Environment
```bash
# Deploy to local Kind cluster
./rebuild-dev.sh

# Access application locally
kubectl port-forward service/express-service 8080:3000
curl http://localhost:8080/health
```

### Production Environment (Testing)
```bash
# Deploy production configuration locally
./rebuild-prod.sh

# Verify production settings
kubectl exec deployment/express-deployment -- env | grep NODE_ENV
# Expected: NODE_ENV=production
```

## 🔧 Development Workflows

### Code Changes
```bash
# When you modify Express server code
cd apps/express-server
docker build -t discbaboons-express:v4 .  # Increment version
kind load docker-image discbaboons-express:v4 --name discbaboons-learning
kubectl apply -f manifests/dev/express-deployment.yaml

# When you modify configuration
kubectl apply -f manifests/dev/express-configmap.yaml
kubectl rollout restart deployment/express-deployment
```

### Testing
```bash
# Run tests locally
cd apps/express-server
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run lint               # Code linting
```

## 🗂️ Project Structure

```
├── README.md                     # This file
├── kind-config.yaml             # Kind cluster configuration
├── rebuild-dev.sh               # Development environment script
├── rebuild-prod.sh              # Production environment script
├── apps/
│   └── express-server/          # Express.js application
├── docs/                        # Project documentation
│   ├── kubernetes-learning-journey.md     # Learning notes and journey
│   ├── development-workflows.md           # Development procedures
│   ├── production-deployment-guide.md     # Production deployment guide
│   ├── cicd-guide.md                     # CI/CD pipeline documentation
│   ├── sealed-secrets-guide.md           # Sealed secrets implementation
│   ├── secret-rotation-guide.md          # Secret rotation procedures
│   └── database/                         # Database documentation
├── manifests/                   # Kubernetes YAML files
│   ├── dev/                    # Development environment
│   └── prod/                   # Production environment
└── migrations/                  # Flyway database migrations
```

## 🚀 Production Deployment

The application is deployed on DigitalOcean Kubernetes with:
- **HTTPS**: Automated Let's Encrypt certificates
- **Security**: RBAC, network policies, non-root containers
- **Monitoring**: Comprehensive logging and health checks
- **CI/CD**: Automated deployment via GitHub Actions

See [Production Deployment Guide](docs/production-deployment-guide.md) for complete details.

## 📚 Documentation

- [🎓 Kubernetes Learning Journey](docs/kubernetes-learning-journey.md) - Complete learning notes and key concepts
- [⚙️ Development Workflows](docs/development-workflows.md) - Daily development procedures and commands
- [🚀 Production Deployment Guide](docs/production-deployment-guide.md) - Production deployment procedures
- [🔄 CI/CD Guide](docs/cicd-guide.md) - GitHub Actions pipeline and semantic versioning
- [🔐 Sealed Secrets Guide](docs/sealed-secrets-guide.md) - GitOps-friendly secret management
- [🔄 Secret Rotation Guide](docs/secret-rotation-guide.md) - Secret rotation procedures
- [🗄️ Database Documentation](docs/database/) - Schema, migrations, and DBML documentation

## 🆘 Quick Commands

### Cluster Management
```bash
# Create/delete cluster
kind create cluster --config=kind-config.yaml
kind delete cluster --name discbaboons-learning

# Check cluster status
kubectl cluster-info
kubectl get nodes
kubectl get pods -A
```

### Application Access
```bash
# Local development access
kubectl port-forward service/express-service 8080:3000
curl http://localhost:8080/health

# Database access (development only)
kubectl port-forward service/postgres-service 5432:5432
```

### Debugging
```bash
# Check application logs
kubectl logs -l app=express --follow

# Check pod status
kubectl get pods -o wide
kubectl describe pod <pod-name>

# Restart deployment
kubectl rollout restart deployment/express-deployment
```

## 🎯 Next Steps

1. **Authentication APIs**: Implement JWT-based authentication endpoints
2. **Disc Management**: Build disc collection and catalog APIs
3. **Game Tracking**: Implement scorecard and round tracking
4. **React Native App**: Build mobile frontend after APIs are complete

## 📄 License

MIT License - see LICENSE file for details.
