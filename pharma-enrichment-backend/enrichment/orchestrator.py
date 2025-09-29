from __future__ import annotations
from typing import Dict, List, Optional
from dataclasses import dataclass
from adapters.base import EnrichmentResult
from adapters.companies_marketcap import CompaniesMarketCapAdapter
from adapters.pharmacompass import PharmaCompassAdapter
from adapters.edgar import EdgarAdapter
from adapters.clinicaltrials import ClinicalTrialsAdapter

# Seed/override — update as needed
SEED_BIG_PHARMA = {
    "Pfizer", "Roche", "Novartis", "Johnson & Johnson", "Merck & Co.",
    "Bristol Myers Squibb", "Sanofi", "AstraZeneca", "GSK", "Eli Lilly", "AbbVie", "Amgen",
    "Takeda", "Boehringer Ingelheim"
}

@dataclass
class Company:
    id: str
    canonical_name: str

class PublicEnrichmentOrchestrator:
    def __init__(self):
        self.adapters = [
            CompaniesMarketCapAdapter(),
            PharmaCompassAdapter(),
            EdgarAdapter(),
            ClinicalTrialsAdapter()
        ]

    def enrich_company(self, company_name: str) -> EnrichmentResult:
        agg = EnrichmentResult()
        # Seed override for Tier 1
        if company_name in SEED_BIG_PHARMA:
            agg.is_global_big_pharma = True
            agg.provenance["is_global_big_pharma"] = {
                "source_url": "seed_big_pharma.yml",
                "as_of": "seed",
                "method": "override",
                "notes": "Seeded Tier 1 list"
            }

        # Merge adapter outputs (first non-null wins per field)
        for adapter in self.adapters:
            res = adapter.enrich(company_name)
            for field in ("annual_revenue_usd", "marketed_products_count", "launches_last_5y",
                          "late_stage_assets_count", "top_ta", "top_ta_share", "is_global_big_pharma"):
                if getattr(agg, field) is None and getattr(res, field) is not None:
                    setattr(agg, field, getattr(res, field))
                    if field in res.provenance:
                        agg.provenance[field] = res.provenance[field]
        return agg
