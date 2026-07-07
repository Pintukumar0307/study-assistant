from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from app.core.config import get_settings

api_key_header = APIKeyHeader(name="X-Service-Key", auto_error=False)


async def verify_service_key(api_key: str = Security(api_key_header)):
    settings = get_settings()
    if not api_key or api_key != settings.service_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid service API key",
        )
    return api_key
