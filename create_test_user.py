import os
import sys

backend_path = r"c:\Users\ktaruni\timesheet_project\timesheet_backend"
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timesheet_backend.settings')

import django
django.setup()

from django.contrib.auth.models import User
from timesheet.models import UserProfile

user, created = User.objects.get_or_create(username="testemployee", email="test@test.com")
user.set_password("TestPassword123!")
user.save()

profile, created = UserProfile.objects.get_or_create(user=user)
profile.role = "Employee"
profile.save()

print("Local test user 'testemployee' / 'TestPassword123!' created.")
