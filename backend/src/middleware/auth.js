import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'Z0TnuzeweCcIT2G16xLhcX9Gd5wGog7H';
console.log('🔥 JWT_SECRET LOADED:', JWT_SECRET.substring(0, 5) + '...'); 

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};
