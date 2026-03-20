import os
import django
import sys

# Setup Django environment
backend_path = r"c:\Users\ktaruni\timesheet_project\timesheet_backend"
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timesheet_backend.settings')
django.setup()

from django.contrib.auth.models import User
from timesheet.models import UserProfile

print(f"{'Username':<20} | {'Email':<30} | {'Role':<10} | {'Department'}")
print("-" * 80)

users = User.objects.all()
for u in users:
    try:
        profile = UserProfile.objects.get(user=u)
        role = profile.role
        dept = profile.department or "N/A"
    except UserProfile.DoesNotExist:
        role = "No Profile"
        dept = "N/A"
    print(f"{u.username:<20} | {u.email:<30} | {role:<10} | {dept}")
