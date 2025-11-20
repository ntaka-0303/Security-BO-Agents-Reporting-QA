from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class DistributionRequest(BaseModel):
    channel_type: str
    requested_by: str


class DistributionRecord(BaseModel):
    distribution_id: int
    draft_id: int
    channel_type: str
    distribution_status: str
    sent_at: Optional[datetime]
    result_detail: Optional[str]


class DistributionListResponse(BaseModel):
    items: List[DistributionRecord]
