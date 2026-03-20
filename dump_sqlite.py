import os
import sys

# Adding backend path so Django can be imported
sys.path.append(r"C:\Users\ktaruni\timesheet_project\timesheet_backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "timesheet_backend.settings")

import django
django.setup()

from django.core.management import call_command
from django.conf import settings

# Override database back to sqlite to read old data
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': settings.BASE_DIR / 'db.sqlite3',
}

datadump_path = os.path.join(settings.BASE_DIR, 'datadump.json')
try:
    with open(datadump_path, 'w', encoding='utf-8') as f:
        # Dump User and all timesheet models
        call_command('dumpdata', 'auth.User', 'timesheet', indent=2, stdout=f)
    print(f"Data perfectly exported to {datadump_path}")
except Exception as e:
    print("Dump failed:", e)
