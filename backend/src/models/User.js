import bcrypt from 'bcrypt';
import db from '../config/database.js';

const SALT_ROUNDS = 10;

class User {
  // Создание нового пользователя
  static async create({ login, password, role = 'user' }) {
    try {
      // Проверка существования пользователя
      const existingUser = this.findByLogin(login);
      if (existingUser) {
        throw new Error('Пользователь с таким логином уже существует');
      }

      // Хеширование пароля
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      // Вставка в БД
      const stmt = db.prepare(`
        INSERT INTO users (login, password_hash, role)
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(login, password_hash, role);

      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания пользователя: ${error.message}`);
    }
  }

  // Поиск пользователя по логину
  static findByLogin(login) {
    const stmt = db.prepare('SELECT * FROM users WHERE login = ?');
    return stmt.get(login);
  }

  // Поиск пользователя по ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  // Проверка пароля
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Обновление пароля
  static async updatePassword(userId, newPassword) {
    try {
      const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      const stmt = db.prepare(`
        UPDATE users 
        SET password_hash = ? 
        WHERE id = ?
      `);

      const result = stmt.run(password_hash, userId);

      if (result.changes === 0) {
        throw new Error('Пользователь не найден');
      }

      return true;
    } catch (error) {
      throw new Error(`Ошибка обновления пароля: ${error.message}`);
    }
  }

  // Удаление пользователя
  static delete(userId) {
    try {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      const result = stmt.run(userId);

      if (result.changes === 0) {
        throw new Error('Пользователь не найден');
      }

      return true;
    } catch (error) {
      throw new Error(`Ошибка удаления пользователя: ${error.message}`);
    }
  }

  // Получение всех пользователей (без паролей)
  static getAll() {
    const stmt = db.prepare('SELECT id, login, role, created_at FROM users');
    return stmt.all();
  }

  // Получение пользователя без пароля
  static getSafeUser(user) {
    if (!user) return null;
    
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}

export default User;
