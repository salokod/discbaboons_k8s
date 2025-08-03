# DiscBaboons Documentation

Comprehensive documentation for the DiscBaboons disc golf tracking application - a full-stack project with Express.js backend and React Native mobile frontend.

## 🚀 Quick Start

### For Developers
1. **[Development Setup](./development/local-setup.md)** - Complete local environment setup
2. **[Daily Workflows](./development/workflows.md)** - Common development commands
3. **[Testing Standards](./development/testing-standards.md)** - TDD approach and requirements

### For API Users
1. **[API Documentation](./express-server/api/)** - Complete API reference
2. **[Authentication Guide](./express-server/api/auth/)** - Get started with user accounts
3. **[Database Schema](./express-server/database/)** - Data structure and relationships

## 📚 Documentation Sections

### 🖥️ Backend (Express.js)
- **[API Documentation](./express-server/api/)** - Complete REST API reference with 50+ endpoints
- **[Database Documentation](./express-server/database/)** - PostgreSQL schema, migrations, and operations

### 📱 Mobile (React Native) 
- **[Mobile App Documentation](./mobile/)** - iOS and Android app development (coming soon)

### 🛠️ Development
- **[Development Guide](./development/)** - Local setup, workflows, testing standards, and troubleshooting
- **[Testing Standards](./development/testing-standards.md)** - TDD methodology with Martin Fowler's Testing Pyramid

### 🏗️ Infrastructure
- **[Infrastructure Documentation](./infrastructure/)** - Kubernetes, CI/CD, production deployment, and DevOps

### 📋 Planning
- **[Planning Documentation](./planning/)** - Active project planning and archived development work

### 📖 Standards
- **[Coding Standards](./standards/)** - Code review methodology, quality requirements, and best practices

## 🎯 Project Status

### ✅ Backend Complete
Production-ready Express.js API with:
- **Authentication & User Management**: JWT tokens, profiles, password reset
- **Course Database**: 7,000+ disc golf courses with advanced search
- **Bag Management**: Disc tracking, lost disc management, friend visibility
- **Round Management**: Create rounds, invite players, scoring system
- **Betting Systems**: Traditional skins + side bets with money tracking  
- **Social Features**: Friend system, profile sharing, privacy controls

### 🚧 Current Work
- **GPS Course Search Endpoint**: Final backend endpoint before frontend development
- **React Native Planning**: Mobile app architecture and user experience design

### ⏳ Next Phase
- **React Native Development**: iOS and Android mobile application
- **Frontend Integration**: Connect mobile app to backend API
- **User Testing**: Beta testing with disc golf communities

## 🏗️ Architecture Overview

### Technology Stack
- **Backend**: Node.js 22, Express.js, PostgreSQL 15, Kubernetes
- **Frontend**: React Native (iOS/Android)
- **Infrastructure**: DigitalOcean Kubernetes, GitHub Actions CI/CD
- **Security**: JWT authentication, HTTPS with Let's Encrypt

### Key Features
- **50+ API Endpoints**: Complete CRUD operations for all features
- **Real-time Scoring**: Live leaderboard updates during rounds
- **Dual Betting Systems**: Traditional skins with carry-over + custom side bets
- **Social Integration**: Friend networks and round sharing
- **Offline Capability**: Score caching for poor connectivity (planned)
- **GPS Integration**: Course discovery and location-based features (planned)

## 🔧 Development Workflows

### Getting Started
```bash
# 1. Clone the repository
git clone <repository-url>
cd discbaboons_k8s

# 2. Follow setup guide
open docs/development/local-setup.md

# 3. Start development environment
./rebuild-apps.sh

# 4. Access the API
kubectl port-forward service/express-service 8080:3000
curl http://localhost:8080/health
```

### Daily Development
```bash
# Check status
kubectl get pods

# View logs
kubectl logs -f deployment/express-deployment

# Run tests
cd apps/express-server
npm test

# Deploy changes
./rebuild-apps.sh
```

## 📖 Documentation Standards

### Organization Principles
- **By Service**: Documentation organized by backend/frontend services
- **By Purpose**: Development, infrastructure, planning clearly separated
- **Progressive Disclosure**: Quick start → detailed guides → reference material
- **Current and Accurate**: Active docs separated from archived work

### Finding What You Need

| Need | Go To |
|------|-------|
| **Start development** | [Development Setup](./development/local-setup.md) |
| **API reference** | [API Documentation](./express-server/api/) |
| **Production deployment** | [Infrastructure Guide](./infrastructure/) |
| **Code standards** | [Standards Documentation](./standards/) |
| **Project planning** | [Planning Documentation](./planning/) |
| **Troubleshooting** | [Development Troubleshooting](./development/troubleshooting.md) |

## 🎯 Portfolio Highlights

This project demonstrates:

### Full-Stack Development
- **Modern Backend**: Node.js, Express.js, PostgreSQL with production Kubernetes deployment
- **Mobile Frontend**: React Native for iOS and Android (in development)
- **API Design**: RESTful design with comprehensive endpoint coverage

### DevOps & Infrastructure
- **Kubernetes**: Production deployment on DigitalOcean with proper configuration
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

## 🤝 Contributing

1. Read [Development Standards](./standards/) for code quality requirements
2. Follow [TDD Methodology](./development/testing-standards.md) for all changes
3. Use [PR Review Guidelines](./standards/PR_REVIEW_METHODOLOGY.md) for reviews
4. Keep [API Documentation](./express-server/api/) current with changes

## 📞 Support

- **GitHub Issues**: Report bugs and request features
- **Documentation Issues**: PRs welcome for doc improvements
- **Development Questions**: Check [Development Guide](./development/) first

---

**DiscBaboons** - Making disc golf more social, competitive, and fun! 🥏