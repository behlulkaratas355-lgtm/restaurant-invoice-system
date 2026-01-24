import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import { tokenBlacklist } from '../controllers/authController.js';

export const authenticate = (req, res, next) => {
  try {
    // Получение токена из заголовка
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const token = authHeader.split(' ')[1];

    // Проверка токена в blacklist
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Токен отозван'
      });
    }

    // Верификация токена
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Добавление данных пользователя в запрос
    req.user = {
      id: decoded.id,
      login: decoded.login,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен истек'
      });
    }

    console.error('Ошибка аутентификации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при аутентификации'
    });
  }
};

export default authenticate;
