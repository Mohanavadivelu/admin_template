from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security.api_key import APIKeyHeader
from .models import LegacyApp, LegacyAppCreate, ApplicationListResponse
from . import crud
from typing import List

# API Key authentication setup
API_KEY = "CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w"
API_KEY_NAME = "X-API-Key-725d9439"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API Key")
    return api_key

# APIRouter for legacy apps endpoints
router = APIRouter(prefix="/app_list", tags=["Application List"])

@router.post("/", response_model=int, dependencies=[Depends(get_api_key)])
def create_legacy_app(app: LegacyAppCreate):
    """
    Create a new legacy application.
    Example:
        curl -X POST "http://localhost:8000/app_list/" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w" -H "Content-Type: application/json" -d '{
            "app_name": "notepad",
            "app_type": "windows",
            "current_version": "1.0.0",
            "released_date": "2025-01-01",
            "publisher": "Microsoft",
            "description": "Simple text editor",
            "download_link": "https://microsoft.com/notepad",
            "enable_tracking": true,
            "track": {
                "usage": true,
                "location": false,
                "cpu_memory": {
                    "track_cm": false,
                    "track_intr": 1
                }
            },
            "registered_date": "2025-01-01"
        }'
    """
    return crud.create_legacy_app(app)

@router.get("/", response_model=ApplicationListResponse, dependencies=[Depends(get_api_key)])
def list_legacy_apps():
    """
    List all legacy applications in the required format.
    Example:
        curl -X GET "http://localhost:8000/app_list/" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w"
    """
    apps = crud.get_legacy_apps()
    return {"application_list": apps}

@router.get("/{app_id}", response_model=LegacyApp, dependencies=[Depends(get_api_key)])
def get_legacy_app(app_id: int):
    """
    Get a legacy application by ID.
    Example:
        curl -X GET "http://localhost:8000/app_list/1" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w"
    """
    app = crud.get_legacy_app(app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Legacy application not found")
    return app

@router.put("/{app_id}", response_model=bool, dependencies=[Depends(get_api_key)])
def update_legacy_app(app_id: int, app: LegacyAppCreate):
    """
    Update a legacy application by ID.
    Example:
        curl -X PUT "http://localhost:8000/app_list/1" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w" -H "Content-Type: application/json" -d '{
            "app_name": "notepad_updated",
            "app_type": "windows",
            "current_version": "1.1.0",
            "released_date": "2025-02-01",
            "publisher": "Microsoft",
            "description": "Updated text editor",
            "download_link": "https://microsoft.com/notepad",
            "enable_tracking": true,
            "track": {
                "usage": true,
                "location": true,
                "cpu_memory": {
                    "track_cm": true,
                    "track_intr": 5
                }
            },
            "registered_date": "2025-01-01"
        }'
    """
    return crud.update_legacy_app(app_id, app)

@router.delete("/{app_id}", response_model=bool, dependencies=[Depends(get_api_key)])
def delete_legacy_app(app_id: int):
    """
    Delete a legacy application by ID.
    Example:
        curl -X DELETE "http://localhost:8000/app_list/1" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w"
    """
    return crud.delete_legacy_app(app_id)
