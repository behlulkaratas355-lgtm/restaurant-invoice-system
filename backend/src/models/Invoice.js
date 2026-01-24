import db from '../config/database.js';

class Invoice {
  // Создание накладной
  static create(data) {
    try {
      const stmt = db.prepare(`
        INSERT INTO invoices (number, date, supplier, restaurant_id, file_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        data.number,
        data.date,
        data.supplier,
        data.restaurant_id,
        data.file_id || null
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания накладной: ${error.message}`);
    }
  }

  // Получение всех накладных
  static getAll(filters = {}) {
    let query = `
      SELECT i.*, r.name as restaurant_name, f.filename
      FROM invoices i
      LEFT JOIN restaurants r ON i.restaurant_id = r.id
      LEFT JOIN files f ON i.file_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.restaurant_id) {
      query += ' AND i.restaurant_id = ?';
      params.push(filters.restaurant_id);
    }

    if (filters.supplier) {
      query += ' AND i.supplier LIKE ?';
      params.push(`%${filters.supplier}%`);
    }

    query += ' ORDER BY i.date DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // Получение по ID
  static findById(id) {
    const stmt = db.prepare(`
      SELECT i.*, r.name as restaurant_name, f.filename
      FROM invoices i
      LEFT JOIN restaurants r ON i.restaurant_id = r.id
      LEFT JOIN files f ON i.file_id = f.id
      WHERE i.id = ?
    `);
    return stmt.get(id);
  }

  // Обновление
  static update(id, data) {
    try {
      const stmt = db.prepare(`
        UPDATE invoices 
        SET number = ?, date = ?, supplier = ?, restaurant_id = ?, file_id = ?
        WHERE id = ?
      `);
      
      const result = stmt.run(
        data.number,
        data.date,
        data.supplier,
        data.restaurant_id,
        data.file_id || null,
        id
      );
      
      if (result.changes === 0) {
        throw new Error('Накладная не найдена');
      }
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Ошибка обновления накладной: ${error.message}`);
    }
  }

  // Удаление
  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Накладная не найдена');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Ошибка удаления накладной: ${error.message}`);
    }
  }

  // Получение продуктов по накладной
  static getProducts(id) {
    const invoice = this.findById(id);
    if (!invoice) return [];

    const stmt = db.prepare('SELECT * FROM products WHERE invoice_number = ?');
    return stmt.all(invoice.number);
  }
}

export default Invoice;
