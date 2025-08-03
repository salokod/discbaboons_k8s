# DiscBaboons - Disc Golf Tracker 🥏

**Full-stack disc golf tracking application with production-ready Kubernetes backend and React Native mobile frontend.**

## 📋 Current Status
This is a **complete backend** with React Native frontend in development:
- ✅ Express.js API with 50+ endpoints running on Kubernetes
- ✅ PostgreSQL database with comprehensive schema and migrations
- ✅ Automated CI/CD with semantic versioning and production deployment
- ✅ Production security (RBAC, network policies, non-root containers, HTTPS)
- ✅ Complete feature set: Authentication, Courses, Bags, Rounds, Scoring, Betting, Social
- 🚧 React Native mobile app (iOS/Android) - in planning phase

## 🏗️ Architecture

### Technology Stack
- **Backend**: Node.js 22, Express.js, PostgreSQL 15 with Flyway migrations
- **Frontend**: React Native (iOS/Android) - in development
- **Testing**: Vitest with comprehensive test coverage following Martin Fowler's Testing Pyramid
- **Infrastructure**: Kubernetes (DigitalOcean), Docker containers, NGINX Ingress
- **CI/CD**: GitHub Actions with semantic versioning and automated deployment
- **Security**: JWT authentication, HTTPS with Let's Encrypt, container security hardening

### Key Features
- **50+ API Endpoints**: Complete CRUD operations for all disc golf tracking features
- **Real-time Scoring**: Live leaderboard updates during rounds
- **Dual Betting Systems**: Traditional skins with carry-over + custom side bets with money tracking
- **Social Integration**: Friend networks, round sharing, and privacy controls
- **Course Database**: 7,000+ disc golf courses with advanced search capabilities
- **Bag Management**: Disc tracking, lost disc management, friend visibility

## 📚 Documentation

For comprehensive documentation, see the **[docs/](./docs/)** directory:

- **[Development Setup](./docs/development/)** - Local environment setup and daily workflows
- **[API Documentation](./docs/express-server/api/)** - Complete REST API reference
- **[Infrastructure Guide](./docs/infrastructure/)** - Kubernetes deployment and DevOps
- **[Testing Standards](./docs/standards/)** - Code quality and review methodology
- **[Project Planning](./docs/planning/)** - Active planning and archived development work

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Kind: `brew install kind`
- kubectl: `brew install kubectl`
- Node.js 22+

### Local Development Setup
```bash
# 1. Clone the repository
git clone <your-repository>
cd discbaboons_k8s

# 2. Start development environment
./rebuild-apps.sh

# 3. Access the API
kubectl port-forward service/express-service 8080:3000

# 4. Test the API
curl http://localhost:8080/health
```

For complete setup instructions, see [Development Setup](./docs/development/local-setup.md).

### Daily Development
```bash
# Check status
kubectl get pods

# View logs
kubectl logs -f deployment/express-deployment

# Run tests
cd apps/express-server && npm test

# Deploy changes
./rebuild-apps.sh
```

## 🎯 Portfolio Highlights

This project demonstrates:

### Full-Stack Development
- **Modern Backend**: Node.js, Express.js, PostgreSQL with production Kubernetes deployment
- **Mobile Frontend**: React Native for iOS and Android (in development)
- **API Design**: RESTful design with comprehensive endpoint coverage

### DevOps & Infrastructure
- **Kubernetes**: Production deployment with proper configuration and security
- **CI/CD**: Automated GitHub Actions pipeline with semantic versioning
- **Security**: JWT authentication, HTTPS, container security best practices

### Code Quality
- **Test-Driven Development**: Comprehensive test coverage with Martin Fowler's principles
- **Code Reviews**: Systematic review methodology with quality scoring
- **Documentation**: Complete API documentation and development guides

### Domain Expertise
- **Disc Golf Knowledge**: Deep understanding of scoring, betting, and social aspects
- **User Experience**: Intuitive workflows for course discovery and round management
- **Real-time Features**: Live scoring and leaderboard updates

## 🔧 Development Commands

### Environment Management
```bash
# Start/restart development environment
./rebuild-apps.sh

# Check cluster status
kubectl get nodes
kubectl get pods

# Access services
kubectl port-forward service/express-service 8080:3000
kubectl port-forward service/postgres-service 5432:5432
```

### Testing & Quality
```bash
# Run all tests
cd apps/express-server && npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Code quality checks
npm run lint
npm run verify
```

### Database Operations
```bash
# Access database
kubectl port-forward service/postgres-service 5432:5432
psql -h localhost -p 5432 -U app_user -d discbaboons_db

# Check migrations
SELECT * FROM flyway_schema_history ORDER BY installed_on DESC LIMIT 5;
```

## 📱 Upcoming: React Native Frontend

The mobile application will include:
- **Course Discovery**: GPS-based course search and selection
- **Round Management**: Create, join, and manage disc golf rounds
- **Live Scoring**: Real-time score entry with leaderboard updates
- **Betting Interface**: Manage skins and side bets during rounds
- **Social Features**: Friend connections and round sharing
- **Offline Support**: Score caching for poor connectivity scenarios

## 🤝 Contributing

1. Read [Development Standards](./docs/standards/) for code quality requirements
2. Follow [TDD Methodology](./docs/development/testing-standards.md) for all changes
3. Use [PR Review Guidelines](./docs/standards/PR_REVIEW_METHODOLOGY.md) for reviews
4. Keep [API Documentation](./docs/express-server/api/) current with changes

## 📞 Support

- **Documentation**: Check [docs/](./docs/) for comprehensive guides
- **Development Issues**: See [Troubleshooting Guide](./docs/development/troubleshooting.md)
- **Getting Started**: Follow [Development Setup](./docs/development/local-setup.md)

---

**DiscBaboons** - Making disc golf more social, competitive, and fun! 🥏