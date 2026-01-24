import multer from 'multer';
import path from 'path';

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  // Разрешаем только HTML файлы
  if (file.mimetype === 'text/html' || path.extname(file.originalname).toLowerCase() === '.html') {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только HTML файлы'), false);
  }
};

// Конфигурация multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

export default upload;
