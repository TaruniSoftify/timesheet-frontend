import os
import django
import sys

# Setup Django environment
backend_path = r"c:\Users\ktaruni\timesheet_project\timesheet_backend"
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timesheet_backend.settings')
django.setup()

from django.contrib.auth.models import User
from timesheet.models import TimeCard, TimeEntry, Approval, Notification

def run_test():
    # 1. Provide an admin user
    try:
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            print("No admin user found")
            return
            
        print(f"Testing delete for user: {admin_user.username} (ID: {admin_user.id})")
        
        # 2. Try to actually delete it to capture the ProtectedError
        try:
            admin_user.delete()
            print("Deletion succeeded?")
            import transaction
            transaction.rollback() # Don't really delete it yet
        except Exception as e:
            print(f"DELETION FAILED WITH:")
            print(f"{type(e).__name__}: {str(e)}")
            
    except Exception as e:
        print(f"Script error: {e}")

if __name__ == "__main__":
    run_test()
