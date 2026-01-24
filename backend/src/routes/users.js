import express from 'express';
import bcrypt from 'bcrypt';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAction } from '../middleware/auditLog.js';

const router = express.Router();

// Только админы могут управлять пользователями
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора.' });
  }
  next();
};

// Получить всех пользователей
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, login, role, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Создать пользователя
router.post('/', authenticateToken, requireAdmin, logAction('CREATE_USER'), async (req, res) => {
  try {
    const { login, password, role } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Роль должна быть admin или user' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE login = ?').get(login);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (login, password_hash, role)
      VALUES (?, ?, ?)
    `).run(login, hashedPassword, role);

    res.status(201).json({
      id: result.lastInsertRowid,
      login,
      role
    });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
});

// Изменить роль пользователя
router.patch('/:id/role', authenticateToken, requireAdmin, logAction('CHANGE_USER_ROLE'), (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Роль должна быть admin или user' });
    }

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Нельзя изменить свою собственную роль' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);

    res.json({ message: 'Роль пользователя изменена' });
  } catch (error) {
    console.error('Ошибка изменения роли:', error);
    res.status(500).json({ error: 'Ошибка изменения роли' });
  }
});

// Изменить пароль пользователя
router.patch('/:id/password', authenticateToken, requireAdmin, logAction('CHANGE_USER_PASSWORD'), async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashedPassword, id);

    res.json({ message: 'Пароль изменён' });
  } catch (error) {
    console.error('Ошибка изменения пароля:', error);
    res.status(500).json({ error: 'Ошибка изменения пароля' });
  }
});

// Удалить пользователя
router.delete('/:id', authenticateToken, requireAdmin, logAction('DELETE_USER'), (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Нельзя удалить свой собственный аккаунт' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({ message: 'Пользователь удалён' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

export default router;
