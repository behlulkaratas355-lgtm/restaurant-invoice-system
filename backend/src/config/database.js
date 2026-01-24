import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/database.db');

// Создание директории data, если не существует
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Создание подключения к БД
const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : null,
  fileMustExist: false 
});

// Включение WAL режима для повышения производительности
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Функция для выполнения запросов с подготовкой
export const prepare = (sql) => db.prepare(sql);

// Функция для выполнения транзакций
export const transaction = (fn) => db.transaction(fn);

// Graceful shutdown
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

export default db;
