import db from '../config/database.js';

class Product {
  // Создание продукта
  static create(data) {
    try {
      const stmt = db.prepare(`
        INSERT INTO products (
          name, category, supplier, price_wholesale, price_vatincluded,
          sum_vatincluded, invoice_number, invoice_date, restaurant_id, file_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        data.name,
        data.category || null,
        data.supplier,
        data.price_wholesale,
        data.price_vatincluded,
        data.sum_vatincluded,
        data.invoice_number,
        data.invoice_date,
        data.restaurant_id,
        data.file_id || null
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания продукта: ${error.message}`);
    }
  }

  // Получение всех продуктов с фильтрацией
  static getAll(filters = {}) {
    let query = `
      SELECT p.*, r.name as restaurant_name 
      FROM products p
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.restaurant_id) {
      query += ' AND p.restaurant_id = ?';
      params.push(filters.restaurant_id);
    }

    if (filters.supplier) {
      query += ' AND p.supplier LIKE ?';
      params.push(`%${filters.supplier}%`);
    }

    if (filters.category) {
      query += ' AND p.category = ?';
      params.push(filters.category);
    }

    if (filters.invoice_number) {
      query += ' AND p.invoice_number = ?';
      params.push(filters.invoice_number);
    }

    query += ' ORDER BY p.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // Получение по ID
  static findById(id) {
    const stmt = db.prepare(`
      SELECT p.*, r.name as restaurant_name 
      FROM products p
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  }

  // Обновление
  static update(id, data) {
    try {
      const stmt = db.prepare(`
        UPDATE products 
        SET name = ?, category = ?, supplier = ?, 
            price_wholesale = ?, price_vatincluded = ?, sum_vatincluded = ?,
            invoice_number = ?, invoice_date = ?, restaurant_id = ?, file_id = ?
        WHERE id = ?
      `);
      
      const result = stmt.run(
        data.name,
        data.category || null,
        data.supplier,
        data.price_wholesale,
        data.price_vatincluded,
        data.sum_vatincluded,
        data.invoice_number,
        data.invoice_date,
        data.restaurant_id,
        data.file_id || null,
        id
      );
      
      if (result.changes === 0) {
        throw new Error('Продукт не найден');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления продукта: ${error.message}`);
    }
  }

  // Удаление
  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM products WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Продукт не найден');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Ошибка удаления продукта: ${error.message}`);
    }
  }

  // Получение уникальных категорий
  static getCategories() {
    const stmt = db.prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
    return stmt.all().map(row => row.category);
  }

  // Получение уникальных поставщиков
  static getSuppliers() {
    const stmt = db.prepare('SELECT DISTINCT supplier FROM products ORDER BY supplier');
    return stmt.all().map(row => row.supplier);
  }
}

export default Product;
