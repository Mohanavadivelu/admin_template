"""
Pydantic schemas for Legacy Apps domain.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import date

class CpuMemoryTrack(BaseModel):
    """Schema for CPU and memory tracking configuration."""
    track_cm: bool  # Whether to track CPU and memory
    track_intr: int  # Tracking interval

class Track(BaseModel):
    """Schema for tracking configuration."""
    usage: bool  # Whether to track usage
    location: bool  # Whether to track location
    cpu_memory: CpuMemoryTrack  # CPU and memory tracking settings

class LegacyAppBase(BaseModel):
    """Base schema for a legacy application."""
    app_name: str  # Name of the legacy application (e.g., "code")
    app_type: str  # Type of application (e.g., "windows")
    current_version: str  # Current version of the application
    released_date: str  # Release date (YYYY-MM-DD format)
    publisher: str  # Publisher of the application
    description: str  # Description of the application
    download_link: str  # Download link for the application
    enable_tracking: bool  # Whether tracking is enabled for this app
    track: Track  # Tracking configuration
    registered_date: str  # Date when app was registered (YYYY-MM-DD format)

class LegacyAppCreate(LegacyAppBase):
    """Schema for creating a new legacy application."""
    pass

class LegacyApp(LegacyAppBase):
    """Schema for returning a legacy application from the database."""
    app_id: int  # Unique identifier for the legacy application

    class Config:
        orm_mode = True  # Enable ORM mode for compatibility with DB models

class ApplicationListResponse(BaseModel):
    """Schema for returning the application list."""
    application_list: list[LegacyApp]
