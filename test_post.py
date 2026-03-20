import urllib.request
import urllib.error
import urllib.parse
import json

try:
    # 1. Login
    req_login = urllib.request.Request(
        'http://127.0.0.1:8000/api/token/',
        data=urllib.parse.urlencode({'username': 'admin', 'password': 'admin123'}).encode('utf-8'),
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    with urllib.request.urlopen(req_login) as f:
        token = json.loads(f.read().decode())['access']

    # 2. Get projects
    req_proj = urllib.request.Request('http://127.0.0.1:8000/api/projects/')
    req_proj.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req_proj) as f:
        projects = json.loads(f.read().decode())
    
    if not projects:
        print("NO PROJECTS")
        exit(1)
        
    project_id = projects[0]['id']

    # 3. Post Time Entry
    payload = json.dumps({
        'project': project_id,
        'date': '2026-03-18',
        'hours': 2.5,
        'task': 'Test Task',
        'notes': 'Some notes'
    }).encode('utf-8')
    
    req_post = urllib.request.Request(
        'http://127.0.0.1:8000/api/timeentries/',
        data=payload,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    with urllib.request.urlopen(req_post) as f:
        print("SUCCESS:", f.read().decode())

except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    try:
        print("RESPONSE:", e.read().decode())
    except:
        pass
except Exception as e:
    print("ERROR:", str(e))
