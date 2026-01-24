import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../data/database.db');

const db = new Database(dbPath);

console.log('🔄 Начало инициализации базы данных...');

// УДАЛЯЕМ ВСЕ СТАРЫЕ ТАБЛИЦЫ
db.exec(`
  DROP TABLE IF EXISTS logs;
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS invoices;
  DROP TABLE IF EXISTS files;
  DROP TABLE IF EXISTS restaurants;
  DROP TABLE IF EXISTS users;
`);

console.log('✅ Старые таблицы удалены');

// Создание новых таблиц с правильной структурой
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

  CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    ip_address TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX idx_products_restaurant ON products(restaurant_id);
  CREATE INDEX idx_products_invoice ON products(invoice_number);
  CREATE INDEX idx_products_supplier ON products(supplier);
  CREATE INDEX idx_invoices_restaurant ON invoices(restaurant_id);
  CREATE INDEX idx_files_restaurant ON files(restaurant_id);
  CREATE INDEX idx_logs_user ON logs(user_id);
`);

console.log('✅ Новые таблицы созданы');

// Создаем администратора
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.prepare('INSERT INTO users (login, password_hash, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
console.log('✅ Администратор создан');

// Создаем тестовый ресторан
db.prepare('INSERT INTO restaurants (name) VALUES (?)').run('Тестовый ресторан');
console.log('✅ Тестовый ресторан создан');

console.log('✅ База данных успешно инициализирована');
console.log('📂 Путь к БД:', dbPath);

// Статистика
const stats = {
  users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
  restaurants: db.prepare('SELECT COUNT(*) as count FROM restaurants').get().count,
  files: db.prepare('SELECT COUNT(*) as count FROM files').get().count,
  invoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
  products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
  logs: db.prepare('SELECT COUNT(*) as count FROM logs').get().count,
};

console.log('\n📊 Статистика базы данных:');
console.log('   users:', stats.users, 'записей');
console.log('   restaurants:', stats.restaurants, 'записей');
console.log('   files:', stats.files, 'записей');
console.log('   invoices:', stats.invoices, 'записей');
console.log('   products:', stats.products, 'записей');
console.log('   logs:', stats.logs, 'записей');

db.close();
