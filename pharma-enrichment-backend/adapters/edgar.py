from __future__ import annotations
import requests, time
from bs4 import BeautifulSoup
from .base import EnrichmentResult, SourceAdapter

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; EnrichmentBot/1.0) EDGAR polite"}

class EdgarAdapter(SourceAdapter):
    """
    EDGAR search stub for 10-K/20-F links. We primarily store provenance.
    For some companies you can parse 'Business' sections to infer marketed depth or segments.
    """

    SEARCH = "https://www.sec.gov/edgar/search/#/entityName={q}&forms=10-K,20-F"

    def enrich(self, company_name: str) -> EnrichmentResult:
        res = EnrichmentResult()
        try:
            url = self.SEARCH.format(q=requests.utils.quote(company_name))
            # We only record the search URL as provenance for now.
            res.set_with_provenance(
                "annual_revenue_usd",  # DO NOT set a value here; just provenance if you later parse
                None,
                source_url=url,
                method="reference",
                notes="EDGAR search URL for latest 10-K/20-F; add parser to extract numbers."
            )
            return res
        except Exception:
            return res
