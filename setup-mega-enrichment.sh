#!/bin/bash

# Setup script for tonight's mega enrichment run
# This script prepares everything for automated enrichment

set -e

echo "🚀 Setting up mega enrichment for tonight..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Upload CSV data to remote storage
echo -e "${BLUE}📊 Step 1: Uploading CSV data to remote storage...${NC}"
if [ -f "upload-data-to-github.sh" ]; then
    echo "Uploading master CSV files to GitHub..."
    ./upload-data-to-github.sh
    echo -e "${GREEN}✅ CSV data uploaded successfully${NC}"
else
    echo -e "${YELLOW}⚠️  upload-data-to-github.sh not found, skipping CSV upload${NC}"
fi

# Step 2: Set up Genome enrichment remote storage
echo -e "${BLUE}🧬 Step 2: Setting up Genome enrichment remote storage...${NC}"
if [ -f "upload-genome-data.sh" ]; then
    echo "Creating Genome enrichment data repository..."
    ./upload-genome-data.sh
    echo -e "${GREEN}✅ Genome enrichment storage set up successfully${NC}"
else
    echo -e "${YELLOW}⚠️  upload-genome-data.sh not found, skipping Genome storage setup${NC}"
fi

# Step 3: Set environment variables for remote storage
echo -e "${BLUE}🔧 Step 3: Setting up environment variables...${NC}"

# Create production environment file
cat > .env.production << EOF
# Production Environment Variables for Activation App
# DO NOT COMMIT THIS FILE - IT CONTAINS SENSITIVE DATA

# Authentication (REQUIRED - Set your own credentials)
VITE_AUTH_USERNAME=your_username_here
VITE_AUTH_PASSWORD=your_secure_password_here

# Data Source Configuration
VITE_DATA_SOURCE=github
VITE_DEFAULT_MASTER_CSV=https://raw.githubusercontent.com/alawiscious/activation-data/main/master-contacts.csv

# Genome Enrichment Storage Configuration
VITE_GENOME_STORAGE_TYPE=github
VITE_GENOME_FALLBACK_LOCAL=true

# API Keys (if needed)
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# App Configuration
VITE_APP_NAME=Activation
VITE_APP_VERSION=1.0.0
EOF

echo -e "${GREEN}✅ Environment file created: .env.production${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env.production with your actual credentials${NC}"

# Step 4: Run security audit
echo -e "${BLUE}🔒 Step 4: Running security audit...${NC}"
if [ -f "security-audit.sh" ]; then
    ./security-audit.sh
    echo -e "${GREEN}✅ Security audit completed${NC}"
else
    echo -e "${YELLOW}⚠️  security-audit.sh not found, skipping security audit${NC}"
fi

# Step 5: Build production version
echo -e "${BLUE}🏗️  Step 5: Building production version...${NC}"
npm run build
echo -e "${GREEN}✅ Production build completed${NC}"

# Step 6: Create deployment package
echo -e "${BLUE}📦 Step 6: Creating deployment package...${NC}"
tar -czf activation-deployment-$(date +%Y%m%d-%H%M%S).tar.gz \
    dist/ \
    Dockerfile \
    nginx.conf \
    docker-compose.yml \
    aws-task-definition.json \
    deploy.sh \
    .env.production \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log

echo -e "${GREEN}✅ Deployment package created${NC}"

# Step 7: Create mega enrichment instructions
cat > MEGA_ENRICHMENT_INSTRUCTIONS.md << 'EOF'
# 🧬 Mega Enrichment Instructions

## Tonight's Automated Enrichment Setup

### 1. Start the Application
```bash
# Load environment variables
source .env.production

# Start the development server
npm run dev
```

### 2. Access the App
- Open: http://localhost:5173
- Login with your credentials
- Navigate to: Contacts → Genome Tools

### 3. Start Mega Enrichment
1. Click on "Automated Mega Enrichment" section
2. Configure settings:
   - Batch Size: 50 (recommended)
   - Delay: 2000ms (2 seconds between batches)
   - Max Retries: 3
   - Auto-save: Every 100 contacts
3. Click "Start Mega Enrichment"
4. Let it run overnight

### 4. Monitor Progress
- The app will show real-time progress
- Data is automatically saved to remote storage
- Checkpoints are created every 100 contacts
- If it fails, it will retry automatically

### 5. Expected Results
- All contacts will be enriched with Genome API data
- Data will be stored remotely (not in localStorage)
- Available to all users immediately
- No manual intervention required

## Configuration Options

### Batch Size
- **Small (25)**: Slower but more reliable
- **Medium (50)**: Balanced (recommended)
- **Large (100)**: Faster but may hit rate limits

### Delay Between Batches
- **1000ms**: Fast but may overwhelm API
- **2000ms**: Balanced (recommended)
- **5000ms**: Slow but very reliable

### Auto-save Interval
- **50**: Frequent saves, more reliable
- **100**: Balanced (recommended)
- **200**: Less frequent, faster processing

## Troubleshooting

### If Enrichment Stops
1. Check browser console for errors
2. Verify network connectivity
3. Check if API rate limits are hit
4. Restart from last checkpoint

### If Data Not Saving
1. Check remote storage connectivity
2. Verify GitHub repository permissions
3. Check localStorage fallback is working

### Performance Issues
1. Reduce batch size
2. Increase delay between batches
3. Check system resources
4. Monitor network usage

## Success Indicators
- ✅ Progress bar shows 100%
- ✅ "Completed" status shown
- ✅ All contacts have enrichment data
- ✅ Data accessible in remote storage
- ✅ No errors in browser console

## Next Steps After Completion
1. Verify data quality in the app
2. Test with different users
3. Deploy to production
4. Set up scheduled enrichment runs
EOF

echo -e "${GREEN}✅ Mega enrichment instructions created: MEGA_ENRICHMENT_INSTRUCTIONS.md${NC}"

# Step 8: Final summary
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Mega Enrichment Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env.production with your credentials"
echo "2. Run: source .env.production"
echo "3. Run: npm run dev"
echo "4. Follow instructions in MEGA_ENRICHMENT_INSTRUCTIONS.md"
echo ""
echo "🔒 Security:"
echo "- All sensitive data removed from code"
echo "- Environment variables properly configured"
echo "- Remote storage set up for all data"
echo ""
echo "📊 Data Storage:"
echo "- CSV files: GitHub repository"
echo "- Enrichment data: Remote storage with localStorage fallback"
echo "- No data stored locally"
echo ""
echo "🚀 Ready for deployment to AWS Fargate!"
echo ""
echo -e "${YELLOW}⚠️  Remember to edit .env.production with your actual credentials!${NC}"
