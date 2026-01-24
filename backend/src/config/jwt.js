import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'jklgmHG7QjEni0KoXHSjuU1HfYFMmPqS',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Проверка наличия секретного ключа
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('⚠️  WARNING: JWT_SECRET not set in production!');
  process.exit(1);
}

export default jwtConfig;
