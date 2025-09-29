from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from enrichment.orchestrator import PublicEnrichmentOrchestrator
from jobs.enrich_companies_public import enrich_companies_public

app = FastAPI(
    title="Pharma Enrichment API",
    description="Data enrichment service for pharmaceutical companies",
    version="1.0.0"
)

# Add CORS middleware to allow React app to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5188", "http://localhost:5197"],  # Add your React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the orchestrator
orchestrator = PublicEnrichmentOrchestrator()

class CompanyEnrichmentRequest(BaseModel):
    company_name: str

class CompanyEnrichmentResponse(BaseModel):
    company_name: str
    annual_revenue_usd: Optional[float] = None
    marketed_products_count: Optional[int] = None
    launches_last_5y: Optional[int] = None
    late_stage_assets_count: Optional[int] = None
    top_ta: Optional[str] = None
    top_ta_share: Optional[float] = None
    is_global_big_pharma: Optional[bool] = None
    provenance: Dict[str, Any] = {}

class BulkEnrichmentRequest(BaseModel):
    companies: List[Dict[str, Any]]
    products_by_company: Dict[str, List[Dict[str, Any]]] = {}

class BulkEnrichmentResponse(BaseModel):
    results: List[Dict[str, Any]]

@app.get("/")
async def root():
    return {"message": "Pharma Enrichment API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pharma-enrichment-api"}

@app.post("/enrich", response_model=CompanyEnrichmentResponse)
async def enrich_single_company(request: CompanyEnrichmentRequest):
    """Enrich a single company with data from multiple sources"""
    try:
        result = orchestrator.enrich_company(request.company_name)
        
        return CompanyEnrichmentResponse(
            company_name=request.company_name,
            annual_revenue_usd=result.annual_revenue_usd,
            marketed_products_count=result.marketed_products_count,
            launches_last_5y=result.launches_last_5y,
            late_stage_assets_count=result.late_stage_assets_count,
            top_ta=result.top_ta,
            top_ta_share=result.top_ta_share,
            is_global_big_pharma=result.is_global_big_pharma,
            provenance=result.provenance
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")

@app.post("/enrich/bulk", response_model=BulkEnrichmentResponse)
async def enrich_multiple_companies(request: BulkEnrichmentRequest):
    """Enrich multiple companies with tiering logic"""
    try:
        results = enrich_companies_public(
            companies=request.companies,
            products_by_company=request.products_by_company
        )
        
        return BulkEnrichmentResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk enrichment failed: {str(e)}")

@app.get("/tiers")
async def get_tier_definitions():
    """Get the tier definitions and thresholds"""
    return {
        "tiers": {
            "TIER_1": "Big Pharma - Global scale with significant revenue and late-stage assets",
            "TA_SPECIALISTS": "Therapeutic Area Specialists - Focused on specific therapeutic areas",
            "FIRST_LAUNCHERS": "First Launchers - Pre-revenue companies with upcoming launches",
            "PLATFORM_BUILDERS": "Focused Platform Builders - Technology/platform focused companies",
            "MID_TIER": "Mid-Tier - Established companies with some commercial presence",
            "UNCLASSIFIED": "Unclassified - Companies that don't fit other categories"
        },
        "thresholds": {
            "top_ta_share_threshold": 0.60,
            "platform_share_threshold": 0.70
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
