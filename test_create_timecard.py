import os
import django
import sys
from datetime import date

# Setup Django environment
backend_path = r"c:\Users\ktaruni\timesheet_project\timesheet_backend"
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timesheet_backend.settings')
django.setup()

from django.contrib.auth.models import User
from timesheet.models import TimeCard

def test_create():
    try:
        user = User.objects.first()
        if not user:
            print("No users found")
            return
            
        tc = TimeCard.objects.create(
            employee=user,
            period_start=date(2026, 3, 1),
            period_end=date(2026, 3, 7)
        )
        print("Success! Created TimeCard ID:", tc.id)
        tc.delete()
        print("Test deleted successfully.")
    except Exception as e:
        print("FAILED TO CREATE TIMECARD:")
        print(type(e).__name__, str(e))

if __name__ == "__main__":
    test_create()
