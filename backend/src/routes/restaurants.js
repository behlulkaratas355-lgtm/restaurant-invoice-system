import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить все рестораны (updated_at — дата последней загрузки файла по этому ресторану)
router.get('/', authenticateToken, (req, res) => {
  try {
    const restaurants = db.prepare(`
      SELECT r.*,
        (SELECT MAX(f.created_at) FROM files f WHERE f.restaurant_id = r.id) AS updated_at
      FROM restaurants r
      ORDER BY r.name
    `).all();
    res.json(restaurants);
  } catch (error) {
    console.error('Ошибка получения ресторанов:', error);
    res.status(500).json({ error: 'Ошибка получения ресторанов' });
  }
});

// Создать ресторан
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name || (typeof name === 'string' && !name.trim())) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const nameTrimmed = typeof name === 'string' ? name.trim() : String(name);

    let result;
    try {
      result = db.prepare(`
        INSERT INTO restaurants (name, address)
        VALUES (?, ?)
      `).run(nameTrimmed, address != null ? (address.trim ? address.trim() : address) : null);
    } catch (insertErr) {
      if (insertErr.message && insertErr.message.includes('no such column') && insertErr.message.includes('address')) {
        result = db.prepare(`INSERT INTO restaurants (name) VALUES (?)`).run(nameTrimmed);
      } else if (insertErr.code === 'SQLITE_CONSTRAINT' && insertErr.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Ресторан с таким названием уже существует' });
      } else {
        throw insertErr;
      }
    }

    res.status(201).json({
      id: result.lastInsertRowid,
      name: nameTrimmed,
      address: address != null ? address : null
    });
  } catch (error) {
    console.error('Ошибка создания ресторана:', error);
    res.status(500).json({
      error: 'Ошибка создания ресторана',
      message: error.message || undefined
    });
  }
});

// Обновить ресторан
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    if (!name || (typeof name === 'string' && !name.trim())) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const nameTrimmed = typeof name === 'string' ? name.trim() : String(name);

    try {
      db.prepare(`
        UPDATE restaurants
        SET name = ?, address = ?
        WHERE id = ?
      `).run(nameTrimmed, address != null ? address : null, id);
    } catch (updateErr) {
      if (updateErr.message && updateErr.message.includes('no such column') && updateErr.message.includes('address')) {
        db.prepare(`UPDATE restaurants SET name = ? WHERE id = ?`).run(nameTrimmed, id);
      } else if (updateErr.code === 'SQLITE_CONSTRAINT' && updateErr.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Ресторан с таким названием уже существует' });
      } else {
        throw updateErr;
      }
    }

    res.json({ message: 'Ресторан обновлён' });
  } catch (error) {
    console.error('Ошибка обновления ресторана:', error);
    res.status(500).json({
      error: 'Ошибка обновления ресторана',
      message: error.message || undefined
    });
  }
});

// Удалить ресторан
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM restaurants WHERE id = ?').run(id);
    res.json({ message: 'Ресторан удалён' });
  } catch (error) {
    console.error('Ошибка удаления ресторана:', error);
    res.status(500).json({ error: 'Ошибка удаления ресторана' });
  }
});

export default router;
