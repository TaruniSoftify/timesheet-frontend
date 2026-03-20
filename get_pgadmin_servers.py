import sqlite3
import os

pgadmin_db = os.path.expanduser('~\\AppData\\Roaming\\pgadmin\\pgadmin4.db')

if os.path.exists(pgadmin_db):
    try:
        conn = sqlite3.connect(pgadmin_db)
        cursor = conn.cursor()
        cursor.execute("SELECT name, host, port, username FROM server")
        for row in cursor.fetchall():
            print(f"pgAdmin connection found: {row}")
    except Exception as e:
        print("Error reading pgAdmin database:", e)
else:
    print("No pgadmin db found at", pgadmin_db)
