# Secret Rotation Guide 🔄

## Overview
Secret rotation is the process of safely changing passwords and credentials in production without downtime. This guide provides step-by-step instructions for rotating database credentials in your Kubernetes cluster.

## Why Rotate Secrets?
- **Security policies** require regular password changes (every 90 days)
- **Team member changes** (someone leaves the company)
- **Suspected compromise** (password may have been exposed)
- **Compliance requirements** (audit requirements)

## Pre-Rotation Checklist

### 1. Document Current State
```bash
# Test that everything works before starting
kubectl get pods
kubectl port-forward service/express-service 8080:3000 &
curl http://localhost:8080/api/users
pkill -f "port-forward"

# Document current working state
echo "=== ROTATION START ===" > rotation-log.txt
echo "Date: $(date)" >> rotation-log.txt
echo "Current sealed secret:" >> rotation-log.txt
kubectl get secret postgres-sealed -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d >> rotation-log.txt
echo "" >> rotation-log.txt
```

### 2. Backup Working Configuration
```bash
# Save current working deployment as backup
cp manifests/prod/express-deployment.yaml express-deployment-backup.yaml
cp manifests/prod/postgres-deployment.yaml postgres-deployment-backup.yaml
cp manifests/prod/postgres-sealed.yaml postgres-sealed-backup.yaml
```

## Rotation Strategy: Dual User Approach

The safest way to rotate database credentials is to temporarily have TWO sets of credentials:
1. **Old user** (`app_user`) - current production credentials
2. **New user** (`app_user_new`) - new credentials for transition
3. **Gradual switch** - update components one by one
4. **Clean up** - remove old credentials when everything works

## Step-by-Step Rotation Process

### Step 1: Generate New Credentials
```bash
# Generate new secure password
NEW_PASSWORD=$(openssl rand -base64 16)
NEW_ROOT_PASSWORD=$(openssl rand -base64 16)

echo "New user password: $NEW_PASSWORD"
echo "New root password: $NEW_ROOT_PASSWORD"

# Save passwords securely
echo "NEW_PASSWORD=$NEW_PASSWORD" > new-password.txt
echo "NEW_ROOT_PASSWORD=$NEW_ROOT_PASSWORD" >> new-password.txt
echo "Created: $(date)" >> new-password.txt

# Check for URL encoding issues
echo "Checking for special characters that need encoding..."
echo "$NEW_PASSWORD" | grep -E '[/\+\=]' && echo "⚠️  Password contains special chars - will URL encode" || echo "✅ Password safe for URLs"
```

### Step 2: Create New Database User
```bash
# Create new user in PostgreSQL with same privileges as current user
kubectl exec -it deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "CREATE USER app_user_new WITH PASSWORD '$NEW_PASSWORD';"

# Grant same permissions as original user
kubectl exec -it deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "GRANT ALL PRIVILEGES ON DATABASE discbaboons_db TO app_user_new;"

kubectl exec -it deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user_new;"

kubectl exec -it deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "ALTER USER app_user_new SUPERUSER;"
```

### Step 3: Test New Credentials
```bash
# Test that new user can connect and read data
kubectl exec -it deployment/postgres-deployment -- psql -U app_user_new -d discbaboons_db -c "SELECT 'NEW USER WORKS', current_user;"

kubectl exec -it deployment/postgres-deployment -- psql -U app_user_new -d discbaboons_db -c "SELECT COUNT(*) as user_count FROM users;"
```

### Step 4: Create New Sealed Secret
```bash
# URL-encode password if needed
ENCODED_NEW_PASSWORD=$(echo "$NEW_PASSWORD" | sed 's|/|%2F|g' | sed 's|+|%2B|g' | sed 's|=|%3D|g')
NEW_DATABASE_URL="postgresql://app_user_new:${ENCODED_NEW_PASSWORD}@postgres-service:5432/discbaboons_db"

# Create new sealed secret
kubectl create secret generic postgres-sealed-v2 \
  --from-literal=POSTGRES_PASSWORD="$NEW_PASSWORD" \
  --from-literal=POSTGRES_ROOT_PASSWORD="$NEW_ROOT_PASSWORD" \
  --from-literal=DATABASE_URL="$NEW_DATABASE_URL" \
  --dry-run=client -o yaml > postgres-v2.yaml

# Seal the secret
kubeseal -f postgres-v2.yaml -w postgres-sealed-v2.yaml

# Apply new secret to cluster
kubectl apply -f postgres-sealed-v2.yaml

# Verify both secrets exist
kubectl get secrets | grep postgres
```

### Step 5: Update All Components to Use New User

**5a. Update PostgreSQL Deployment:**
```bash
# Update manifests/prod/postgres-deployment.yaml
# Change POSTGRES_USER from "app_user" to "app_user_new"
# Change secret reference from "postgres-sealed" to "postgres-sealed-v2"
# Update health check username from "app_user" to "app_user_new"

sed -i '' 's/postgres-sealed"/postgres-sealed-v2"/g' manifests/prod/postgres-deployment.yaml
sed -i '' 's/app_user/app_user_new/g' manifests/prod/postgres-deployment.yaml

kubectl apply -f manifests/prod/postgres-deployment.yaml
```

**5b. Update Flyway Configuration:**
```bash
# Update manifests/flyway-configmap.yaml
# Change FLYWAY_USER from "app_user" to "app_user_new"

sed -i '' 's/app_user/app_user_new/g' manifests/flyway-configmap.yaml
kubectl apply -f manifests/flyway-configmap.yaml
```

**5c. Update Express Deployment:**
```bash
# Update manifests/prod/express-deployment.yaml
# Change secret reference from "postgres-sealed" to "postgres-sealed-v2"
# Update init container username from "app_user" to "app_user_new"

sed -i '' 's/postgres-sealed"/postgres-sealed-v2"/g' manifests/prod/express-deployment.yaml
sed -i '' 's/app_user/app_user_new/g' manifests/prod/express-deployment.yaml

kubectl apply -f manifests/prod/express-deployment.yaml
```

