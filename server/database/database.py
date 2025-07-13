"""
Unified database connection and initialization logic for application_statistics.db.
"""
import sqlite3
import os

def get_db_path():
    """Return the path to the application_statistics.db file."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(current_dir, 'application_statistics.db')

def get_db_connection():
    """Create and return a new SQLite connection to the application_statistics.db file."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the legacy_apps_list and usage_data tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create legacy_apps_list table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS legacy_apps_list (
            app_id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            app_type TEXT NOT NULL,
            current_version TEXT NOT NULL,
            released_date TEXT NOT NULL,
            publisher TEXT NOT NULL,
            description TEXT NOT NULL,
            download_link TEXT NOT NULL,
            enable_tracking BOOLEAN NOT NULL,
            track_usage BOOLEAN NOT NULL,
            track_location BOOLEAN NOT NULL,
            track_cm BOOLEAN NOT NULL,
            track_intr INTEGER NOT NULL,
            registered_date TEXT NOT NULL
        )
    ''')
    
    # Insert sample data if legacy_apps_list table is empty
    cursor.execute("SELECT COUNT(*) FROM legacy_apps_list")
    if cursor.fetchone()[0] == 0:
        sample_apps = [
            (
                "code", "windows", "1.101.1", "2025-06-23", "vs code", "", "",
                True, True, False, False, 1, "2025-06-23"
            ),
            (
                "chrome", "windows", "1.101.1", "2025-06-23", "Google", "", "",
                True, True, True, True, 1, "2025-06-23"
            )
        ]
        
        cursor.executemany('''
            INSERT INTO legacy_apps_list 
            (app_name, app_type, current_version, released_date, publisher, 
             description, download_link, enable_tracking, track_usage, 
             track_location, track_cm, track_intr, registered_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_apps)

    # Create usage_data table with duration stored as INTEGER (total seconds)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            monitor_app_version TEXT NOT NULL,
            platform TEXT NOT NULL,
            user TEXT NOT NULL,
            application_name TEXT NOT NULL,
            application_version TEXT NOT NULL,
            log_date TEXT NOT NULL,
            legacy_app BOOLEAN NOT NULL,
            duration_seconds INTEGER NOT NULL
        )
    ''')
    
    # Create composite index for efficient lookups
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_usage_data_unique 
        ON usage_data (user, application_name, log_date)
    ''')
    
    # Create index on application_name for analytics queries
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_application_name 
        ON usage_data (application_name)
    ''')
    
    # Create index on log_date for date range queries
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_log_date 
        ON usage_data (log_date)
    ''')
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    # Run this file directly to initialize the database
    init_db()
