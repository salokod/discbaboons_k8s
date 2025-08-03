# Troubleshooting Guide

Common issues and solutions for local development environment.

## Pod Issues

### Pods Not Starting

#### Symptoms
```bash
kubectl get pods
# Shows pods in Pending, CrashLoopBackOff, or Error state
```

#### Diagnosis
```bash
# Check pod details
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name> --follow
kubectl logs <pod-name> --previous  # Previous container logs
```

#### Common Solutions
```bash
# Check resource availability
kubectl top nodes
kubectl top pods

# Delete and recreate pod
kubectl delete pod <pod-name>
# Kubernetes will recreate it automatically

# Check image availability
docker images | grep discbaboons
kind load docker-image discbaboons-express:latest --name discbaboons-learning
```

### Init Container Issues

#### Symptoms
```bash
kubectl get pods
# Shows pods stuck in Init:0/2 or Init:1/2
```

#### Diagnosis
```bash
# Check init container logs
kubectl logs <pod-name> -c wait-for-postgres --follow
kubectl logs <pod-name> -c flyway-migrate --follow

# Check if postgres is ready
kubectl get pods -l app=postgres
kubectl logs deployment/postgres-deployment
```

#### Solutions
```bash
# Wait for postgres to be fully ready
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment

# Check postgres service connectivity
kubectl exec -it deployment/express-deployment -- /bin/sh
# Inside pod: nc -zv postgres-service 5432

# Restart postgres if needed
kubectl rollout restart deployment/postgres-deployment
```

## Database Issues

### Connection Failures

#### Symptoms
- Express app logs show database connection errors
- Health check endpoint fails
- API endpoints return 500 errors

#### Diagnosis
```bash
# Check postgres logs
kubectl logs deployment/postgres-deployment

# Test connection manually
kubectl port-forward service/postgres-service 5432:5432
psql -h localhost -p 5432 -U app_user -d discbaboons_db
# Password: secure_password_123
```

#### Solutions
```bash
# Check postgres is running
kubectl get pods -l app=postgres

# Verify connection string in configmap
kubectl describe configmap express-config

# Restart both postgres and express
kubectl rollout restart deployment/postgres-deployment
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment
kubectl rollout restart deployment/express-deployment
```

### Migration Issues

#### Symptoms
- Flyway init container fails
- Database schema is missing or outdated
- Migration logs show SQL errors

#### Diagnosis
```bash
# Check flyway logs
kubectl logs <express-pod> -c flyway-migrate

# Check migration history in database
kubectl port-forward service/postgres-service 5432:5432
psql -h localhost -p 5432 -U app_user -d discbaboons_db
# \dt  # List tables
# SELECT * FROM flyway_schema_history ORDER BY installed_on DESC;
```

#### Solutions
```bash
# Re-apply flyway configmaps
kubectl apply -f manifests/flyway-configmap.yaml
kubectl apply -f manifests/flyway-migrations-configmap.yaml

# Delete and recreate express deployment (triggers migration)
kubectl delete deployment express-deployment
kubectl apply -f manifests/express-deployment.yaml

# If migrations are corrupted, reset database
kubectl delete deployment postgres-deployment
kubectl delete pvc postgres-pvc
# Then re-run full setup from local-setup.md
```

## Network Issues

### Service Connectivity

#### Symptoms
- Services can't reach each other
- Port forwarding fails
- API endpoints timeout

#### Diagnosis
```bash
# Check service endpoints
kubectl get endpoints
kubectl describe service express-service
kubectl describe service postgres-service

# Test internal connectivity
kubectl exec -it deployment/express-deployment -- /bin/sh
# Inside pod: 
curl http://postgres-service:5432
nc -zv postgres-service 5432
```

#### Solutions
```bash
# Check service selectors match pod labels
kubectl describe service express-service
kubectl get pods -l app=express --show-labels

# Restart services
kubectl delete service express-service postgres-service
kubectl apply -f manifests/express-service.yaml
kubectl apply -f manifests/postgres-service.yaml

# Check network policies (if any)
kubectl get networkpolicies
```

### Port Forwarding Issues

#### Symptoms
- `kubectl port-forward` fails or disconnects
- Local access to services doesn't work

#### Solutions
```bash
# Kill existing port forwards
pkill -f "kubectl port-forward"

# Use different local ports
kubectl port-forward service/express-service 8081:3000
kubectl port-forward service/postgres-service 5433:5432

# Check if ports are already in use
lsof -i :8080
lsof -i :5432

# Use pod instead of service
kubectl get pods
kubectl port-forward pod/<express-pod-name> 8080:3000
```

## Application Issues

### Express App Crashes

#### Symptoms
- Pods restart frequently
- HTTP requests return connection refused
- Express logs show uncaught exceptions

#### Diagnosis
```bash
# Check application logs
kubectl logs deployment/express-deployment --follow

# Check restart count
kubectl get pods
kubectl describe pod <express-pod>

# Check resource usage
kubectl top pods
```

