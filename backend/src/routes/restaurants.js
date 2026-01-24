import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить все рестораны
router.get('/', authenticateToken, (req, res) => {
  try {
    const restaurants = db.prepare('SELECT * FROM restaurants ORDER BY name').all();
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

    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const result = db.prepare(`
      INSERT INTO restaurants (name, address)
      VALUES (?, ?)
    `).run(name, address || null);

    res.status(201).json({
      id: result.lastInsertRowid,
      name,
      address
    });
  } catch (error) {
    console.error('Ошибка создания ресторана:', error);
    res.status(500).json({ error: 'Ошибка создания ресторана' });
  }
});

// Обновить ресторан
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    db.prepare(`
      UPDATE restaurants
      SET name = ?, address = ?
      WHERE id = ?
    `).run(name, address || null, id);

    res.json({ message: 'Ресторан обновлён' });
  } catch (error) {
    console.error('Ошибка обновления ресторана:', error);
    res.status(500).json({ error: 'Ошибка обновления ресторана' });
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
