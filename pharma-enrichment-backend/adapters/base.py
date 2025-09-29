from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime, timezone

@dataclass
class EnrichmentResult:
    # Normalized fields (all optional; fill what you can)
    annual_revenue_usd: Optional[float] = None
    marketed_products_count: Optional[int] = None
    launches_last_5y: Optional[int] = None
    late_stage_assets_count: Optional[int] = None
    top_ta: Optional[str] = None
    top_ta_share: Optional[float] = None
    is_global_big_pharma: Optional[bool] = None

    # Provenance per-field (url, as_of, notes/method)
    provenance: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    def set_with_provenance(self, field_name: str, value: Any, source_url: str, method: str = "scrape", as_of: Optional[datetime] = None, notes: Optional[str] = None):
        setattr(self, field_name, value)
        self.provenance[field_name] = {
            "source_url": source_url,
            "as_of": (as_of or datetime.now(timezone.utc)).isoformat(),
            "method": method,
            "notes": notes
        }

class SourceAdapter:
    """Interface all adapters must implement."""
    def enrich(self, company_name: str) -> EnrichmentResult:
        raise NotImplementedError
