#!/bin/bash

# Script to upload Genome enrichment data to remote storage
# This moves enrichment data from localStorage to remote hosting

set -e

# Configuration
GENOME_DATA_REPO_NAME="activation-genome-data"
GENOME_DATA_REPO_OWNER="alawiscious"  # Change to "KlickInc" when ready
GITHUB_USERNAME="alawiscious"

echo "🧬 Uploading Genome enrichment data to remote storage..."

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh  # macOS"
    echo "   or visit: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 Please authenticate with GitHub CLI:"
    gh auth login
fi

# Create the genome data repository if it doesn't exist
echo "📁 Creating genome data repository..."
if ! gh repo view "$GENOME_DATA_REPO_OWNER/$GENOME_DATA_REPO_NAME" &> /dev/null; then
    gh repo create "$GENOME_DATA_REPO_OWNER/$GENOME_DATA_REPO_NAME" --public --description "Genome enrichment data for Activation Contact Visualizer"
    echo "✅ Created repository: $GENOME_DATA_REPO_OWNER/$GENOME_DATA_REPO_NAME"
else
    echo "✅ Repository already exists: $GENOME_DATA_REPO_OWNER/$GENOME_DATA_REPO_NAME"
fi

# Clone the repository
TEMP_DIR=$(mktemp -d)
echo "📥 Cloning repository to temporary directory..."
git clone "https://github.com/$GENOME_DATA_REPO_OWNER/$GENOME_DATA_REPO_NAME.git" "$TEMP_DIR"

# Create enrichment directory structure
mkdir -p "$TEMP_DIR/enrichment"

# Create sample enrichment data structure
cat > "$TEMP_DIR/enrichment/enrichment-data.json" << EOF
{
  "enrichmentData": {},
  "stats": {
    "totalContacts": 0,
    "enrichedContacts": 0,
    "lastBatchUpdate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "nextScheduledUpdate": "$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%SZ)"
  },
  "metadata": {
    "version": "1.0.0",
    "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "description": "Genome enrichment data for Activation Contact Visualizer"
  }
}
EOF

# Create a README for the genome data repository
cat > "$TEMP_DIR/README.md" << EOF
# Activation Genome Data

This repository contains Genome enrichment data for the Activation Contact Visualizer application.

## Structure

- \`enrichment/enrichment-data.json\` - Main enrichment data file
- \`enrichment/backups/\` - Backup files (created automatically)

## Data Format

The enrichment data follows this structure:

\`\`\`json
{
  "enrichmentData": {
    "contact-id-1": {
      "contactId": "contact-id-1",
      "emailCount": 15,
      "meetingCount": 3,
      "totalActivity": 18,
      "latestMeetingDate": "2024-01-15",
      "lastEmailDate": "2024-01-20",
      "lastKlickster": "Yes",
      "linkedinLastPulled": "2024-01-20",
      "genomeCrmcontactId": "gcrm-123",
      "linkedinId": "li-456",
      "leadId": "l-789",
      "lastUpdated": "2024-01-20T10:30:00Z",
      "source": "genome_api"
    }
  },
  "stats": {
    "totalContacts": 100,
    "enrichedContacts": 75,
    "lastBatchUpdate": "2024-01-20T10:30:00Z",
    "nextScheduledUpdate": "2024-01-21T10:30:00Z"
  }
}
\`\`\`

## Usage

The application will automatically:
1. Load enrichment data from this repository
2. Update data when Genome API calls are made
3. Sync changes back to this repository

## Security

This data contains sensitive contact information and should be kept private in production.

## Backup

The system automatically creates backups in the \`enrichment/backups/\` directory.
EOF

# Create backup directory
mkdir -p "$TEMP_DIR/enrichment/backups"

# Create a backup script
cat > "$TEMP_DIR/backup-enrichment.sh" << 'EOF'
#!/bin/bash
# Backup script for enrichment data

BACKUP_DIR="enrichment/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/enrichment-data-$TIMESTAMP.json"

# Create backup
cp enrichment/enrichment-data.json "$BACKUP_FILE"

# Keep only last 10 backups
ls -t $BACKUP_DIR/enrichment-data-*.json | tail -n +11 | xargs -r rm

echo "Backup created: $BACKUP_FILE"
EOF

chmod +x "$TEMP_DIR/backup-enrichment.sh"

# Commit and push changes
cd "$TEMP_DIR"
git add .
git commit -m "Add initial Genome enrichment data structure" || echo "No changes to commit"
git push origin main

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo "✅ Genome enrichment data structure uploaded successfully!"
echo ""
echo "🧬 Your enrichment data will be available at:"
echo "   https://raw.githubusercontent.com/$GENOME_DATA_REPO_OWNER/$GENOME_DATA_REPO_NAME/main/enrichment/enrichment-data.json"
echo ""
echo "🔧 Update your environment variables:"
echo "   VITE_GENOME_STORAGE_TYPE=github"
echo "   VITE_GENOME_FALLBACK_LOCAL=true"
echo ""
echo "📊 To migrate existing localStorage data:"
echo "   1. Export data from the app (Genome Tools page)"
echo "   2. Update the enrichment-data.json file in the repository"
echo "   3. Commit and push the changes"
echo ""
echo "🔒 For production, consider:"
echo "   1. Making the repository private"
echo "   2. Using AWS S3 with proper access controls"
echo "   3. Implementing a proper API backend"
