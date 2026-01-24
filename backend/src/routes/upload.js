import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { parseInvoiceHTML } from '../utils/htmlParser.js';
import { logAction } from '../middleware/auditLog.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), '../../uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Upload dir:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, Date.now() + '-' + originalName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.html') || file.originalname.endsWith('.htm')) {
      cb(null, true);
    } else {
      cb(new Error('Только HTML файлы разрешены'));
    }
  },
});

// Список файлов
router.get('/', authenticateToken, (req, res) => {
  try {
    const files = db.prepare(`
      SELECT f.*, r.name as restaurant_name
      FROM files f
      LEFT JOIN restaurants r ON f.restaurant_id = r.id
      ORDER BY f.created_at DESC
    `).all();

    res.json(files);
  } catch (error) {
    console.error('Ошибка получения файлов:', error);
    res.status(500).json({ error: 'Ошибка получения файлов' });
  }
});

// Загрузка файла
router.post('/', authenticateToken, logAction('UPLOAD_FILE'), upload.single('file'), (req, res) => {
  const transaction = db.transaction((filePath, filesize, userId) => {
    try {
      console.log(`\n🔄 Начало обработки файла: ${filePath}\n`);
      
      // 1) Парсим файл
      const parsed = parseInvoiceHTML(filePath);

      console.log(`📊 Парсинг завершён:`);
      console.log(`   - Продуктов: ${parsed.stats.products}`);
      console.log(`   - Поставщиков: ${parsed.stats.suppliers}`);
      console.log(`   - Накладных: ${parsed.stats.invoices}`);
      console.log(`   - Ресторан: ${parsed.restaurantName || 'не определён'}\n`);

      // 2) Определяем/создаём ресторан
      let restaurantId = null;
      if (parsed.restaurantName) {
        let restaurant = db.prepare('SELECT id FROM restaurants WHERE name = ?').get(parsed.restaurantName);

        if (!restaurant) {
          const result = db.prepare('INSERT INTO restaurants (name) VALUES (?)').run(parsed.restaurantName);
          restaurantId = result.lastInsertRowid;
          console.log(`✅ Создан ресторан: ${parsed.restaurantName} (ID: ${restaurantId})`);
        } else {
          restaurantId = restaurant.id;
          console.log(`✅ Найден ресторан: ${parsed.restaurantName} (ID: ${restaurantId})`);
        }
      }

      // 3) Сохраняем файл
      const fileResult = db.prepare(`
        INSERT INTO files (filename, filepath, filesize, restaurant_id, uploaded_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.file.filename, filePath, filesize, restaurantId, userId);

      const fileId = fileResult.lastInsertRowid;
      console.log(`✅ Файл сохранён (ID: ${fileId})\n`);

      // 4) Сохраняем данные из файла
      const savedCounts = {
        suppliers: 0,
        products: 0,
        invoices: 0,
        items: 0
      };

      // Группируем по накладным
      const invoicesMap = new Map();

      parsed.products.forEach(item => {
        const invKey = `${item.supplier}_${item.invoice_number}_${item.invoice_date}`;

        if (!invoicesMap.has(invKey)) {
          invoicesMap.set(invKey, {
            supplier: item.supplier,
            invoice_number: item.invoice_number,
            invoice_date: item.invoice_date,
            invoice_type: item.invoice_type,
            items: []
          });
        }

        invoicesMap.get(invKey).items.push(item);
      });

      console.log(`🔄 Обработка ${invoicesMap.size} накладных...\n`);

      // Обрабатываем каждую накладную
      invoicesMap.forEach((invoice, key) => {
        // Создаём/находим поставщика
        let supplier = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(invoice.supplier);
        if (!supplier) {
          const suppResult = db.prepare('INSERT INTO suppliers (name) VALUES (?)').run(invoice.supplier);
          supplier = { id: suppResult.lastInsertRowid };
          savedCounts.suppliers++;
          console.log(`   ➕ Новый поставщик: ${invoice.supplier} (ID: ${supplier.id})`);
        }

        const supplierId = supplier.id;

        // Создаём накладную
        const invResult = db.prepare(`
          INSERT INTO invoices (invoice_number, invoice_date, supplier_id, restaurant_id, file_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(invoice.invoice_number, invoice.invoice_date, supplierId, restaurantId, fileId);

        const invoiceId = invResult.lastInsertRowid;
        savedCounts.invoices++;
        
        console.log(`   📋 Накладная: ${invoice.invoice_number} от ${invoice.invoice_date} (ID: ${invoiceId})`);
        console.log(`      Поставщик: ${invoice.supplier}`);
        console.log(`      Товаров: ${invoice.items.length}`);

        // Добавляем товары в накладную
        invoice.items.forEach(item => {
          // Создаём/находим продукт ПО ИМЕНИ И КОДУ
          let product = db.prepare('SELECT id FROM products WHERE name = ? AND category = ?').get(item.name, item.code);

          if (!product) {
            const prodResult = db.prepare(`
              INSERT INTO products (name, category)
              VALUES (?, ?)
            `).run(item.name, item.code);
            product = { id: prodResult.lastInsertRowid };
            savedCounts.products++;
            console.log(`      ➕ Новый товар: [${item.code}] ${item.name} (ID: ${product.id})`);
          }

          const productId = product.id;

          // Добавляем строку в invoice_products
          db.prepare(`
            INSERT INTO invoice_products (invoice_id, product_id, quantity, price)
            VALUES (?, ?, ?, ?)
          `).run(invoiceId, productId, item.quantity, item.price_vatincluded);

          savedCounts.items++;
        });
        
        console.log('');
      });

      console.log(`✅ Сохранено:`);
      console.log(`   - ${savedCounts.suppliers} новых поставщиков`);
      console.log(`   - ${savedCounts.products} новых товаров`);
      console.log(`   - ${savedCounts.invoices} накладных`);
      console.log(`   - ${savedCounts.items} позиций\n`);

      return {
        file_id: fileId,
        restaurant_name: parsed.restaurantName || 'Не определён',
        stats: parsed.stats,
        saved: savedCounts
      };

    } catch (error) {
      console.error('❌ Ошибка обработки файла:', error);
      throw error;
    }
  });

  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

    const result = transaction(req.file.path, req.file.size, req.user.id);

    res.json({
      message: 'Файл успешно загружен и обработан',
      ...result
    });

  } catch (error) {
    console.error('❌ Ошибка загрузки файла:', error);
    res.status(500).json({ error: 'Ошибка обработки файла: ' + error.message });
  }
});

// Удалить файл
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
    res.json({ message: 'Файл удален' });
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    res.status(500).json({ error: 'Ошибка удаления файла' });
  }
});

export default router;
