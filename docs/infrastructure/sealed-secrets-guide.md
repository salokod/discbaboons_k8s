# Sealed Secrets Guide 🔐

## Overview
Sealed Secrets provide a GitOps-friendly way to encrypt Kubernetes secrets that can be safely stored in version control. Unlike regular Kubernetes secrets (which are only base64 encoded), Sealed Secrets are encrypted and can only be decrypted by the Sealed Secrets controller running in your cluster.

## Quick Reference

### Generate a New Sealed Secret
```bash
# From an existing secret YAML file
kubeseal -f your-secret.yaml -w your-sealed-secret.yaml

# From kubectl create (one-liner)
kubectl create secret generic myapp-secret \
  --from-literal=username=myuser \
  --from-literal=password='complex@pass!' \
  --dry-run=client -o yaml | \
  kubeseal -w myapp-sealed.yaml
```

### Apply Sealed Secret to Cluster
```bash
kubectl apply -f your-sealed-secret.yaml
```

### Verify Decrypted Secret
```bash
# Check that the regular secret was created
kubectl get secret your-secret-name -o yaml

# Decode a specific key to verify content
kubectl get secret your-secret-name -o jsonpath="{.data.password}" | base64 -d
```

## Production Implementation Guide

### 1. Install Sealed Secrets Controller
```bash
# Install controller in cluster
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Verify controller is running
kubectl get pods -n kube-system | grep sealed-secrets

# Install kubeseal CLI tool (macOS)
brew install kubeseal
```

### 2. Create Your First Sealed Secret

**Step 1: Create a regular secret (temporarily)**
```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=discbaboons \
  --from-literal=POSTGRES_PASSWORD='your-password' \
  --from-literal=DATABASE_URL='postgresql://user:pass@host/db' \
  --dry-run=client -o yaml > temp-secret.yaml
```

**Step 2: Convert to Sealed Secret**
```bash
kubeseal -f temp-secret.yaml -w postgres-sealed.yaml
rm temp-secret.yaml  # Remove unencrypted version
```

**Step 3: Apply to cluster**
```bash
kubectl apply -f postgres-sealed.yaml
```

### 3. Database URL Encoding (Critical!)

When working with database URLs containing special characters, **always URL-encode** the password component:

**❌ Wrong (will cause application errors):**
```
DATABASE_URL=postgresql://user:pass+word@host/db
```

**✅ Correct (URL-encoded):**
```
DATABASE_URL=postgresql://user:pass%2Bword@host/db
```

**Common character encodings:**
- `+` → `%2B`
- `/` → `%2F` 
- `=` → `%3D`
- `@` → `%40`
- `?` → `%3F`
- `&` → `%26`

**Encoding script for complex passwords:**
```bash
# Quick URL encoding in terminal
python3 -c "import urllib.parse; print(urllib.parse.quote('your+complex=password/'))"
```

## Troubleshooting Guide

### Issue: Application 500 Errors After Sealed Secret Deployment

**Symptoms:**
- Application pods running but returning 500 errors
- Database connection failures in logs
- Error: "Connection terminated unexpectedly"

**Diagnosis:**
```bash
# Check if secret was properly decrypted
kubectl get secret postgres-secret -o yaml

# Check application logs for connection errors
kubectl logs -l app=express --tail=50

# Test database URL format manually
kubectl exec deployment/express-deployment -- node -e "
const url = process.env.DATABASE_URL;
console.log('Raw URL:', url);
try {
  const parsed = new URL(url);
  console.log('Parsed successfully');
} catch (e) {
  console.log('URL parsing failed:', e.message);
}
"
```

**Solution:**
1. **Check URL encoding** of password in database URL
2. **Verify special characters** are properly encoded
3. **Recreate sealed secret** with correct encoding:

```bash
# Get current password and encode it properly
CURRENT_PASS="your+complex=password"
ENCODED_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${CURRENT_PASS}'))")

# Create new secret with properly encoded URL
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=discbaboons \
  --from-literal=POSTGRES_PASSWORD="${CURRENT_PASS}" \
  --from-literal=DATABASE_URL="postgresql://discbaboons:${ENCODED_PASS}@postgres-service:5432/discbaboons_db" \
  --dry-run=client -o yaml | \
  kubeseal -w manifests/prod/postgres-sealed-v3.yaml

# Apply new sealed secret
kubectl apply -f manifests/prod/postgres-sealed-v3.yaml

# Restart application to pick up new secret
kubectl rollout restart deployment/express-deployment
```

