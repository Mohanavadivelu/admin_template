"""
Pydantic schemas for Usage Data domain.
"""
from pydantic import BaseModel, validator
from typing import List

def duration_to_seconds(duration_str: str) -> int:
    """Convert HH:MM:SS duration string to total seconds."""
    try:
        parts = duration_str.split(':')
        if len(parts) != 3:
            raise ValueError('Duration must be in HH:MM:SS format')
        hours, minutes, seconds = map(int, parts)
        if minutes >= 60 or seconds >= 60:
            raise ValueError('Minutes and seconds must be less than 60')
        if hours < 0 or minutes < 0 or seconds < 0:
            raise ValueError('Duration components must be non-negative')
        return hours * 3600 + minutes * 60 + seconds
    except (ValueError, AttributeError):
        raise ValueError('Duration must be in HH:MM:SS format')

def seconds_to_duration(total_seconds: int) -> str:
    """Convert total seconds to HH:MM:SS duration string."""
    if total_seconds < 0:
        raise ValueError('Seconds must be non-negative')
    
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

class UsageDataBase(BaseModel):
    """Base schema for usage data."""
    monitor_app_version: str  # Version of the monitoring application
    platform: str  # Operating system (e.g., "windows")
    user: str  # Windows username
    application_name: str  # Name of the tracked application
    application_version: str  # Version of the tracked application
    log_date: str  # Date when usage was recorded (YYYY-MM-DD format)
    legacy_app: bool  # Boolean indicating if it's a legacy application
    duration: str  # Time duration in HH:MM:SS format (API interface)

    @validator('duration')
    def validate_duration_format(cls, v):
        """Validate that duration is in HH:MM:SS format."""
        # Use the conversion function which includes validation
        duration_to_seconds(v)  # This will raise ValueError if invalid
        return v

class UsageDataCreate(UsageDataBase):
    """Schema for creating new usage data."""
    pass

class UsageData(UsageDataBase):
    """Schema for returning usage data from the database."""
    id: int  # Unique identifier for the usage data

    class Config:
        orm_mode = True  # Enable ORM mode for compatibility with DB models

class UsageDataListResponse(BaseModel):
    """Schema for returning the usage data list."""
    usage_data: List[UsageData]

class ApplicationAnalytics(BaseModel):
    """Schema for application usage analytics."""
    application: str
    user_count: int
    total_hours: str  # HH:MM:SS format

class ApplicationAnalyticsWithDateRange(BaseModel):
    """Schema for application usage analytics with date range."""
    application: str
    user_count: int
    total_hours: str  # HH:MM:SS format
    start_date: str
    end_date: str

def add_durations(duration1: str, duration2: str) -> str:
    """Add two HH:MM:SS duration strings and return the sum as HH:MM:SS."""
    try:
        # Parse first duration
        h1, m1, s1 = map(int, duration1.split(':'))
        # Parse second duration
        h2, m2, s2 = map(int, duration2.split(':'))
        
        # Add components
        total_seconds = s1 + s2
        total_minutes = m1 + m2 + (total_seconds // 60)
        total_hours = h1 + h2 + (total_minutes // 60)
        
        # Handle overflow
        final_seconds = total_seconds % 60
        final_minutes = total_minutes % 60
        
        return f"{total_hours:02d}:{final_minutes:02d}:{final_seconds:02d}"
    except (ValueError, AttributeError):
        raise ValueError('Both durations must be in HH:MM:SS format')
