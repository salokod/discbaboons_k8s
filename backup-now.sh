#!/bin/bash
echo "🗄️  Creating backup of discbaboons database..."

# Check if cluster is running
if ! kubectl get pods &>/dev/null; then
    echo "❌ Kubernetes cluster not reachable"
    exit 1
fi

# Create backup with timestamp
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p ~/discbaboons-backups

kubectl exec deployment/postgres-deployment -- pg_dump -U app_user_new discbaboons_db > ~/discbaboons-backups/backup-$BACKUP_DATE.sql

echo "✅ Backup created: ~/discbaboons-backups/backup-$BACKUP_DATE.sql"
echo "📊 Size: $(du -h ~/discbaboons-backups/backup-$BACKUP_DATE.sql | cut -f1)"
echo "📅 Date: $(date)"
