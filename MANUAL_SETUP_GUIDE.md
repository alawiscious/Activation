# 🚀 Manual Setup Guide for Mega Enrichment

Since GitHub CLI is not installed, here's the manual setup process:

## 📋 Prerequisites

1. **Install GitHub CLI** (optional, for automated uploads):
   ```bash
   brew install gh  # macOS
   # or visit: https://cli.github.com/
   ```

2. **Or use manual GitHub upload** (recommended for now)

## 🔧 Step-by-Step Setup

### Step 1: Create GitHub Repositories

1. **Create data repository**:
   - Go to: https://github.com/new
   - Repository name: `activation-data`
   - Make it public
   - Initialize with README

2. **Create genome data repository**:
   - Go to: https://github.com/new
   - Repository name: `activation-genome-data`
   - Make it public
   - Initialize with README

### Step 2: Upload CSV Files

1. **Upload your CSV files** to `activation-data` repository:
   - `master contacts from alf.csv` → rename to `master-contacts.csv`
   - `Master Import file.csv` → rename to `master-revenue.csv`
   - `master-company-file.csv` → keep as is

2. **Create folder structure**:
   ```
   activation-data/
   ├── master-contacts.csv
   ├── master-revenue.csv
   └── master-company-file.csv
   ```

### Step 3: Set Up Genome Data Structure

1. **In `activation-genome-data` repository**, create:
   ```
   activation-genome-data/
   ├── enrichment/
   │   └── enrichment-data.json
   └── README.md
   ```

2. **Create `enrichment-data.json`**:
   ```json
   {
     "enrichmentData": {},
     "stats": {
       "totalContacts": 0,
       "enrichedContacts": 0,
       "lastBatchUpdate": "2024-01-20T10:30:00Z",
       "nextScheduledUpdate": "2024-01-21T10:30:00Z"
     },
     "metadata": {
       "version": "1.0.0",
       "created": "2024-01-20T10:30:00Z",
       "description": "Genome enrichment data for Activation Contact Visualizer"
     }
   }
   ```

### Step 4: Set Environment Variables

1. **Create `.env.production`**:
   ```bash
   # Authentication (REQUIRED - Set your own credentials)
   VITE_AUTH_USERNAME=your_username_here
   VITE_AUTH_PASSWORD=your_secure_password_here

   # Data Source Configuration
   VITE_DATA_SOURCE=github
   VITE_DEFAULT_MASTER_CSV=https://raw.githubusercontent.com/alawiscious/activation-data/main/master-contacts.csv

   # Genome Enrichment Storage Configuration
   VITE_GENOME_STORAGE_TYPE=github
   VITE_GENOME_FALLBACK_LOCAL=true
   ```

2. **Update the CSV URL** to match your repository:
   - Replace `alawiscious` with your GitHub username
   - Or use the KlickInc organization when ready

### Step 5: Test the Setup

1. **Load environment variables**:
   ```bash
   source .env.production
   ```

2. **Start the app**:
   ```bash
   npm run dev
   ```

3. **Test data loading**:
   - Open: http://localhost:5173
   - Login with your credentials
   - Check if data loads from remote URLs

### Step 6: Start Mega Enrichment

1. **Navigate to Contacts page**
2. **Find "Automated Mega Enrichment" section**
3. **Configure settings**:
   - Batch Size: 50
   - Delay: 2000ms
   - Max Retries: 3
   - Auto-save: Every 100 contacts
4. **Click "Start Mega Enrichment"**
5. **Let it run overnight**

## 🔒 Security Checklist

✅ **All hardcoded credentials removed**
✅ **Environment variables properly configured**
✅ **No sensitive data in source code**
✅ **Remote storage set up for all data**
✅ **GitHub repositories created**
✅ **CSV files uploaded to remote storage**

## 📊 Expected Results

After running mega enrichment:
- ✅ All contacts enriched with Genome API data
- ✅ Data stored remotely (not in localStorage)
- ✅ Available to all users immediately
- ✅ No manual intervention required
- ✅ Automatic checkpoints every 100 contacts
- ✅ Retry logic for failed batches

## 🚨 Troubleshooting

### Data Not Loading
1. Check GitHub repository URLs
2. Verify files are in correct locations
3. Check environment variables
4. Test URLs manually in browser

### Enrichment Not Starting
1. Check browser console for errors
2. Verify network connectivity
3. Check if Genome API is accessible
4. Ensure environment variables are set

### Performance Issues
1. Reduce batch size to 25
2. Increase delay to 5000ms
3. Check system resources
4. Monitor network usage

## 🎯 Success Indicators

- ✅ Progress bar shows 100%
- ✅ "Completed" status shown
- ✅ All contacts have enrichment data
- ✅ Data accessible in remote storage
- ✅ No errors in browser console

## 📞 Next Steps

1. **Tonight**: Run mega enrichment
2. **Tomorrow**: Verify results and deploy
3. **Future**: Set up scheduled enrichment runs

---

**Ready to start? Run these commands:**

```bash
# 1. Set up environment
source .env.production

# 2. Start the app
npm run dev

# 3. Open browser
open http://localhost:5173

# 4. Start mega enrichment
# (Use the UI in the Contacts page)
```
