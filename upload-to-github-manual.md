# 📤 Manual GitHub Upload Instructions

Since GitHub CLI isn't installed, here's how to upload your data manually:

## 🚀 Quick Setup (5 minutes)

### Step 1: Create GitHub Repository
1. Go to: https://github.com/new
2. Repository name: `activation-data`
3. Make it **public**
4. Check "Initialize with README"
5. Click "Create repository"

### Step 2: Upload CSV Files
1. In your new repository, click "uploading an existing file"
2. Drag and drop these files from your `public/` folder:
   - `master-contacts.csv` (95MB)
   - `master-revenue.csv` (11MB) 
   - `master-company-file.csv` (11MB)
3. Commit message: "Add master CSV files for Activation app"
4. Click "Commit changes"

### Step 3: Test the URLs
Your files will be available at:
- **Contacts**: https://raw.githubusercontent.com/alawiscious/activation-data/main/master-contacts.csv
- **Revenue**: https://raw.githubusercontent.com/alawiscious/activation-data/main/master-revenue.csv
- **Companies**: https://raw.githubusercontent.com/alawiscious/activation-data/main/master-company-file.csv

### Step 4: Update Environment (if needed)
If your GitHub username is different from `alawiscious`, update the URL in `.env.local`:
```bash
VITE_DEFAULT_MASTER_CSV=https://raw.githubusercontent.com/YOUR_USERNAME/activation-data/main/master-contacts.csv
```

## 🧬 For Genome Enrichment Data

### Create Second Repository
1. Go to: https://github.com/new
2. Repository name: `activation-genome-data`
3. Make it **public**
4. Check "Initialize with README"
5. Click "Create repository"

### Create Enrichment Structure
1. Create a folder called `enrichment`
2. In that folder, create a file called `enrichment-data.json`
3. Add this content:

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

## ✅ Test Everything

After uploading:

1. **Refresh your app**: http://localhost:5173
2. **Check if data loads** (should see contacts and companies)
3. **Navigate to Contacts page**
4. **Look for "Automated Mega Enrichment"** section
5. **Test the enrichment system**

## 🎯 Expected Results

- ✅ App loads with all your contact data
- ✅ Companies and brands visible
- ✅ Mega enrichment system ready to run
- ✅ All data accessible remotely

---

**This will take about 5 minutes total and then you'll have everything working with remote data! 🚀**
