import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить общую статистику
router.get('/', authenticateToken, (req, res) => {
  try {
    const stats = {
      restaurants: db.prepare('SELECT COUNT(*) as count FROM restaurants').get().count,
      products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
      suppliers: db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count,
      invoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count
    };

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

export default router;
