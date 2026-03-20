import re

path = r'c:\Users\ktaruni\timesheet_project\timesheet_backend\timesheet\serializers.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update ClientSerializer
content = re.sub(
    r'class ClientSerializer\(serializers\.ModelSerializer\):\s*class Meta:\s*model = Client\s*fields = \["id", "name"\]',
    'class ClientSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = Client\n        fields = "__all__"',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated serializers.py")
