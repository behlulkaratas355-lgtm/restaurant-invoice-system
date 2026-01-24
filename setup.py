import sqlite3
print("🔨 Создаю БД SQLite...")
conn = sqlite3.connect('reports.db')
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT UNIQUE, station TEXT,
    period TEXT, upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_html TEXT, md5_hash TEXT UNIQUE)''')
c.execute('''CREATE TABLE IF NOT EXISTS lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT, report_id INTEGER, page_num INTEGER,
    row_order INTEGER, nakladnaya TEXT, kod_tovara TEXT, kolvo REAL, cena REAL,
    data_postavki TEXT, raw_row TEXT)''')
c.execute('CREATE INDEX IF NOT EXISTS idx_nakl ON lines(nakladnaya)')
c.execute('CREATE INDEX IF NOT EXISTS idx_kod ON lines(kod_tovara)')
conn.commit()
conn.close()
print("✅ БД готова: reports.db")
