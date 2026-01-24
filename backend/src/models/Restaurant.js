import db from '../config/database.js';

class Restaurant {
  // Создание ресторана
  static create({ name }) {
    try {
      const stmt = db.prepare(`
        INSERT INTO restaurants (name)
        VALUES (?)
      `);
      const result = stmt.run(name);
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания ресторана: ${error.message}`);
    }
  }

  // Получение всех ресторанов
  static getAll() {
    const stmt = db.prepare('SELECT * FROM restaurants ORDER BY created_at DESC');
    return stmt.all();
  }

  // Получение по ID
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM restaurants WHERE id = ?');
    return stmt.get(id);
  }

  // Обновление
  static update(id, { name }) {
    try {
      const stmt = db.prepare(`
        UPDATE restaurants 
        SET name = ?
        WHERE id = ?
      `);
      const result = stmt.run(name, id);
      
      if (result.changes === 0) {
        throw new Error('Ресторан не найден');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления ресторана: ${error.message}`);
    }
  }

  // Удаление
  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM restaurants WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Ресторан не найден');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Ошибка удаления ресторана: ${error.message}`);
    }
  }

  // Получение статистики по ресторану
  static getStats(id) {
    const productsCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE restaurant_id = ?').get(id);
    const invoicesCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE restaurant_id = ?').get(id);
    
    return {
      products: productsCount.count,
      invoices: invoicesCount.count
    };
  }
}

export default Restaurant;
