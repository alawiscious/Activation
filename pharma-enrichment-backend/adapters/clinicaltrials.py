from __future__ import annotations
import requests
from .base import EnrichmentResult, SourceAdapter

class ClinicalTrialsAdapter(SourceAdapter):
    """
    Query ClinicalTrials.gov for Phase 3/4 trials by Sponsor/Collaborator ~ company_name.
    We store counts as approximations of late-stage assets / upcoming launches.
    """

    API = "https://clinicaltrials.gov/api/query/study_fields"
    FIELDS = "NCTId,Phase,OverallStatus,StartDate,PrimaryCompletionDate"
    MAX_RNK = 1000

    def enrich(self, company_name: str) -> EnrichmentResult:
        res = EnrichmentResult()
        try:
            params = {
                "expr": f'(Sponsor/{company_name}) OR (Collaborator/{company_name}) AND (AREA[Phase]Phase 3 OR AREA[Phase]Phase 4)',
                "fields": self.FIELDS,
                "min_rnk": 1,
                "max_rnk": self.MAX_RNK,
                "fmt": "json"
            }
            r = requests.get(self.API, params=params, timeout=30)
            r.raise_for_status()
            data = r.json()
            studies = data.get("StudyFieldsResponse", {}).get("StudyFields", [])
            late_stage_count = len(studies)

            # Naive upcoming proxy: count "Recruiting" or "Active, not recruiting" Phase 3
            upcoming = 0
            for s in studies:
                phase = " ".join(s.get("Phase", []))
                status = " ".join(s.get("OverallStatus", []))
                if "Phase 3" in phase and any(x in status for x in ["Recruiting", "Active, not recruiting", "Enrolling by invitation"]):
                    upcoming += 1

            query_url = r.url
            if late_stage_count > 0:
                res.set_with_provenance(
                    "late_stage_assets_count",
                    late_stage_count,
                    source_url=query_url,
                    method="api",
                    notes="Phase 3/4 count (approx)"
                )
                res.set_with_provenance(
                    "launches_last_5y",  # optional proxy; leave None if uncertain
                    None,
                    source_url=query_url,
                    method="inference",
                    notes="Derive separately from product metadata if available."
                )
                # You could also set num_upcoming in your orchestrator; keeping adapter minimal.
            return res
        except Exception:
            return res
