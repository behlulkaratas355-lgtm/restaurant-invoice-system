-- Таблица пользователей для админки
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ресторанов/точек
CREATE TABLE IF NOT EXISTS restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица поставщиков
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  restaurant_id INTEGER,
  supplier_id INTEGER,
  quantity REAL,
  price_wholesale REAL,
  price_vatincluded REAL,
  sum_vatincluded REAL,
  invoice_type TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Создаём индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_date ON products(invoice_date);
CREATE INDEX IF NOT EXISTS idx_products_restaurant ON products(restaurant_id);

-- Добавляем администратора по умолчанию
-- Пароль: admin123 (хэш для bcrypt с 10 раундами)
INSERT OR IGNORE INTO users (username, password, role) 
VALUES ('admin', '$2b$10$rJZqGvh8qV4YvD5xKJ1j3.EKPxqH5vN7Q1ZKxGBr3zXyN7pQJFPXO', 'admin');

-- Добавляем тестового пользователя
-- Пароль: user123
INSERT OR IGNORE INTO users (username, password, role) 
VALUES ('user', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL2Spn2i', 'user');
