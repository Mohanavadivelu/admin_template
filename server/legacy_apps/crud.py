"""
CRUD operations for Legacy Apps domain.
"""
from server.database.database import get_db_connection
from .models import LegacyAppCreate, LegacyApp, Track, CpuMemoryTrack
from typing import List, Optional

def create_legacy_app(app: LegacyAppCreate) -> int:
    """Insert a new legacy app into the database and return its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO legacy_apps_list 
        (app_name, app_type, current_version, released_date, publisher, 
         description, download_link, enable_tracking, track_usage, 
         track_location, track_cm, track_intr, registered_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        app.app_name, app.app_type, app.current_version, app.released_date,
        app.publisher, app.description, app.download_link, app.enable_tracking,
        app.track.usage, app.track.location, app.track.cpu_memory.track_cm,
        app.track.cpu_memory.track_intr, app.registered_date
    ))
    conn.commit()
    app_id = cursor.lastrowid
    conn.close()
    return app_id

def get_legacy_app(app_id: int) -> Optional[dict]:
    """Retrieve a legacy app by its ID. Returns a dict or None if not found."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM legacy_apps_list WHERE app_id = ?", (app_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return _row_to_dict(row)
    return None

def get_legacy_apps() -> List[dict]:
    """Retrieve all legacy apps as a list of dicts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM legacy_apps_list")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(row) for row in rows]

def update_legacy_app(app_id: int, app: LegacyAppCreate) -> bool:
    """Update a legacy app by its ID. Returns True if updated, False otherwise."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE legacy_apps_list SET 
        app_name = ?, app_type = ?, current_version = ?, released_date = ?,
        publisher = ?, description = ?, download_link = ?, enable_tracking = ?,
        track_usage = ?, track_location = ?, track_cm = ?, track_intr = ?,
        registered_date = ?
        WHERE app_id = ?
    ''', (
        app.app_name, app.app_type, app.current_version, app.released_date,
        app.publisher, app.description, app.download_link, app.enable_tracking,
        app.track.usage, app.track.location, app.track.cpu_memory.track_cm,
        app.track.cpu_memory.track_intr, app.registered_date, app_id
    ))
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    return updated

def delete_legacy_app(app_id: int) -> bool:
    """Delete a legacy app by its ID. Returns True if deleted, False otherwise."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM legacy_apps_list WHERE app_id = ?", (app_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def _row_to_dict(row) -> dict:
    """Convert a database row to the expected dictionary format."""
    return {
        "app_id": row["app_id"],
        "app_name": row["app_name"],
        "app_type": row["app_type"],
        "current_version": row["current_version"],
        "released_date": row["released_date"],
        "publisher": row["publisher"],
        "description": row["description"],
        "download_link": row["download_link"],
        "enable_tracking": bool(row["enable_tracking"]),
        "track": {
            "usage": bool(row["track_usage"]),
            "location": bool(row["track_location"]),
            "cpu_memory": {
                "track_cm": bool(row["track_cm"]),
                "track_intr": row["track_intr"]
            }
        },
        "registered_date": row["registered_date"]
    }
