from __future__ import annotations
from collections import Counter
from typing import List, Dict, Any, Optional

# Configurable thresholds (could be loaded from admin_config)
TOP_TA_SHARE_THRESH = 0.60
PLATFORM_SHARE_THRESH = 0.70  # only if you later compute modality shares

def compute_company_features_from_products(products: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    products: list of dicts with keys like:
      { "ta": "Oncology", "launch_year": 2023, "modality": "mAb", "is_marketed": True }
    """
    ta_counts = Counter(p.get("ta") for p in products if p.get("ta"))
    total = sum(ta_counts.values())
    if total:
        top_ta, top_count = ta_counts.most_common(1)[0]
        top_ta_share = top_count / total
    else:
        top_ta, top_ta_share = None, None

    num_products = sum(1 for p in products if p.get("is_marketed"))
    # If you track launches:
    from datetime import datetime
    year_now = datetime.now().year
    num_launches_recent = sum(1 for p in products if p.get("launch_year") and p["launch_year"] >= year_now - 5)

    # You can compute num_upcoming elsewhere (e.g., from ClinicalTrials) and pass it in.
    return {
        "top_ta": top_ta,
        "top_ta_share": top_ta_share,
        "num_products": num_products,
        "num_launches_recent": num_launches_recent,
    }

def assign_tier(
    company_name: str,
    enrichment: Dict[str, Any],
    derived: Dict[str, Any],
    num_upcoming: Optional[int] = None,
    primary_modality_share: Optional[float] = None
) -> str:
    # 1) Tier 1 via seed
    if enrichment.get("is_global_big_pharma"):
        return "TIER_1"

    # 2) Therapeutic Area Specialist
    if (derived.get("top_ta_share") is not None and derived["top_ta_share"] >= TOP_TA_SHARE_THRESH) and \
       ((derived.get("num_products") or 0) >= 2 or (derived.get("num_launches_recent") or 0) >= 1):
        return "TA_SPECIALISTS"

    # 3) First Launchers
    if (derived.get("num_products") or 0) == 0 and (num_upcoming or 0) > 0:
        return "FIRST_LAUNCHERS"

    # 4) Focused Platform Builders (needs modality)
    if primary_modality_share is not None and primary_modality_share >= PLATFORM_SHARE_THRESH:
        return "PLATFORM_BUILDERS"

    # 5) Mid-Tier
    if (derived.get("num_products") or 0) >= 1 or (derived.get("num_launches_recent") or 0) >= 1:
        return "MID_TIER"

    # 6) Unclassified
    return "UNCLASSIFIED"
