from __future__ import annotations
import re, time, random
import requests
from bs4 import BeautifulSoup
from .base import EnrichmentResult, SourceAdapter

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; EnrichmentBot/1.0)"}

class CompaniesMarketCapAdapter(SourceAdapter):
    """
    Lightweight scraper for https://companiesmarketcap.com/pharmaceuticals/largest-pharmaceutical-companies-by-revenue/
    Strategy:
      1) Hit the pharma-by-revenue list page (or company subpage if you map names → slugs).
      2) Parse revenue TTM value when present.
    NOTE: This is a stub; replace the parsing with site-specific logic you validate.
    """

    BASE = "https://companiesmarketcap.com"

    def enrich(self, company_name: str) -> EnrichmentResult:
        res = EnrichmentResult()
        try:
            # Naive strategy: search page (fallback) – you should replace with a proper company slug map.
            search_url = f"{self.BASE}/search/?q={requests.utils.quote(company_name)}"
            html = requests.get(search_url, headers=HEADERS, timeout=20).text
            soup = BeautifulSoup(html, "html.parser")
            # Heuristic: pick first result linking to /{company}/revenue/
            link = soup.select_one("a[href*='/revenue/']")
            if not link:
                return res  # No data found

            company_url = self.BASE + link.get("href")
            time.sleep(random.uniform(0.6, 1.2))  # polite delay
            html2 = requests.get(company_url, headers=HEADERS, timeout=20).text
            soup2 = BeautifulSoup(html2, "html.parser")

            # Heuristic extraction: look for figures with $ and "TTM" text
            text = soup2.get_text(" ", strip=True)
            m = re.search(r"Revenue.*?\$([\d\.,]+)\s*(?:billion|million)?\s*TTM", text, re.I)
            if m:
                raw = m.group(1).replace(",", "")
                # Try to detect scale (very naive)
                scale_billion = re.search(r"\b(billion)\b", text, re.I)
                revenue = float(raw) * (1_000_000_000 if scale_billion else 1_000_000)
                res.set_with_provenance(
                    "annual_revenue_usd",
                    revenue,
                    source_url=company_url,
                    method="scrape",
                    notes="TTM revenue parsed heuristically"
                )
            return res
        except Exception as e:
            # Fail quietly; return empty result
            return res