#### Solutions
```bash
# Check for memory leaks or resource limits
kubectl describe pod <express-pod>

# Update resource limits in manifest
# manifests/express-deployment.yaml:
#   resources:
#     limits:
#       memory: "512Mi"
#       cpu: "500m"

# Check environment variables
kubectl exec deployment/express-deployment -- env

# Rebuild and redeploy app
cd apps/express-server
docker build -t discbaboons-express:latest .
cd ../..
kind load docker-image discbaboons-express:latest --name discbaboons-learning
kubectl rollout restart deployment/express-deployment
```

### API Errors

#### Symptoms
- Specific endpoints return 500 errors
- Authentication failures
- Database query errors

#### Diagnosis
```bash
# Check detailed logs
kubectl logs deployment/express-deployment --follow

# Test specific endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/info
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

#### Solutions
```bash
# Check database connectivity from app
kubectl exec -it deployment/express-deployment -- /bin/sh
# Inside pod: nc -zv postgres-service 5432

# Verify environment configuration
kubectl describe configmap express-config
kubectl describe secret express-secret

# Check if required tables exist
kubectl port-forward service/postgres-service 5432:5432
psql -h localhost -p 5432 -U app_user -d discbaboons_db
# \dt  # Should show users, user_profiles, etc.
```

## Kind Cluster Issues

### Cluster Not Responding

#### Symptoms
- `kubectl` commands timeout
- Cluster unreachable

#### Solutions
```bash
# Check cluster status
kind get clusters
kubectl cluster-info

# Restart Docker Desktop
# In Docker Desktop: Restart

# Delete and recreate cluster
kind delete cluster --name discbaboons-learning
kind create cluster --config=kind-config.yaml --name discbaboons-learning
# Then re-run setup from local-setup.md
```

### Image Loading Issues

#### Symptoms
- Pods show `ImagePullBackOff` or `ErrImagePull`
- Custom images not found

#### Solutions
```bash
# Check available images
docker images | grep discbaboons

# Rebuild and load image
cd apps/express-server
docker build -t discbaboons-express:latest .
cd ../..
kind load docker-image discbaboons-express:latest --name discbaboons-learning

# Check image pull policy in deployment
kubectl describe deployment express-deployment
# Should show: imagePullPolicy: Never
```

## Performance Issues

### Slow Startup

#### Symptoms
- Long wait times for pods to become ready
- Timeouts during deployment

#### Solutions
```bash
# Increase timeout values
kubectl wait --for=condition=available --timeout=600s deployment/postgres-deployment

# Check resource allocation
kubectl top nodes
kubectl describe nodes

# Pre-pull images
docker pull postgres:15
kind load docker-image postgres:15 --name discbaboons-learning
```

### High Resource Usage

#### Symptoms
- System becomes slow
- Docker Desktop uses too much CPU/memory

#### Solutions
```bash
# Check resource usage
kubectl top pods
kubectl top nodes

# Reduce replica counts for development
# In manifests/express-deployment.yaml:
#   replicas: 1  # Instead of 2

# Adjust Docker Desktop resource limits
# Docker Desktop > Settings > Resources
```

## Testing Issues

### Test Failures

#### Symptoms
- `npm test` fails
- Tests timeout or hang
- Database connection errors in tests

#### Solutions
```bash
# Run tests with verbose output
cd apps/express-server
npm test -- --verbose

# Check test database configuration
cat tests/helpers/testHelpers.js

# Reset test environment
npm run test:reset  # If available
# Or manually clean test data

# Run specific test files
npm test -- rounds.complete.service.test.js
```

## Common Error Messages

### "Connection ECONNREFUSED"
- **Cause**: Service not running or wrong connection details
- **Solution**: Check service status and connection string

### "Error: listen EADDRINUSE"
- **Cause**: Port already in use
- **Solution**: Kill process using port or use different port

### "no such host"
- **Cause**: DNS resolution failure between services
- **Solution**: Check service names and verify they exist

### "ImagePullBackOff"
- **Cause**: Image not available in Kind cluster
- **Solution**: Load image with `kind load docker-image`

### "CrashLoopBackOff"
- **Cause**: Application keeps crashing on startup
- **Solution**: Check logs and fix application errors

## Getting Help

If you can't resolve an issue:

1. Check the logs: `kubectl logs deployment/express-deployment --follow`
2. Describe the resource: `kubectl describe pod <pod-name>`
3. Check recent changes: `git log --oneline -10`
4. Reset environment: Follow cleanup steps in [Local Setup](./local-setup.md)
5. Create GitHub issue with logs and error details

## Useful Debug Commands

```bash
# Comprehensive status check
kubectl get all
kubectl get events --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods
kubectl top nodes

# Detailed pod information
kubectl describe pod <pod-name>

# Execute commands in containers
kubectl exec -it deployment/express-deployment -- /bin/sh

# Port forward multiple services
kubectl port-forward service/express-service 8080:3000 &
kubectl port-forward service/postgres-service 5432:5432 &

# Clean up port forwards
pkill -f "kubectl port-forward"
```