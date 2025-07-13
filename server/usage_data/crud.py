"""
CRUD operations for Usage Data domain.
"""
from server.database.database import get_db_connection
from .models import UsageDataCreate, UsageData, duration_to_seconds, seconds_to_duration
from typing import List, Optional
import json
from datetime import datetime

def create_or_update_usage_data(usage_data: UsageDataCreate) -> int:
    """
    Create new usage data or update existing record by summing durations.
    If a record exists with the same user, application_name, and log_date,
    the durations are summed. Otherwise, a new record is created.
    Returns the ID of the created or updated record.
    """
    # Console logging: Log the received data
    print(f"\n📥 USAGE DATA RECEIVED [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    print("=" * 60)
    received_data = {
        "monitor_app_version": usage_data.monitor_app_version,
        "platform": usage_data.platform,
        "user": usage_data.user,
        "application_name": usage_data.application_name,
        "application_version": usage_data.application_version,
        "log_date": usage_data.log_date,
        "legacy_app": usage_data.legacy_app,
        "duration": usage_data.duration
    }
    print(json.dumps(received_data, indent=2))
    
    # Convert duration to seconds for storage
    new_duration_seconds = duration_to_seconds(usage_data.duration)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if a record exists with the same user, application_name, and log_date
    cursor.execute('''
        SELECT id, duration_seconds FROM usage_data 
        WHERE user = ? AND application_name = ? AND log_date = ?
    ''', (usage_data.user, usage_data.application_name, usage_data.log_date))
    
    existing_record = cursor.fetchone()
    
    if existing_record:
        # Update existing record by summing durations
        record_id = existing_record['id']
        current_duration_seconds = existing_record['duration_seconds']
        total_duration_seconds = current_duration_seconds + new_duration_seconds
        
        # Convert back to HH:MM:SS for logging
        current_duration_str = seconds_to_duration(current_duration_seconds)
        total_duration_str = seconds_to_duration(total_duration_seconds)
        
        print(f"\n🔄 UPDATING EXISTING RECORD (ID: {record_id})")
        print(f"   Previous duration: {current_duration_str}")
        print(f"   Adding duration:   {usage_data.duration}")
        print(f"   New total duration: {total_duration_str}")
        
        cursor.execute('''
            UPDATE usage_data SET 
            monitor_app_version = ?, platform = ?, application_version = ?,
            legacy_app = ?, duration_seconds = ?
            WHERE id = ?
        ''', (
            usage_data.monitor_app_version, usage_data.platform,
            usage_data.application_version, usage_data.legacy_app,
            total_duration_seconds, record_id
        ))
        conn.commit()
        
        # Log the final stored data
        cursor.execute('SELECT * FROM usage_data WHERE id = ?', (record_id,))
        updated_record = cursor.fetchone()
        print(f"\n💾 FINAL STORED DATA:")
        stored_data = _row_to_dict(updated_record)
        print(json.dumps(stored_data, indent=2))
        
        conn.close()
        return record_id
    else:
        # Create new record
        print(f"\n✨ CREATING NEW RECORD")
        print(f"   Duration: {usage_data.duration}")
        
        cursor.execute('''
            INSERT INTO usage_data 
            (monitor_app_version, platform, user, application_name, 
             application_version, log_date, legacy_app, duration_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            usage_data.monitor_app_version, usage_data.platform, usage_data.user,
            usage_data.application_name, usage_data.application_version,
            usage_data.log_date, usage_data.legacy_app, new_duration_seconds
        ))
        conn.commit()
        record_id = cursor.lastrowid
        
        # Log the final stored data
        cursor.execute('SELECT * FROM usage_data WHERE id = ?', (record_id,))
        new_record = cursor.fetchone()
        print(f"\n💾 FINAL STORED DATA:")
        stored_data = _row_to_dict(new_record)
        print(json.dumps(stored_data, indent=2))
        
        conn.close()
        return record_id

def get_usage_data_list() -> List[dict]:
    """Retrieve all usage data as a list of dicts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usage_data ORDER BY log_date DESC, id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_dict(row) for row in rows]

def get_application_analytics(application_name: str) -> dict:
    """Get user count and total hours for a specific application."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user count and total duration in seconds
    cursor.execute('''
        SELECT 
            COUNT(DISTINCT user) as user_count,
            COALESCE(SUM(duration_seconds), 0) as total_seconds
        FROM usage_data 
        WHERE application_name = ?
    ''', (application_name,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result and result['user_count'] > 0:
        total_hours = seconds_to_duration(result['total_seconds'])
        return {
            "application": application_name,
            "user_count": result['user_count'],
            "total_hours": total_hours
        }
    else:
        return {
            "application": application_name,
            "user_count": 0,
            "total_hours": "00:00:00"
        }

def get_application_analytics_by_date_range(application_name: str, start_date: str, end_date: str) -> dict:
    """Get user count and total hours for a specific application within date range."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user count and total duration in seconds for date range
    cursor.execute('''
        SELECT 
            COUNT(DISTINCT user) as user_count,
            COALESCE(SUM(duration_seconds), 0) as total_seconds
        FROM usage_data 
        WHERE application_name = ? 
        AND log_date BETWEEN ? AND ?
    ''', (application_name, start_date, end_date))
    
    result = cursor.fetchone()
    conn.close()
    
    if result and result['user_count'] > 0:
        total_hours = seconds_to_duration(result['total_seconds'])
        return {
            "application": application_name,
            "user_count": result['user_count'],
            "total_hours": total_hours,
            "start_date": start_date,
            "end_date": end_date
        }
    else:
        return {
            "application": application_name,
            "user_count": 0,
            "total_hours": "00:00:00",
            "start_date": start_date,
            "end_date": end_date
        }

def _row_to_dict(row) -> dict:
    """Convert a database row to the expected dictionary format."""
    # Convert duration_seconds back to HH:MM:SS for API response
    duration_str = seconds_to_duration(row["duration_seconds"])
    
    return {
        "id": row["id"],
        "monitor_app_version": row["monitor_app_version"],
        "platform": row["platform"],
        "user": row["user"],
        "application_name": row["application_name"],
        "application_version": row["application_version"],
        "log_date": row["log_date"],
        "legacy_app": bool(row["legacy_app"]),
        "duration": duration_str  # Convert back to HH:MM:SS for API
    }
