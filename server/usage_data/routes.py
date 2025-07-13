from fastapi import APIRouter, Depends, HTTPException, status, Security, Query
from fastapi.security.api_key import APIKeyHeader
from .models import UsageData, UsageDataCreate, UsageDataListResponse, ApplicationAnalytics, ApplicationAnalyticsWithDateRange
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

# APIRouter for usage data endpoints
router = APIRouter(prefix="/usage_data", tags=["Usage Data"])

@router.post("/", response_model=int, dependencies=[Depends(get_api_key)])
def create_or_update_usage_data(usage_data: UsageDataCreate):
    """
    Create new usage data or update existing record by summing durations.
    If a record exists with the same user, application_name, and log_date,
    the durations are summed. Otherwise, a new record is created.
    
    Example:
        curl -X POST "http://localhost:8000/usage_data/" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w" -H "Content-Type: application/json" -d '{
            "monitor_app_version": "1.0.1",
            "platform": "windows",
            "user": "vroot",
            "application_name": "chrome",
            "application_version": "138.0.7204.97",
            "log_date": "2025-07-02",
            "legacy_app": true,
            "duration": "00:00:13"
        }'
    """
    from datetime import datetime
    import json
    
    # Console logging: Log API endpoint hit
    print(f"\n🌐 API ENDPOINT HIT: POST /usage_data/ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    print("🔑 Authentication: PASSED")
    print("📋 Request payload validation: PASSED")
    
    # Process the data
    record_id = crud.create_or_update_usage_data(usage_data)
    
    print(f"✅ OPERATION COMPLETED - Record ID: {record_id}")
    print("=" * 60)
    
    return record_id

@router.get("/", response_model=UsageDataListResponse, dependencies=[Depends(get_api_key)])
def list_usage_data():
    """
    List all usage data records ordered by log_date (most recent first).
    
    Example:
        curl -X GET "http://localhost:8000/usage_data/" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w"
    """
    usage_data_list = crud.get_usage_data_list()
    return {"usage_data": usage_data_list}

@router.get("/analytics/{application_name}", response_model=ApplicationAnalytics, dependencies=[Depends(get_api_key)])
def get_application_analytics(application_name: str):
    """
    Get analytics for a specific application: user count and total usage hours.
    
    Args:
        application_name: Name of the application (e.g., "chrome", "code")
    
    Returns:
        - application: Application name
        - user_count: Number of unique users
        - total_hours: Total usage time in HH:MM:SS format
    
    Example:
        curl -X GET "http://localhost:8000/usage_data/analytics/chrome" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w"
    """
    analytics = crud.get_application_analytics(application_name)
    return analytics

@router.get("/analytics/{application_name}/date-range", response_model=ApplicationAnalyticsWithDateRange, dependencies=[Depends(get_api_key)])
def get_application_analytics_by_date_range(
    application_name: str,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format")
):
    """
    Get analytics for a specific application within a date range: user count and total usage hours.
    
    Args:
        application_name: Name of the application (e.g., "chrome", "code")
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
    
    Returns:
        - application: Application name
        - user_count: Number of unique users in the date range
        - total_hours: Total usage time in HH:MM:SS format
        - start_date: Start date of the range
        - end_date: End date of the range
    
    Example:
        curl -X GET "http://localhost:8000/usage_data/analytics/chrome/date-range?start_date=2025-02-01&end_date=2025-02-28" -H "X-API-Key-725d9439: CyRLgKg-FL7RuTtVvb7BPr8wmUoI1PamDj4Xdb3eT9w"
    """
    # Validate date format (basic validation)
    try:
        from datetime import datetime
        datetime.strptime(start_date, '%Y-%m-%d')
        datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Validate date range
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")
    
    analytics = crud.get_application_analytics_by_date_range(application_name, start_date, end_date)
    return analytics
