import hashlib, re, os
from bs4 import BeautifulSoup
from datetime import datetime
import sqlite3

def clean_num(text): return float(re.sub(r'[^\d., ]', '', text).replace(',', '.').replace(' ', '') or 0)

def load_file(filename):
    if not os.path.exists(filename): return print(f"❌ Нет {filename}")
    
    with open(filename, 'r', encoding='utf-8-sig') as f: html = f.read()
    md5 = hashlib.md5(html.encode()).hexdigest()
    station = os.path.splitext(os.path.basename(filename))[0]
    period = re.search(r'c\s+(\d{2}\.\d{2}\.\d{4}.*?\d{2}\.\d{2}\.\d{4})', html)
    period = period.group(1) if period else '?'
    
    conn = sqlite3.connect('reports.db')
    c = conn.cursor()
    
    # Проверка дубля
    c.execute("SELECT id FROM reports WHERE md5_hash=?", (md5,))
    if c.fetchone(): return print(f"✅ {filename} уже есть")
    
    # Сохраняем HTML
    c.execute("INSERT INTO reports(filename,station,period,raw_html,md5_hash) VALUES(?,?,?,?,?)",
              (filename, station, period, html, md5))
    report_id = c.lastrowid
    print(f"📄 {filename} → ID={report_id}")
    
    # Парсинг
    soup = BeautifulSoup(html, 'lxml')
    tables = soup.find_all('table')
    total = 0
    
    for page, table in enumerate(tables, 1):
        rows = table.find_all('tr', attrs={'height': True})
        for rnum, row in enumerate(rows, 1):
            tds = row.find_all('td', class_=lambda x: x and 's2' in x)
            if len(tds) < 5: continue
            
            nakl = tds[0].get_text(strip=True) if tds[0].get('colspan') else ''
            kod = tds[-5].get_text(strip=True) if len(tds)>7 else ''
            kolvo_txt = tds[2].get_text() if len(tds)>2 else ''
            cena_txt = tds[3].get_text() if len(tds)>3 else ''
            date_txt = tds[-1].get_text(strip=True)
            
            kolvo = clean_num(kolvo_txt)
            cena = clean_num(cena_txt)
            date = datetime.strptime(date_txt, '%d.%m.%Y').date() if re.match(r'\d{2}\.\d{2}\.\d{4}', date_txt) else None
            
            c.execute("""INSERT INTO lines(report_id,page_num,row_order,nakladnaya,kod_tovara,kolvo,cena,data_postavki)
                         VALUES(?,?,?,?,?,?,?,?)""", (report_id, page, rnum, nakl, kod, kolvo, cena, date))
            total += 1
    
    conn.commit()
    conn.close()
    print(f"✅ Загружено {total} строк из {filename}")

# ← ЗАГРУЗИ СВОИ ФАЙЛЫ ЗДЕСЬ
load_file('bauman.txt')
load_file('Kalanchevskaia.txt')
load_file('RptGsByCorrs0_Default.txt')
