import sqlite3
conn = sqlite3.connect('reports.db')
c = conn.cursor()
print("Строк:", c.execute("SELECT COUNT(*) FROM lines").fetchone()[0])
print("Отчётов:", c.execute("SELECT COUNT(*) FROM reports").fetchone()[0])
for row in c.execute("SELECT * FROM lines WHERE nakladnaya LIKE '%13617%' LIMIT 3").fetchall():
    print(row)
conn.close()
