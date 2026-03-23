import os
import sys

backend_path = r"c:\Users\ktaruni\timesheet_project\timesheet_backend"
sys.path.append(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'timesheet_backend.settings')

import django
django.setup()

from timesheet.models import TimeEntry
import json

entries = list(TimeEntry.objects.all().values('id', 'project', 'project_id', 'task', 'notes', 'date', 'hours')[:3])
print(json.dumps(entries, default=str, indent=2))
