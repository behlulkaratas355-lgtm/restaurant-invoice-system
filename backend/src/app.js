import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация приложения
const app = express();

// ======================
// CORS Configuration
// ======================
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://45.144.176.150:3000',
    'http://45.144.176.150',
    'http://193.42.125.150:3000',
    // Добавьте ваш домен при наличии
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight requests

// ======================
// Body Parsing Middleware
// ======================
app.use(express.json({ 
  limit: '10mb', // Увеличено для загрузки файлов
  verify: (req, res, buf) => {
    req.rawBody = buf; // Сохраняем сырые данные для некоторых случаев
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// ======================
// File Upload Configuration
// ======================
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50MB
  }
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ======================
// Request Logging Middleware
// ======================
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url, headers, body } = req;
  
  console.log(`🕒 [${new Date().toISOString()}] ${method} ${url}`);
  console.log(`📦 Headers: ${JSON.stringify(headers, null, 2)}`);
  
  // Логируем тело запроса только для небольших данных
  if (Buffer.byteLength(JSON.stringify(body)) < 1024) {
    console.log(`📦 Body: ${JSON.stringify(body, null, 2)}`);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ [${new Date().toISOString()}] ${method} ${url} ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// ======================
// Route Imports with Error Handling
// ======================
const loadRoute = (routePath) => {
  try {
    return import(routePath);
  } catch (error) {
    console.error(`❌ Ошибка загрузки маршрута ${routePath}:`, error.message);
    return {
      default: express.Router().all('*', (req, res) => {
        res.status(501).json({ 
          error: `Route not implemented: ${routePath}`,
          message: 'This endpoint is under development'
        });
      })
    };
  }
};

// Load routes with fallbacks
const authRoutes = (await loadRoute('./routes/auth.js')).default;
const restaurantRoutes = (await loadRoute('./routes/restaurants.js')).default;
const uploadRoutes = (await loadRoute('./routes/upload.js')).default;
const analyticsRoutes = (await loadRoute('./routes/analytics.js')).default;
const statsRoutes = (await loadRoute('./routes/stats.js')).default;
const productsRoutes = (await loadRoute('./routes/products.js')).default;
const usersRoutes = (await loadRoute('./routes/users.js')).default;
const logsRoutes = (await loadRoute('./routes/logs.js')).default;
const anomaliesRoutes = (await loadRoute('./routes/anomalies.js')).default;

// ======================
// API Routes
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/anomalies', anomaliesRoutes);

// ======================
// Health Check Endpoint
// ======================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    jwt_secret: process.env.JWT_SECRET ? '***HIDDEN***' : '❌ NOT SET',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ======================
// 404 Handler
// ======================
app.use((req, res) => {
  console.warn(`🚨 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      '/api/auth',
      '/api/restaurants', 
      '/api/upload',
      '/api/analytics',
      '/api/stats',
      '/api/products',
      '/api/users',
      '/api/logs',
      '/api/anomalies',
      '/health'
    ]
  });
});

// ======================
// Global Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error('💥 GLOBAL ERROR HANDLER:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    status: err.status || 500,
    path: req.originalUrl,
    method: req.method
  });

  // Ошибки валидации
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    });
  }

  // Ошибки аутентификации
  if (err.name === 'UnauthorizedError' || err.message.includes('invalid token')) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Please log in again'
    });
  }

  // Ошибки авторизации
  if (err.message.includes('forbidden') || err.message.includes('permission')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  }

  // Ошибка загрузки файла
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      max_size: '50MB',
      message: 'File size exceeds the 50MB limit'
    });
  }

  // Стандартная ошибка сервера
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
