import os
import sys

# Set live Neon database
os.environ['DATABASE_URL'] = 'postgresql://karrataruni_db_user:qIw9VgXkkpmmRhuR@ep-muddy-sun-a5stf488.us-east-2.aws.neon.tech/timesheet_db?sslmode=require'

backend_path = r"c:\Users\ktaruni\timesheet_project\timesheet_backend"
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timesheet_backend.settings')

import django
django.setup()

from django.contrib.auth.models import User

# Find any superuser and reset password
admin_user = User.objects.filter(is_superuser=True).first()
if admin_user:
    admin_user.set_password('Admin123!')
    admin_user.save()
    print(f"Password for {admin_user.username} successfully reset to Admin123!")
else:
    print("No superuser found on the live database!")
