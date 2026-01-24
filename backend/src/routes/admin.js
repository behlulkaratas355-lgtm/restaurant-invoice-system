import express from 'express';
import db from '../config/database.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Middleware для проверки админских прав
const requireAdmin = [authenticateToken, isAdmin];

// Очистка всех исторических данных о продуктах (invoice_products и invoices)
// Оставляет каталог продуктов (products), пользователей и ресторанов
router.post('/clear-products', requireAdmin, (req, res) => {
  try {
    // Начинаем транзакцию
    const clearData = db.transaction(() => {
      // Удаляем все связи продуктов с накладными (исторические данные)
      const deletedInvoiceProducts = db.prepare('DELETE FROM invoice_products').run();
      
      // Удаляем все накладные
      const deletedInvoices = db.prepare('DELETE FROM invoices').run();
      
      // Опционально: удаляем файлы (можно оставить для истории)
      let deletedFiles = { changes: 0 };
      try {
        deletedFiles = db.prepare('DELETE FROM files').run();
      } catch (e) {
        console.log('Таблица files не найдена или ошибка:', e.message);
      }
      
      // Возвращаем статистику оставшихся данных
      return {
        invoice_products: db.prepare('SELECT COUNT(*) as count FROM invoice_products').get().count,
        invoices: db.prepare('SELECT COUNT(*) as count FROM invoices').get().count,
        products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
        suppliers: db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count,
        deleted: {
          invoice_products: deletedInvoiceProducts.changes,
          invoices: deletedInvoices.changes,
          files: deletedFiles.changes
        }
      };
    });
    
    const result = clearData();
    
    console.log('✅ Исторические данные о продуктах очищены:', result);
    
    res.json({
      success: true,
      message: 'Все исторические данные о продуктах удалены',
      deleted: result.deleted,
      remaining: {
        products: result.products,
        suppliers: result.suppliers
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка очистки базы:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получение статистики базы данных
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const db = new Database(DB_PATH);
    
    const stats = {
      products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
      suppliers: db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count,
      restaurants: db.prepare('SELECT COUNT(*) as count FROM restaurants').get().count,
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    };
    
    // Добавляем размер БД
    const fs = require('fs');
    const fileStats = fs.statSync(DB_PATH);
    stats.dbSize = (fileStats.size / 1024).toFixed(2) + ' KB';
    
    db.close();
    
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Удаление конкретного поставщика и всех его товаров
router.delete('/supplier/:id', requireAdmin, (req, res) => {
  try {
    const db = new Database(DB_PATH);
    const supplierId = req.params.id;
    
    // Удаляем все товары поставщика
    const deleteProducts = db.prepare('DELETE FROM products WHERE supplier_id = ?');
    const result1 = deleteProducts.run(supplierId);
    
    // Удаляем поставщика
    const deleteSupplier = db.prepare('DELETE FROM suppliers WHERE id = ?');
    const result2 = deleteSupplier.run(supplierId);
    
    db.close();
    
    res.json({
      success: true,
      message: 'Поставщик и его товары удалены',
      deletedProducts: result1.changes,
      deletedSuppliers: result2.changes
    });
    
  } catch (error) {
    console.error('❌ Ошибка удаления поставщика:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
