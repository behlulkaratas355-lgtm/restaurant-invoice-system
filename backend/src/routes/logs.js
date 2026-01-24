import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Только админы могут просматривать логи
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
};

// Получить логи с фильтрами
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { user_id, action, date_from, date_to, limit = 100 } = req.query;

    let query = `
      SELECT 
        l.id,
        l.action,
        l.details,
        l.created_at,
        u.login as user_login
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (user_id) {
      query += ` AND l.user_id = ?`;
      params.push(user_id);
    }

    if (action) {
      query += ` AND l.action LIKE ?`;
      params.push(`%${action}%`);
    }

    if (date_from) {
      query += ` AND l.created_at >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND l.created_at <= ?`;
      params.push(date_to);
    }

    query += ` ORDER BY l.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const logs = db.prepare(query).all(...params);

    // Парсим JSON details
    const logsWithParsedDetails = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    res.json(logsWithParsedDetails);
  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({ error: 'Ошибка получения логов' });
  }
});

// Статистика по логам
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        action,
        COUNT(*) as count
      FROM logs
      GROUP BY action
      ORDER BY count DESC
    `).all();

    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики логов:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

export default router;
