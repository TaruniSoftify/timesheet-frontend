import re

path = r'c:\Users\ktaruni\timesheet_project\timesheet_backend\timesheet\models.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Client model
if 'is_active = models.BooleanField(default=True)' not in content.split('class Project(models.Model):')[0]:
    content = re.sub(
        r'(class Client\(models\.Model\):.*?name = models\.CharField\(max_length=100\))',
        r'\1\n    is_active = models.BooleanField(default=True)',
        content,
        flags=re.DOTALL
    )

# Project model
if 'is_active = models.BooleanField(default=True)' not in content.split('class Project(models.Model):')[1]:
    content = re.sub(
        r'(class Project\(models\.Model\):.*?compliance_rules = models\.TextField\(blank=True\))',
        r'\1\n    is_active = models.BooleanField(default=True)',
        content,
        flags=re.DOTALL
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated models.py")
