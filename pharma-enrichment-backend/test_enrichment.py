#!/usr/bin/env python3
"""
Test script for the Pharma Enrichment system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enrichment.orchestrator import PublicEnrichmentOrchestrator
from jobs.enrich_companies_public import enrich_companies_public

def test_single_company():
    """Test enriching a single company"""
    print("🧪 Testing single company enrichment...")
    
    orchestrator = PublicEnrichmentOrchestrator()
    
    # Test with a known big pharma company
    test_companies = ["Pfizer", "Merck & Co.", "AbbVie", "Novartis"]
    
    for company in test_companies:
        print(f"\n📊 Enriching: {company}")
        result = orchestrator.enrich_company(company)
        
        print(f"  Revenue: ${result.annual_revenue_usd:,.0f}" if result.annual_revenue_usd else "  Revenue: Not found")
        print(f"  Products: {result.marketed_products_count}" if result.marketed_products_count else "  Products: Not found")
        print(f"  Late Stage Assets: {result.late_stage_assets_count}" if result.late_stage_assets_count else "  Late Stage Assets: Not found")
        print(f"  Big Pharma: {result.is_global_big_pharma}")
        print(f"  Provenance: {len(result.provenance)} sources")

def test_bulk_enrichment():
    """Test bulk enrichment with tiering"""
    print("\n🧪 Testing bulk enrichment with tiering...")
    
    # Sample companies
    companies = [
        {"id": "1", "canonical_name": "Pfizer"},
        {"id": "2", "canonical_name": "Merck & Co."},
        {"id": "3", "canonical_name": "AbbVie"},
        {"id": "4", "canonical_name": "Novartis"},
        {"id": "5", "canonical_name": "Small Biotech Inc"}  # This should be unclassified
    ]
    
    # Sample products data
    products_by_company = {
        "Pfizer": [
            {"ta": "Oncology", "launch_year": 2020, "is_marketed": True},
            {"ta": "Cardiovascular", "launch_year": 2018, "is_marketed": True},
            {"ta": "Oncology", "launch_year": 2022, "is_marketed": True}
        ],
        "Merck & Co.": [
            {"ta": "Oncology", "launch_year": 2019, "is_marketed": True},
            {"ta": "Oncology", "launch_year": 2021, "is_marketed": True}
        ],
        "Small Biotech Inc": [
            {"ta": "Oncology", "launch_year": None, "is_marketed": False}
        ]
    }
    
    results = enrich_companies_public(companies, products_by_company)
    
    print(f"\n📈 Enriched {len(results)} companies:")
    for result in results:
        print(f"\n  🏢 {result['canonical_name']}")
        print(f"    Tier: {result['assigned_tier']}")
        print(f"    Revenue: ${result['enrichment'].get('annual_revenue_usd', 0):,.0f}" if result['enrichment'].get('annual_revenue_usd') else "    Revenue: Not found")
        print(f"    Products: {result['derived'].get('num_products', 0)}")
        top_ta_share = result['derived'].get('top_ta_share', 0) or 0
        print(f"    Top TA: {result['derived'].get('top_ta', 'Unknown')} ({top_ta_share:.1%})")

if __name__ == "__main__":
    print("🚀 Starting Pharma Enrichment Tests\n")
    
    try:
        test_single_company()
        test_bulk_enrichment()
        print("\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
