from __future__ import annotations
from typing import Iterable, Dict, Any
from enrichment.orchestrator import PublicEnrichmentOrchestrator
from tiering.fallback import compute_company_features_from_products, assign_tier

def enrich_companies_public(companies: Iterable[Dict[str, Any]], products_by_company: Dict[str, list]):
    """
    companies: iterable of {"id": "...", "canonical_name": "..."}
    products_by_company: dict name -> list of product dicts
    Returns: list of upsert payloads with enrichment + tier
    """
    orchestrator = PublicEnrichmentOrchestrator()
    results = []

    for c in companies:
        name = c["canonical_name"]
        enr = orchestrator.enrich_company(name)

        # Convert EnrichmentResult dataclass → dict
        enrichment_dict = {
            "annual_revenue_usd": enr.annual_revenue_usd,
            "marketed_products_count": enr.marketed_products_count,
            "launches_last_5y": enr.launches_last_5y,
            "late_stage_assets_count": enr.late_stage_assets_count,
            "top_ta": enr.top_ta,
            "top_ta_share": enr.top_ta_share,
            "is_global_big_pharma": enr.is_global_big_pharma,
            "provenance": enr.provenance
        }

        # Derived features from our own products table
        products = products_by_company.get(name, []) or []
        derived = compute_company_features_from_products(products)

        # Optional: infer num_upcoming from late_stage_assets_count (very naive) if not separately computed
        num_upcoming = None
        if enr.late_stage_assets_count and enr.late_stage_assets_count > 0:
            num_upcoming = max(0, int(enr.late_stage_assets_count * 0.3))  # placeholder heuristic

        # If you later compute modality concentration, pass primary_modality_share
        tier = assign_tier(
            company_name=name,
            enrichment=enrichment_dict,
            derived=derived,
            num_upcoming=num_upcoming,
            primary_modality_share=None
        )

        results.append({
            "company_id": c["id"],
            "canonical_name": name,
            "enrichment": enrichment_dict,
            "derived": derived,
            "assigned_tier": tier
        })

    return results
