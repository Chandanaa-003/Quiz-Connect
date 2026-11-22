from datetime import datetime
from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    status: str
    app: str
    version: str
    database: str
    timestamp: datetime
