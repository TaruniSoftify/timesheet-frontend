import os
import django
import sys

# Setup Django environment
backend_path = r"c:\Users\ktaruni\timesheet_project\timesheet_backend"
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timesheet_backend.settings')
django.setup()

from django.db import connection

def check_and_fix_db():
    with connection.cursor() as cursor:
        try:
            cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='timesheet_timecard';")
            columns = [row[0] for row in cursor.fetchall()]
            
            if "created_at" not in columns:
                print("created_at column is missing in timecard! Fixing it...")
                cursor.execute("ALTER TABLE timesheet_timecard ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;")
                print("Column created_at added.")

            if "user_id" in columns:
                print("Dropping legacy user_id column...")
                cursor.execute("ALTER TABLE timesheet_timecard DROP COLUMN IF EXISTS user_id CASCADE;")
                print("Dropped user_id successfully.")
            
            cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name='timesheet_timeentry';")
            columns = [row[0] for row in cursor.fetchall()]
            print("Columns in timesheet_timeentry:", columns)

            if "employee_id" not in columns:
                print("employee_id column is missing in timeentry! Fixing it...")
                cursor.execute("ALTER TABLE timesheet_timeentry ADD COLUMN employee_id INTEGER NULL REFERENCES auth_user(id) ON DELETE CASCADE;")
                print("Column employee_id added to timeentry successfully.")
            
            if "user_id" in columns:
                cursor.execute("UPDATE timesheet_timeentry SET employee_id = user_id WHERE user_id IS NOT NULL;")
                
            cursor.execute("UPDATE timesheet_timecard SET employee_id = user_id WHERE user_id IS NOT NULL;")
        except Exception as e:
            print("Error checking/fixing DB:", e)

if __name__ == "__main__":
    check_and_fix_db()
