#!/bin/bash

# Script to upload CSV data files to GitHub for remote hosting
# This creates a separate repository for data files that can be accessed via GitHub Raw URLs

set -e

# Configuration
DATA_REPO_NAME="activation-data"
DATA_REPO_OWNER="alawiscious"  # Change to "KlickInc" when ready
GITHUB_USERNAME="alawiscious"  # Your GitHub username
GITHUB_TOKEN=""  # You'll need to set this

echo "🚀 Uploading data files to GitHub for remote hosting..."

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

# Create the data repository if it doesn't exist
echo "📁 Creating data repository..."
if ! gh repo view "$DATA_REPO_OWNER/$DATA_REPO_NAME" &> /dev/null; then
    gh repo create "$DATA_REPO_OWNER/$DATA_REPO_NAME" --public --description "Data files for Activation Contact Visualizer"
    echo "✅ Created repository: $DATA_REPO_OWNER/$DATA_REPO_NAME"
else
    echo "✅ Repository already exists: $DATA_REPO_OWNER/$DATA_REPO_NAME"
fi

# Clone the repository
TEMP_DIR=$(mktemp -d)
echo "📥 Cloning repository to temporary directory..."
git clone "https://github.com/$DATA_REPO_OWNER/$DATA_REPO_NAME.git" "$TEMP_DIR"

# Copy CSV files from public folder
echo "📋 Copying CSV files..."
cp "public/master contacts from alf.csv" "$TEMP_DIR/master-contacts.csv"
cp "public/Master Import file.csv" "$TEMP_DIR/master-revenue.csv"
cp "public/master-company-file.csv" "$TEMP_DIR/master-company-file.csv"

# Create a README for the data repository
cat > "$TEMP_DIR/README.md" << EOF
# Activation Data Files

This repository contains the data files for the Activation Contact Visualizer application.

## Files

- \`master-contacts.csv\` - Contact data
- \`master-revenue.csv\` - Revenue data  
- \`master-company-file.csv\` - Company data

## Usage

These files are accessed via GitHub Raw URLs:

- Contacts: https://raw.githubusercontent.com/$DATA_REPO_OWNER/$DATA_REPO_NAME/main/master-contacts.csv
- Revenue: https://raw.githubusercontent.com/$DATA_REPO_OWNER/$DATA_REPO_NAME/main/master-revenue.csv
- Companies: https://raw.githubusercontent.com/$DATA_REPO_OWNER/$DATA_REPO_NAME/main/master-company-file.csv

## Updating Data

To update the data files:

1. Replace the CSV files in this repository
2. Commit and push the changes
3. The application will automatically use the updated data

## Security

These files contain sensitive business data and should be kept private in production.
EOF

# Commit and push changes
cd "$TEMP_DIR"
git add .
git commit -m "Add initial data files for Activation app" || echo "No changes to commit"
git push origin main

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo "✅ Data files uploaded successfully!"
echo ""
echo "📊 Your data is now available at:"
echo "   https://raw.githubusercontent.com/$DATA_REPO_OWNER/$DATA_REPO_NAME/main/master-contacts.csv"
echo "   https://raw.githubusercontent.com/$DATA_REPO_OWNER/$DATA_REPO_NAME/main/master-revenue.csv"
echo "   https://raw.githubusercontent.com/$DATA_REPO_OWNER/$DATA_REPO_NAME/main/master-company-file.csv"
echo ""
echo "🔧 Update your environment variables:"
echo "   VITE_DATA_SOURCE=github"
echo "   VITE_DEFAULT_MASTER_CSV=https://raw.githubusercontent.com/$DATA_REPO_OWNER/$DATA_REPO_NAME/main/master-contacts.csv"
echo ""
echo "🔒 For production, consider:"
echo "   1. Making the repository private"
echo "   2. Using AWS S3 with proper access controls"
echo "   3. Implementing authentication for data access"
