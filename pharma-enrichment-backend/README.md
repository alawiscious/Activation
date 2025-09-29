# Pharma Enrichment Backend

A Python-based data enrichment service for pharmaceutical companies that integrates with your React frontend.

## Features

- **Multi-source data enrichment** from web scraping and APIs
- **Intelligent tiering system** for company classification
- **Provenance tracking** for all data sources
- **RESTful API** for React integration
- **Graceful degradation** when data sources are unavailable

## Data Sources

1. **CompaniesMarketCap** - Revenue and market cap data
2. **PharmaCompass** - Drug and product information
3. **EDGAR** - SEC filings and regulatory data
4. **ClinicalTrials.gov** - Clinical trial information

## Quick Start

### 1. Install Dependencies

```bash
cd pharma-enrichment-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Test the System

```bash
python test_enrichment.py
```

### 3. Start the API Server

```bash
python api/main.py
```

The API will be available at `http://localhost:8000`

### 4. Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Enrich a single company
curl -X POST "http://localhost:8000/enrich" \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Pfizer"}'

# Get tier definitions
curl http://localhost:8000/tiers
```

## API Endpoints

### `POST /enrich`
Enrich a single company with data from multiple sources.

**Request:**
```json
{
  "company_name": "Pfizer"
}
```

**Response:**
```json
{
  "company_name": "Pfizer",
  "annual_revenue_usd": 100000000000,
  "marketed_products_count": 25,
  "late_stage_assets_count": 15,
  "is_global_big_pharma": true,
  "provenance": {
    "annual_revenue_usd": {
      "source_url": "https://companiesmarketcap.com/pfizer/revenue/",
      "as_of": "2024-01-15T10:30:00Z",
      "method": "scrape",
      "notes": "TTM revenue parsed heuristically"
    }
  }
}
```

### `POST /enrich/bulk`
Enrich multiple companies with tiering logic.

**Request:**
```json
{
  "companies": [
    {"id": "1", "canonical_name": "Pfizer"},
    {"id": "2", "canonical_name": "Merck & Co."}
  ],
  "products_by_company": {
    "Pfizer": [
      {"ta": "Oncology", "launch_year": 2020, "is_marketed": true}
    ]
  }
}
```

### `GET /tiers`
Get tier definitions and classification thresholds.

## Company Tiers

1. **TIER_1** - Big Pharma (Pfizer, Merck, etc.)
2. **TA_SPECIALISTS** - Therapeutic Area Specialists
3. **FIRST_LAUNCHERS** - Pre-revenue companies with upcoming launches
4. **PLATFORM_BUILDERS** - Technology/platform focused companies
5. **MID_TIER** - Established companies with some commercial presence
6. **UNCLASSIFIED** - Companies that don't fit other categories

## Integration with React App

Add this to your React app to call the enrichment API:

```typescript
const enrichCompany = async (companyName: string) => {
  const response = await fetch('http://localhost:8000/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name: companyName })
  })
  return response.json()
}

// Use in your component
const enrichedData = await enrichCompany('Pfizer')
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │◄──►│   FastAPI        │◄──►│  Data Sources   │
│  (Frontend)     │    │   (Backend)      │    │  (Web/APIs)     │
│                 │    │                  │    │                 │
│ • Visualization │    │ • Orchestrator   │    │ • MarketCap     │
│ • Data Display  │    │ • Adapters       │    │ • PharmaCompass │
│ • User Interface│    │ • Tiering Logic  │    │ • EDGAR         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Development

### Adding New Data Sources

1. Create a new adapter in `adapters/`
2. Implement the `SourceAdapter` interface
3. Add to the orchestrator in `enrichment/orchestrator.py`

### Modifying Tiering Logic

Edit `tiering/fallback.py` to adjust classification rules and thresholds.

### Running Tests

```bash
python test_enrichment.py
```

## Production Deployment

1. Use a production ASGI server like Gunicorn
2. Set up proper logging and monitoring
3. Configure rate limiting for external APIs
4. Use environment variables for configuration
5. Set up proper error handling and retries

## License

MIT License - see LICENSE file for details.
