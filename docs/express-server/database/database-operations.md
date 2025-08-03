# Database Operations

This document contains common database operations for the DiscBaboons K8s application.

## Export Database Schema

To export the PostgreSQL database schema (without data) from the Kubernetes cluster:

### Option 1: Using a variable (two-step process)
```bash
# Get the PostgreSQL pod name
POSTGRES_POD=$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')

# Execute pg_dump inside the pod
kubectl exec $POSTGRES_POD -- pg_dump --schema-only --no-owner --no-privileges -U app_user discbaboons_db > /Users/dokolas/Desktop/Projects/discbaboons_k8s/apps/express-server/schema.sql
```

### Option 2: One-liner command
```bash
kubectl exec $(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- pg_dump --schema-only --no-owner --no-privileges -U app_user discbaboons_db > /Users/dokolas/Desktop/Projects/discbaboons_k8s/apps/express-server/schema.sql
```

### Command breakdown:
- `kubectl exec` - Execute a command inside a Kubernetes pod
- `$(kubectl get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')` - Get the PostgreSQL pod name dynamically
- `pg_dump` - PostgreSQL utility for backing up databases
- `--schema-only` - Export only the schema (tables, indexes, etc.), not the data
- `--no-owner` - Exclude ownership information
- `--no-privileges` - Exclude privilege/grant commands
- `-U app_user` - Connect as the app_user
- `discbaboons_db` - The database name
- `> schema.sql` - Redirect output to a file

### When to use this:
- Before major database migrations
- To share database structure with team members
- To version control your database schema
- To create a baseline for new environments

### Prerequisites:
- kubectl configured and connected to your cluster
- The PostgreSQL pod must be running
- You must have permissions to execute commands in the pod