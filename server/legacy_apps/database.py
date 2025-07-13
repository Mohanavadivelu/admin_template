"""
Database connection and initialization logic for legacy_apps.
Now uses the unified application_statistics.db.
"""
from server.database.database import get_db_path, get_db_connection, init_db as unified_init_db

# This file now primarily serves as a wrapper or can be removed if direct imports are preferred.
# For now, we'll keep it to redirect to the unified database functions.

def get_legacy_apps_db_path():
    """Return the path to the unified application_statistics.db file."""
    return get_db_path()

def get_legacy_apps_db_connection():
    """Create and return a new SQLite connection to the unified application_statistics.db file."""
    return get_db_connection()

def init_legacy_apps_db():
    """Initialize the legacy_apps_list table within the unified database."""
    unified_init_db()

if __name__ == "__main__":
    # Run this file directly to initialize the database (will call unified init)
    init_legacy_apps_db()
