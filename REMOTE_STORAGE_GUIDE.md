# Remote Storage Guide for Activation App

This guide explains how to move your data from local storage to remote hosting for production deployment.

## 📊 Data Types & Storage Solutions

### 1. Master CSV Files (Contact/Revenue Data)
**Current Location**: `public/` folder (local files)
**Problem**: Files are bundled with the app and not accessible in production
**Solution**: Remote hosting via GitHub, S3, or Google Drive

### 2. Genome Enrichment Data
**Current Location**: Browser localStorage
**Problem**: Data is lost when browser cache is cleared, not shared between users
**Solution**: Remote storage with fallback to localStorage

## 🚀 Quick Setup

### Step 1: Upload Master CSV Files
```bash
# Option A: GitHub (Free, Easy)
./upload-data-to-github.sh

# Option B: AWS S3 (Production Ready)
./upload-data-to-s3.sh
```

### Step 2: Upload Genome Enrichment Data
```bash
# Create remote storage structure
./upload-genome-data.sh
```

### Step 3: Update Environment Variables
```bash
# For CSV data
export VITE_DATA_SOURCE=github
export VITE_DEFAULT_MASTER_CSV=https://raw.githubusercontent.com/alawiscious/activation-data/main/master-contacts.csv

# For Genome enrichment data
export VITE_GENOME_STORAGE_TYPE=github
export VITE_GENOME_FALLBACK_LOCAL=true
```

## 📁 File Structure After Migration

### Master CSV Files
```
GitHub Repository: alawiscious/activation-data
├── master-contacts.csv
├── master-revenue.csv
└── master-company-file.csv
```

### Genome Enrichment Data
```
GitHub Repository: alawiscious/activation-genome-data
├── enrichment/
│   ├── enrichment-data.json
│   └── backups/
│       ├── enrichment-data-20240120_103000.json
│       └── enrichment-data-20240119_103000.json
└── backup-enrichment.sh
```

## 🔧 Configuration Options

### Data Source Types
- **`github`** - Free hosting via GitHub Raw URLs
- **`s3`** - AWS S3 with CDN capabilities
- **`googleDrive`** - Google Drive with file sharing
- **`cdn`** - Custom CDN for optimal performance

### Genome Storage Types
- **`github`** - GitHub repository for enrichment data
- **`s3`** - AWS S3 for secure storage
- **`api`** - Custom API endpoint
- **`local`** - localStorage (fallback only)

## 🌐 URLs After Migration

### Master CSV Files
- **GitHub**: `https://raw.githubusercontent.com/alawiscious/activation-data/main/master-contacts.csv`
- **S3**: `https://activation-data.s3.amazonaws.com/master-contacts.csv`

### Genome Enrichment Data
- **GitHub**: `https://raw.githubusercontent.com/alawiscious/activation-genome-data/main/enrichment/enrichment-data.json`
- **API**: `https://api.activation.klickcloud.net/genome/enrichment`

## 🔒 Security Considerations

### Development (Current)
- ✅ GitHub repositories are public (easy access)
- ⚠️ Data is visible to anyone with the URL
- ✅ Free and easy to set up

### Production (Recommended)
- 🔒 Make repositories private
- 🔒 Use AWS S3 with proper IAM policies
- 🔒 Implement API authentication
- 🔒 Use signed URLs for sensitive data

## 📊 Migration Process

### 1. Export Current Data
```bash
# Export Genome enrichment data from the app
# (Use the export feature in Genome Tools page)
```

### 2. Upload to Remote Storage
```bash
# Upload CSV files
./upload-data-to-github.sh

# Upload Genome data structure
./upload-genome-data.sh
```

### 3. Update Application
```bash
# Set environment variables
export VITE_DATA_SOURCE=github
export VITE_GENOME_STORAGE_TYPE=github

# Rebuild and deploy
npm run build
```

### 4. Test Migration
```bash
# Test data loading
curl https://raw.githubusercontent.com/alawiscious/activation-data/main/master-contacts.csv

# Test enrichment data
curl https://raw.githubusercontent.com/alawiscious/activation-genome-data/main/enrichment/enrichment-data.json
```

## 🔄 Data Updates

### Master CSV Files
1. Update files in the repository
2. Commit and push changes
3. App automatically uses updated data

### Genome Enrichment Data
1. App automatically syncs new enrichment data
2. Backups are created automatically
3. Data persists across browser sessions

## 🚨 Troubleshooting

### Data Not Loading
1. Check URLs are accessible
2. Verify environment variables are set
3. Check browser console for errors
4. Ensure fallback to localStorage is enabled

### Genome Data Not Syncing
1. Check network connectivity
2. Verify GitHub repository permissions
3. Check localStorage fallback is working
4. Review browser console for API errors

### Performance Issues
1. Consider using S3 with CloudFront CDN
2. Implement data caching
3. Use compression for large files
4. Optimize data structure

## 📈 Monitoring

### Data Usage
- Monitor GitHub repository traffic
- Track S3 request metrics
- Monitor API endpoint usage

### Data Quality
- Regular backup verification
- Data integrity checks
- Enrichment data freshness monitoring

## 🎯 Next Steps

1. **Immediate**: Upload CSV files to GitHub
2. **Short-term**: Set up Genome data remote storage
3. **Medium-term**: Move to AWS S3 for production
4. **Long-term**: Implement proper API backend

## 📞 Support

For issues with remote storage:
1. Check the test pages: `test-data-hosting.html`
2. Review browser console for errors
3. Verify environment variables
4. Test URLs manually with curl
