import db from '../config/database.js';

export const logAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    const log = (statusCode) => {
      if (statusCode >= 200 && statusCode < 400) {
        try {
          const userId = req.user?.id || null;
          const details = JSON.stringify({
            method: req.method,
            path: req.path,
            body: req.body,
            params: req.params,
            query: req.query
          });

          db.prepare(`
            INSERT INTO logs (user_id, action, details)
            VALUES (?, ?, ?)
          `).run(userId, action, details);

          console.log(`📝 LOG: ${action} by user ${userId}`);
        } catch (err) {
          console.error('Ошибка логирования:', err);
        }
      }
    };

    res.send = function (data) {
      log(res.statusCode);
      originalSend.call(this, data);
    };

    res.json = function (data) {
      log(res.statusCode);
      originalJson.call(this, data);
    };

    next();
  };
};
