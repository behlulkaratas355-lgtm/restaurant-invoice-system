// Middleware для проверки ролей пользователя
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для выполнения этого действия'
      });
    }

    next();
  };
};

// Проверка только для администраторов
export const adminOnly = checkRole('admin');

// Проверка для администраторов и менеджеров
export const managerOrAdmin = checkRole('admin', 'manager');

export default checkRole;
