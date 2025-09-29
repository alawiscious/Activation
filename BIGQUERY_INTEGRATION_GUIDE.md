# BigQuery Revenue Data Integration Guide

## 🎯 Overview

This guide explains how to integrate Genome's BigQuery revenue data into your Contact Visualizer system. The integration provides real-time, comprehensive revenue data to power your analytics and insights.

## 🏗️ Architecture

### Components Created

1. **`src/lib/bigQueryRevenue.ts`** - Core BigQuery service
2. **`src/components/Revenue/BigQueryRevenueManager.tsx`** - UI component for managing revenue data
3. **Integration in Analytics page** - Revenue data accessible in analytics

### Key Features

- **Real-time revenue data** from Genome's BigQuery
- **Intelligent caching** (30-minute cache duration)
- **Advanced filtering** by brand, company, therapeutic area, year, quarter
- **Export functionality** (CSV download)
- **Progress tracking** for large data fetches
- **Mock data** for development/testing

## 🔧 Setup Instructions

### 1. BigQuery Configuration

Update the configuration in `src/lib/bigQueryRevenue.ts`:

```typescript
const defaultConfig: BigQueryConfig = {
  projectId: 'your-genome-project-id',        // Your Genome BigQuery project
  datasetId: 'revenue_data',                  // Dataset containing revenue data
  tableId: 'brand_revenue',                   // Table with revenue information
  credentials: {
    // Add your Google Cloud credentials here
    // Or use environment variables for production
  }
}
```

### 2. Environment Variables (Recommended)

Create `.env.local`:

```bash
# BigQuery Configuration
VITE_BIGQUERY_PROJECT_ID=your-genome-project-id
VITE_BIGQUERY_DATASET_ID=revenue_data
VITE_BIGQUERY_TABLE_ID=brand_revenue

# Google Cloud Credentials (for production)
VITE_GOOGLE_CLOUD_CREDENTIALS_PATH=/path/to/credentials.json
```

### 3. Install Dependencies

```bash
npm install @google-cloud/bigquery
```

### 4. Replace Mock Implementation

In `src/lib/bigQueryRevenue.ts`, replace the `mockBigQueryCall` method with actual BigQuery client:

```typescript
import { BigQuery } from '@google-cloud/bigquery'

class OptimizedBigQueryRevenueService extends BigQueryRevenueService {
  private bigquery: BigQuery

  constructor(config: BigQueryConfig) {
    super(config)
    this.bigquery = new BigQuery({
      projectId: config.projectId,
      credentials: config.credentials
    })
  }

  private async executeBigQuery(query: string): Promise<BigQueryRevenueData[]> {
    const [rows] = await this.bigquery.query(query)
    return rows.map(row => ({
      brand_name: row.brand_name,
      company_name: row.company_name,
      therapeutic_area: row.therapeutic_area,
      indication: row.indication,
      year: row.year,
      quarter: row.quarter,
      worldwide_revenue: row.worldwide_revenue,
      us_revenue: row.us_revenue,
      revenue_currency: row.revenue_currency,
      data_source: row.data_source,
      last_updated: row.last_updated
    }))
  }
}
```

## 📊 Expected BigQuery Schema

Your BigQuery table should have the following structure:

```sql
CREATE TABLE `your-project.revenue_data.brand_revenue` (
  brand_name STRING NOT NULL,
  company_name STRING NOT NULL,
  therapeutic_area STRING NOT NULL,
  indication STRING,
  year INT64 NOT NULL,
  quarter INT64,
  worldwide_revenue FLOAT64 NOT NULL,
  us_revenue FLOAT64 NOT NULL,
  revenue_currency STRING DEFAULT 'USD',
  data_source STRING DEFAULT 'BigQuery',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
```

## 🚀 Usage

### 1. Access in Analytics Page

The BigQuery Revenue Manager is now available on the Analytics page:

- **Search and filter** revenue data
- **Export to CSV** for external analysis
- **View summary statistics** (total revenue, unique brands, etc.)
- **Filter by year/quarter** for time-based analysis

### 2. Programmatic Access

```typescript
import { bigQueryRevenueService } from '@/lib/bigQueryRevenue'

// Fetch all revenue data
const allRevenue = await bigQueryRevenueService.fetchRevenueData()

// Fetch revenue for specific brands
const brandRevenue = await bigQueryRevenueService.getBrandRevenue(['Humira', 'Keytruda'])

// Fetch latest revenue data
const latestRevenue = await bigQueryRevenueService.getLatestRevenue()

// Convert to your existing RevenueRow format
const revenueRows = bigQueryRevenueService.convertToRevenueRows(allRevenue)
```

