# Daily Development Workflows

Common development commands and procedures for working with the DiscBaboons backend.

## Essential Commands

### Development Environment Status
```bash
# Check cluster status
kubectl get nodes
kubectl get pods,services

# Check application logs
kubectl logs -f deployment/express-deployment
kubectl logs -f deployment/postgres-deployment

# Check environment configuration
kubectl exec deployment/express-deployment -- env | grep -E '(NODE_ENV|LOG_LEVEL)'
```

### Application Access
```bash
# Access the Express API
kubectl port-forward service/express-service 8080:3000

# Access PostgreSQL database
kubectl port-forward service/postgres-service 5432:5432
psql -h localhost -p 5432 -U app_user -d discbaboons_db
# Password: secure_password_123
```

## Development Workflows

### Code Changes & Testing
```bash
# 1. Make code changes in apps/express-server/

# 2. Run tests locally
cd apps/express-server
npm test
npm run lint

# 3. Build and deploy new version
cd ../..
./rebuild-apps.sh

# 4. Verify deployment
kubectl get pods
kubectl logs -f deployment/express-deployment
```

### Database Operations
```bash
# Connect to database
kubectl port-forward service/postgres-service 5432:5432 &
psql -h localhost -p 5432 -U app_user -d discbaboons_db

# Check migration status
SELECT * FROM flyway_schema_history ORDER BY installed_on DESC LIMIT 5;

# View current schema
\dt    # List tables
\d users  # Describe table structure

# Exit database
\q
```

### Debugging Common Issues
```bash
# Pod not starting
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous

# Init container issues
kubectl logs <pod-name> -c wait-for-postgres --follow
kubectl logs <pod-name> -c flyway-migrate --follow

# Service connectivity
kubectl exec -it deployment/express-deployment -- /bin/sh
# Inside pod: curl http://postgres-service:5432
```

### Cleanup & Reset
```bash
# Restart application only
kubectl rollout restart deployment/express-deployment

# Clean slate deployment
kubectl delete -f manifests/
kubectl delete pvc postgres-pvc
# Then re-run setup from local-setup.md

# Complete cluster reset
kind delete cluster --name discbaboons-learning
# Then re-run cluster creation from local-setup.md
```

## API Testing Workflows

### Health Checks
```bash
# Basic health check
curl http://localhost:8080/health

# API info
curl http://localhost:8080/api/info

# Database connectivity test
curl http://localhost:8080/api/users
```

### Authentication Testing
```bash
# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/profile
```

### API Endpoint Testing
```bash
# List endpoints by category
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/bags
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/courses
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/friends
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/rounds
```

## Development Best Practices

### Before Making Changes
1. Check current cluster status: `kubectl get pods`
2. Pull latest changes: `git pull`
3. Review existing tests for the area you're modifying

### After Making Changes
1. Run tests locally: `npm test`
2. Check linting: `npm run lint`
3. Deploy and test: `./rebuild-apps.sh`
4. Verify functionality with curl commands

### Code Quality Workflow
1. Follow TDD approach (see [Testing Standards](./testing-standards.md))
2. Use Chance.js for dynamic test data
3. Ensure proper error handling patterns
4. Test edge cases and validation scenarios

## Useful Kubernetes Commands

### Resource Monitoring
```bash
# Watch pods status
kubectl get pods -w

# Resource usage
kubectl top pods
kubectl top nodes

# Describe resources
kubectl describe deployment express-deployment
kubectl describe service express-service
```

### Configuration Management
```bash
# View ConfigMaps
kubectl get configmaps
kubectl describe configmap express-config

# View Secrets
kubectl get secrets
kubectl describe secret express-secret

# View persistent volumes
kubectl get pv,pvc
```

### Network Debugging
```bash
# Port forwarding
kubectl port-forward service/express-service 8080:3000
kubectl port-forward service/postgres-service 5432:5432

# Exec into pods
kubectl exec -it deployment/express-deployment -- /bin/sh
kubectl exec -it deployment/postgres-deployment -- /bin/bash

# Check service endpoints
kubectl get endpoints
```

## Next Steps

- Review [Testing Standards](./testing-standards.md) for TDD approach
- Check [Troubleshooting](./troubleshooting.md) for common issues
- See [API Documentation](../express-server/api/) for endpoint details