### Issue: Sealed Secret Won't Decrypt

**Symptoms:**
- SealedSecret resource exists but no Secret created
- Controller logs show decryption errors

**Diagnosis:**
```bash
# Check sealed secret controller logs
kubectl logs -n kube-system -l name=sealed-secrets-controller

# Check sealed secret status
kubectl describe sealedsecret postgres-secret
```

**Common causes:**
1. **Wrong cluster**: Sealed secret encrypted for different cluster
2. **Missing controller**: Sealed secrets controller not installed
3. **Corrupted encryption**: Sealed secret file corrupted

**Solution:**
```bash
# Re-encrypt for current cluster
kubectl delete sealedsecret postgres-secret
kubeseal -f temp-secret.yaml -w postgres-sealed-new.yaml
kubectl apply -f postgres-sealed-new.yaml
```

### Issue: Secret Not Updating After Changes  

**Symptoms:**
- Updated sealed secret applied but application still uses old values
- Secret shows old data despite new sealed secret

**Solution:**
```bash
# Delete existing secret first
kubectl delete secret postgres-secret

# Then apply updated sealed secret
kubectl apply -f manifests/prod/postgres-sealed-v2.yaml

# Force application restart
kubectl rollout restart deployment/express-deployment
```

## Security Best Practices

### 1. Never Commit Unencrypted Secrets
```bash
# Add to .gitignore
echo "*.secret.yaml" >> .gitignore
echo "temp-secret.yaml" >> .gitignore
echo "**/secrets/" >> .gitignore

# Clean up any accidentally committed secrets
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch *.secret.yaml' HEAD
```

### 2. Backup Your Private Key
```bash
# Extract the private key (store securely!)
kubectl get secret -n kube-system sealed-secrets-key -o yaml > sealed-secrets-private-key-backup.yaml

# Store in secure location (not in git!)
# Examples: 1Password, Vault, encrypted USB drive
```

### 3. Rotate Sealed Secrets Regularly
```bash
# Create new version of sealed secret quarterly
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD="new-rotated-password" \
  --dry-run=client -o yaml | \
  kubeseal -w postgres-sealed-$(date +%Y%m%d).yaml
```

### 4. Environment-Specific Encryption
```bash
# Different sealed secrets for different environments
kubeseal --controller-name=sealed-secrets-dev -f secret.yaml -w dev-sealed.yaml
kubeseal --controller-name=sealed-secrets-prod -f secret.yaml -w prod-sealed.yaml
```

## GitOps Workflow

### 1. Development Process
```bash
# 1. Create secret locally (never commit)
kubectl create secret generic myapp-secret \
  --from-literal=API_KEY=dev123 \
  --dry-run=client -o yaml > temp-secret.yaml

# 2. Encrypt for your cluster  
kubeseal -f temp-secret.yaml -w manifests/dev/myapp-sealed.yaml

# 3. Clean up temporary file
rm temp-secret.yaml

# 4. Commit sealed secret (safe to commit)
git add manifests/dev/myapp-sealed.yaml
git commit -m "feat: add myapp sealed secret for dev"
```

### 2. Deployment Process
```bash
# Sealed secrets automatically become regular secrets
kubectl apply -f manifests/dev/myapp-sealed.yaml

# Verify secret was created
kubectl get secret myapp-secret
```

## Real-World Example: PostgreSQL with Complex Password

**Scenario**: Database password contains special characters: `P@ssw0rd+2024!`

**Step 1: URL-encode the password**
```bash
# Encode special characters
python3 -c "import urllib.parse; print(urllib.parse.quote('P@ssw0rd+2024!'))"
# Output: P%40ssw0rd%2B2024%21
```

**Step 2: Create sealed secret**
```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=discbaboons \
  --from-literal=POSTGRES_PASSWORD='P@ssw0rd+2024!' \
  --from-literal=DATABASE_URL='postgresql://discbaboons:P%40ssw0rd%2B2024%21@postgres-service:5432/discbaboons_db' \
  --dry-run=client -o yaml | \
  kubeseal -w manifests/prod/postgres-sealed.yaml
```

**Step 3: Apply and verify**
```bash
kubectl apply -f manifests/prod/postgres-sealed.yaml

# Test database connection
kubectl exec deployment/express-deployment -- node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  console.log('✅ Database connection successful');
  client.end();
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
});
"
```

This ensures your complex passwords work correctly in production while maintaining GitOps security practices.