### 3. Integration with Existing Data

The BigQuery data can be integrated with your existing revenue data:

```typescript
// In your Analytics component
const handleRevenueDataLoaded = (bigQueryData: BigQueryRevenueData[]) => {
  // Convert to your existing format
  const revenueRows = bigQueryRevenueService.convertToRevenueRows(bigQueryData)
  
  // Merge with existing revenue data
  const mergedRevenue = [...existingRevenueData, ...revenueRows]
  
  // Update your state/store
  updateRevenueData(mergedRevenue)
}
```

## 🔍 Query Examples

### Basic Queries

```typescript
// Get all revenue data
await bigQueryRevenueService.fetchRevenueData()

// Get revenue for specific companies
await bigQueryRevenueService.fetchRevenueData({
  companies: ['Pfizer', 'Merck', 'Johnson & Johnson']
})

// Get revenue for specific therapeutic areas
await bigQueryRevenueService.fetchRevenueData({
  therapeuticAreas: ['Oncology', 'Cardiovascular']
})

// Get revenue for specific years
await bigQueryRevenueService.fetchRevenueData({
  years: [2022, 2023, 2024]
})
```

### Advanced Queries

```typescript
// Get Q4 2023 revenue for oncology brands
await bigQueryRevenueService.fetchRevenueData({
  therapeuticAreas: ['Oncology'],
  years: [2023],
  quarters: [4]
})

// Get latest revenue for top brands
await bigQueryRevenueService.getLatestRevenue({
  brands: ['Humira', 'Keytruda', 'Opdivo', 'Stelara']
})
```

## 📈 Performance Optimizations

### 1. Caching
- **30-minute cache** for repeated queries
- **Cache statistics** available via `getCacheStats()`
- **Manual cache clearing** via `clearCache()`

### 2. Query Optimization
- **Intelligent filtering** reduces data transfer
- **Pagination support** for large datasets
- **Concurrent request handling**

### 3. Error Handling
- **Graceful degradation** if BigQuery is unavailable
- **Retry logic** for transient failures
- **Detailed error logging**

## 🔒 Security Considerations

### 1. Authentication
- Use **service account credentials** for production
- Store credentials in **environment variables**
- **Never commit credentials** to version control

### 2. Data Access
- **Limit BigQuery permissions** to necessary datasets
- **Use IAM roles** for fine-grained access control
- **Audit data access** through BigQuery logs

### 3. Data Privacy
- **Anonymize sensitive data** if required
- **Comply with data retention policies**
- **Monitor data usage** and costs

## 🧪 Testing

### 1. Mock Data
The system includes mock data for development:

```typescript
// Mock data is automatically generated for testing
const mockRevenue = await bigQueryRevenueService.fetchRevenueData()
console.log('Mock revenue data:', mockRevenue.length, 'records')
```

### 2. Unit Tests
Create tests for the BigQuery service:

```typescript
import { bigQueryRevenueService } from '@/lib/bigQueryRevenue'

describe('BigQuery Revenue Service', () => {
  test('should fetch revenue data', async () => {
    const data = await bigQueryRevenueService.fetchRevenueData()
    expect(data).toBeDefined()
    expect(Array.isArray(data)).toBe(true)
  })
})
```

## 📊 Monitoring and Analytics

### 1. Usage Metrics
- **Query frequency** and patterns
- **Cache hit rates**
- **Error rates** and types
- **Data volume** processed

### 2. Performance Metrics
- **Query execution time**
- **Data transfer volume**
- **Cache effectiveness**
- **User engagement** with revenue features

## 🚀 Next Steps

1. **Configure BigQuery credentials** and project details
2. **Test with mock data** to verify functionality
3. **Replace mock implementation** with real BigQuery client
4. **Integrate with existing revenue data** in your analytics
5. **Set up monitoring** and error tracking
6. **Optimize queries** based on usage patterns

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Google Cloud credentials
   - Check IAM permissions
   - Ensure project ID is correct

2. **Query Timeouts**
   - Reduce query scope (fewer brands/years)
   - Add appropriate indexes in BigQuery
   - Use pagination for large datasets

3. **Data Format Issues**
   - Verify BigQuery schema matches expected format
   - Check data types and null handling
   - Validate currency and date formats

### Support

For issues with BigQuery integration:
1. Check browser console for error messages
2. Verify BigQuery table schema
3. Test with smaller data subsets
4. Review Google Cloud logs for detailed errors

---

**Ready to integrate real-time revenue data from Genome's BigQuery!** 🎉
