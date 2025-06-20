# DiscBaboons K8s - Disc Golf Tracker Backend 🥏

**Production-ready Kubernetes backend for a disc golf tracking application, built on DigitalOcean with automated CI/CD.**

## 📋 Current Status
This is a **production-ready backend infrastructure** with:
- ✅ Express.js API server running on Kubernetes
- ✅ PostgreSQL database with persistent storage and migrations
- ✅ Automated CI/CD with semantic versioning
- ✅ Production security (RBAC, network policies, non-root containers)
- ✅ HTTPS with Let's Encrypt certificates
- ✅ Multi-environment configuration (dev/prod)

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