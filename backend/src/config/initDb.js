import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/database.db');

console.log('🔄 Начало инициализации базы данных...');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const dropTables = () => {
  db.exec(`
    DROP TABLE IF EXISTS invoice_products;
    DROP TABLE IF EXISTS invoices;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS suppliers;
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS restaurants;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS logs;
  `);
  console.log('✅ Старые таблицы удалены');
};

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filesize INTEGER,
      restaurant_id INTEGER,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      inn TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT,
      invoice_date DATE,
      delivery_date DATE,
      supplier_id INTEGER,
      restaurant_id INTEGER,
      file_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL,
      FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoice_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_restaurant ON invoices(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_products_invoice ON invoice_products(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_products_product ON invoice_products(product_id);
  `);
  console.log('✅ Новые таблицы созданы');
};

const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    db.prepare(`
      INSERT OR IGNORE INTO users (login, password_hash, role)
      VALUES (?, ?, ?)
    `).run('admin', hashedPassword, 'admin');
    console.log('✅ Администратор создан');
  } catch (error) {
    console.error('❌ Ошибка создания администратора:', error);
  }
};

const createDefaultRestaurant = () => {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO restaurants (id, name, address)
      VALUES (1, 'Основной склад', 'Москва')
    `).run();
    console.log('✅ Дефолтный ресторан создан');
  } catch (error) {
    console.error('❌ Ошибка создания ресторана:', error);
  }
};

const printStats = () => {
  const tables = ['users', 'restaurants', 'files', 'invoices', 'products', 'logs'];
  console.log('\n📊 Статистика базы данных:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
    console.log(`   ${table}: ${count} записей`);
  });
  console.log('');
};

const init = async () => {
  try {
    dropTables();
    createTables();
    await createAdmin();
    createDefaultRestaurant();
    console.log('✅ База данных успешно инициализирована');
    console.log(`📂 Путь к БД: ${dbPath}`);
    printStats();
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
    process.exit(1);
  }
};

init();
