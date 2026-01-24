import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../../data/database.db');

const db = new Database(dbPath);

console.log('🗄️  Создание новой базы данных...');

// Создание таблиц С НУЛЯ
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filesize INTEGER,
    mimetype TEXT,
    restaurant_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
  );

  CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    date TEXT NOT NULL,
    supplier TEXT NOT NULL,
    restaurant_id INTEGER,
    file_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    supplier TEXT NOT NULL,
    price_wholesale REAL NOT NULL,
    price_vatincluded REAL NOT NULL,
    sum_vatincluded REAL NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    restaurant_id INTEGER,
    file_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
  );

  CREATE INDEX idx_products_restaurant ON products(restaurant_id);
  CREATE INDEX idx_files_restaurant ON files(restaurant_id);
`);

console.log('✅ Таблицы созданы');

// Создаем админа
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
console.log('✅ Администратор создан (login: admin, password: admin123)');

// Создаем тестовый ресторан
db.prepare('INSERT INTO restaurants (name) VALUES (?)').run('Тестовый ресторан');
console.log('✅ Тестовый ресторан создан');

db.close();

console.log('✅ База данных готова!');
