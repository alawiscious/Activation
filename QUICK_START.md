# 🚀 Quick Start Guide - After Reboot

## **1. Start the Application**
```bash
cd "/Users/amelkonian/Projects/Contact Visualizer"
npm run dev
```

## **2. Test Key Features**

### **CSV Mapping Interface**
1. Click "Load Sample Data" button
2. Search for "AbbVie" on left side
3. Select matching companies on right side
4. Click "Apply Mappings"

### **Analytics Page**
1. Go to Analytics tab
2. Search for "Vertex" 
3. Should load instantly with populated graphs

### **Contacts Page**
1. Select a company from dropdown
2. Check that filters show only relevant data

## **3. If Issues Occur**

### **Build Errors**
```bash
npm run build
```

### **TypeScript Errors**
```bash
npx tsc --noEmit
```

### **Linting Issues**
```bash
npm run lint
```

## **4. Key Files to Check**
- `src/components/PharmaVisualPivot.tsx` - Main app
- `src/app/Analytics.tsx` - Analytics page
- `src/components/CSVMapping/CSVColumnMapper.tsx` - Mapping interface

## **5. Sample Data Files**
- `public/master-company-file.csv` - Master companies with revenue
- `public/master-contacts.csv` - Contact data

---

**Everything should work immediately after reboot!** 🎉