### Step 6: Verify Rotation Success
```bash
# Watch pods restart with new credentials
kubectl get pods -l app=express -w

# Once pods are running, test application
kubectl port-forward service/express-service 8080:3000 &
curl http://localhost:8080/api/users
curl http://localhost:8080/health
pkill -f "port-forward"

# Test production endpoint
curl https://discbaboons.spirojohn.com/api/users
curl https://discbaboons.spirojohn.com/health
```

### Step 7: Clean Up Old Credentials
```bash
# Remove old database user (requires superuser privileges)
kubectl exec -it deployment/postgres-deployment -- psql -U app_user_new -d discbaboons_db -c "ALTER DATABASE discbaboons_db OWNER TO app_user_new;"

kubectl exec -it deployment/postgres-deployment -- psql -U app_user_new -d discbaboons_db -c "REASSIGN OWNED BY app_user TO app_user_new;"

# Note: If "DROP USER app_user" fails due to system dependencies, that's normal in production
# The old user can remain but is harmless since the password is no longer in use

# Delete old sealed secret
kubectl delete sealedsecret postgres-sealed
kubectl delete secret postgres-sealed

# Verify only new secret exists
kubectl get secrets | grep postgres
```

### Step 8: Rename Back to Standard Names (Optional)
```bash
# For cleaner naming, rename everything back to standard names
cp postgres-sealed-v2.yaml postgres-sealed.yaml

# Update all manifests to use standard names
sed -i '' 's/postgres-sealed-v2/postgres-sealed/g' manifests/prod/express-deployment.yaml
sed -i '' 's/app_user_new/app_user/g' manifests/prod/postgres-deployment.yaml
sed -i '' 's/app_user_new/app_user/g' manifests/prod/express-deployment.yaml
sed -i '' 's/app_user_new/app_user/g' manifests/flyway-configmap.yaml

# Apply renamed configurations
kubectl apply -f postgres-sealed.yaml
kubectl apply -f manifests/prod/

# Clean up v2 resources
kubectl delete sealedsecret postgres-sealed-v2
kubectl delete secret postgres-sealed-v2

# Clean up temporary files
rm postgres-v2.yaml postgres-sealed-v2.yaml new-password.txt
rm express-deployment-backup.yaml postgres-deployment-backup.yaml postgres-sealed-backup.yaml
```

## Rollback Procedure (If Something Goes Wrong)

### Quick Rollback
```bash
# If rotation fails, immediately restore working configuration
cp express-deployment-backup.yaml manifests/prod/express-deployment.yaml
cp postgres-deployment-backup.yaml manifests/prod/postgres-deployment.yaml

kubectl apply -f manifests/prod/express-deployment.yaml
kubectl apply -f manifests/prod/postgres-deployment.yaml

# Test that rollback worked
kubectl get pods -w
```

### Emergency Access
```bash
# If you need to reset the new user password
kubectl exec -it deployment/postgres-deployment -- psql -U app_user_new -d discbaboons_db -c "ALTER USER app_user_new PASSWORD 'emergency_password';"
```

## Troubleshooting Common Issues

### Issue: Init Container CrashLoopBackOff
**Cause**: Flyway still configured for old username
**Solution**: Update `manifests/flyway-configmap.yaml` FLYWAY_USER to match new username

### Issue: Application 500 Errors
**Cause**: DATABASE_URL contains unencoded special characters
**Solution**: URL-encode password portion of DATABASE_URL

### Issue: "Cannot drop role app_user"
**Cause**: Old user owns database objects
**Solution**: This is normal - old user can remain since password is rotated out

### Issue: Pods Stuck in Pending
**Cause**: New secret not applied or contains errors
**Solution**: Check `kubectl get secrets` and `kubectl describe pod`

## Security Best Practices

### 1. Never Log Passwords
```bash
# ❌ Wrong - logs password
echo "New password: $NEW_PASSWORD"

# ✅ Correct - confirms without logging
echo "New password generated (length: ${#NEW_PASSWORD})"
```

### 2. Clean Up Temporary Files
```bash
# Always clean up files containing passwords
rm new-password.txt
rm postgres-v2.yaml  # Contains unencrypted secret
```

### 3. Document in Secure Location
```bash
# Log rotation completion without sensitive data
echo "=== ROTATION COMPLETED ===" >> rotation-log.txt
echo "Date: $(date)" >> rotation-log.txt
echo "New password length: ${#NEW_PASSWORD}" >> rotation-log.txt
echo "Components updated: postgres, express, flyway" >> rotation-log.txt
```

## Production Rotation Schedule

**Recommended rotation frequency:**
- **Database passwords**: Every 90 days
- **Service account credentials**: Every 180 days
- **API keys**: As required by third-party providers
- **SSL certificates**: Automated with cert-manager

**Rotation tracking:**
```bash
# Add to your calendar/ticketing system
echo "Next rotation due: $(date -d '+90 days')" >> rotation-log.txt
```

## Emergency Rotation (Compromised Credentials)

If credentials are suspected to be compromised, rotate immediately:

```bash
# Skip the gradual approach - generate and apply new credentials quickly
NEW_PASSWORD=$(openssl rand -base64 20)
kubectl exec -it deployment/postgres-deployment -- psql -U app_user -d discbaboons_db -c "ALTER USER app_user PASSWORD '$NEW_PASSWORD';"

# Create new sealed secret immediately
# ... (follow steps 4-6 above but expedited)
```

This rotation guide ensures zero-downtime credential updates while maintaining production security standards for your Kubernetes deployment.
