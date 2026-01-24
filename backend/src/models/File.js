import db from '../config/database.js';

class File {
  // Создание записи файла
  static create(data) {
    try {
      const stmt = db.prepare(`
        INSERT INTO files (filename, filepath, filesize, mimetype, restaurant_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        data.filename,
        data.filepath,
        data.filesize,
        data.mimetype,
        data.restaurant_id
      );
      
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      throw new Error(`Ошибка создания файла: ${error.message}`);
    }
  }

  // Получение всех файлов
  static getAll(filters = {}) {
    let query = `
      SELECT f.*, r.name as restaurant_name 
      FROM files f
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.restaurant_id) {
      query += ' AND f.restaurant_id = ?';
      params.push(filters.restaurant_id);
    }

    query += ' ORDER BY f.created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // Получение по ID
  static findById(id) {
    const stmt = db.prepare(`
      SELECT f.*, r.name as restaurant_name 
      FROM files f
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      WHERE f.id = ?
    `);
    return stmt.get(id);
  }

  // Удаление
  static delete(id) {
    try {
      const stmt = db.prepare('DELETE FROM files WHERE id = ?');
      const result = stmt.run(id);
      
      if (result.changes === 0) {
        throw new Error('Файл не найден');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Ошибка удаления файла: ${error.message}`);
    }
  }
}

export default File;
