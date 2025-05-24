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

# 3. Deploy application
cd ../../
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
kubectl apply -f manifests/express-deployment.yaml
kubectl apply -f manifests/express-service.yaml

# Access application
kubectl port-forward service/express-service 8080:3000
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

### Development & Testing
```bash
# Run tests locally
cd apps/express-server
npm test

# Lint code
npm run lint

# Build new image after changes
docker build -t discbaboons-express:v2 .
kind load docker-image discbaboons-express:v2 --name discbaboons-learning

# Update deployment with new image
kubectl set image deployment/express-deployment express=discbaboons-express:v2
```

## Project Structure

```
├── kind-config.yaml           # Kind cluster configuration
├── apps/
│   └── express-server/        # Express.js application
│       ├── server.js         # Main application
│       ├── server.test.js    # Jest tests
│       ├── package.json      # Node.js dependencies
│       └── Dockerfile        # Container definition
└── manifests/                # Kubernetes YAML files
    ├── express-deployment.yaml
    ├── express-service.yaml
    └── hello-*.yaml          # Learning examples
```

## Learning Progress

- ✅ **Week 1**: Kind setup, Pods, Services, Deployments
- ✅ **Express App**: Modern Node.js 22 + ESM + Jest + Airbnb ESLint
- 🔄 **Week 2**: ConfigMaps, Secrets, Environment management
- ⏳ **Week 3**: PostgreSQL database with persistent volumes
- ⏳ **Week 4**: Ingress controllers and HTTPS
- ⏳ **Week 5**: Monitoring and logging

## Endpoints

When port-forwarding is active (`kubectl port-forward service/express-service 8080:3000`):

- **Main**: http://localhost:8080/
- **Health**: http://localhost:8080/health  
- **Info**: http://localhost:8080/api/info

## Shutting Down

### End of Day (Keep Cluster for Tomorrow)
```bash
# Just stop port-forwarding (Ctrl+C)
# Cluster and apps keep running
```

### End of Week (Clean Shutdown)
```bash
# Delete applications
kubectl delete -f manifests/

# Delete cluster
kind delete cluster --name discbaboons-learning
```