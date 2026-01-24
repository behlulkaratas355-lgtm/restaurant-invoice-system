import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import jwtConfig from '../config/jwt.js';
import db from '../config/database.js';

// Хранилище отозванных токенов (в продакшене использовать Redis)
const tokenBlacklist = new Set();

// Генерация JWT токена
const generateToken = (user, expiresIn = jwtConfig.expiresIn) => {
  const payload = {
    id: user.id,
    login: user.login,
    role: user.role
  };

  return jwt.sign(payload, jwtConfig.secret, { expiresIn });
};

// Логирование действий
const logAction = (userId, action, ipAddress, details = null) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO logs (user_id, action, ip_address, details)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, action, ipAddress, details);
  } catch (error) {
    console.error('Ошибка логирования:', error);
  }
};

// Регистрация нового пользователя
export const register = async (req, res) => {
  try {
    const { login, password, role } = req.body;

    // Валидация
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Логин и пароль обязательны'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Создание пользователя
    const user = await User.create({ login, password, role: role || 'user' });
    const safeUser = User.getSafeUser(user);

    // Генерация токенов
    const token = generateToken(user);
    const refreshToken = generateToken(user, jwtConfig.refreshExpiresIn);

    // Логирование
    logAction(user.id, 'register', req.ip, `Новый пользователь: ${login}`);

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      data: {
        user: safeUser,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Вход в систему
export const login = async (req, res) => {
  try {
    const { login, password } = req.body;

    // Валидация
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Логин и пароль обязательны'
      });
    }

    // Поиск пользователя
    const user = User.findByLogin(login);
    if (!user) {
      logAction(null, 'login_failed', req.ip, `Попытка входа: ${login}`);
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль'
      });
    }

    // Проверка пароля
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      logAction(user.id, 'login_failed', req.ip, 'Неверный пароль');
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль'
      });
    }

    // Генерация токенов
    const token = generateToken(user);
    const refreshToken = generateToken(user, jwtConfig.refreshExpiresIn);

    const safeUser = User.getSafeUser(user);

    // Логирование успешного входа
    logAction(user.id, 'login_success', req.ip, null);

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user: safeUser,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
};

// Выход из системы
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      tokenBlacklist.add(token);
      logAction(req.user.id, 'logout', req.ip, null);
    }

    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при выходе'
    });
  }
};

// Обновление токена
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token обязателен'
      });
    }

    // Проверка токена в blacklist
    if (tokenBlacklist.has(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Токен отозван'
      });
    }

    // Верификация токена
    const decoded = jwt.verify(refreshToken, jwtConfig.secret);

    // Получение пользователя
    const user = User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Генерация новых токенов
    const newToken = generateToken(user);
    const newRefreshToken = generateToken(user, jwtConfig.refreshExpiresIn);

    // Добавление старого токена в blacklist
    tokenBlacklist.add(refreshToken);

    logAction(user.id, 'token_refresh', req.ip, null);

    res.json({
      success: true,
      message: 'Токен обновлен',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    res.status(401).json({
      success: false,
      message: 'Недействительный refresh token'
    });
  }
};

// Получение текущего пользователя
export const getCurrentUser = async (req, res) => {
  try {
    const user = User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const safeUser = User.getSafeUser(user);

    res.json({
      success: true,
      data: { user: safeUser }
    });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// Экспорт blacklist для middleware
export { tokenBlacklist };
