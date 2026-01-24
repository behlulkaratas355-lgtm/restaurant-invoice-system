import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import XLSX from 'xlsx';

const router = express.Router();

// Экспорт продуктов в Excel
router.get('/products/excel', authenticateToken, (req, res) => {
  try {
    const { search, supplier, invoice, dateFrom, dateTo, restaurant_id } = req.query;
    
    let query = `
      SELECT 
        p.code as 'Код',
        p.name as 'Название',
        p.supplier as 'Поставщик',
        p.quantity as 'Количество',
        p.price_wholesale as 'Цена б/НДС',
        p.price_vatincluded as 'Цена с НДС',
        p.sum_vatincluded as 'Сумма',
        p.invoice_number as 'Номер накладной',
        p.invoice_date as 'Дата',
        r.name as 'Ресторан'
      FROM products p
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (supplier) {
      query += ` AND p.supplier LIKE ?`;
      params.push(`%${supplier}%`);
    }
    if (invoice) {
      query += ` AND p.invoice_number LIKE ?`;
      params.push(`%${invoice}%`);
    }
    if (dateFrom) {
      query += ` AND p.invoice_date >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND p.invoice_date <= ?`;
      params.push(dateTo);
    }
    if (restaurant_id) {
      query += ` AND p.restaurant_id = ?`;
      params.push(restaurant_id);
    }

    query += ` ORDER BY p.created_at DESC`;

    const products = db.prepare(query).all(...params);

    // Создаем Excel файл
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Продукты');

    // Настройка ширины колонок
    const colWidths = [
      { wch: 10 },  // Код
      { wch: 40 },  // Название
      { wch: 30 },  // Поставщик
      { wch: 12 },  // Количество
      { wch: 15 },  // Цена б/НДС
      { wch: 15 },  // Цена с НДС
      { wch: 15 },  // Сумма
      { wch: 20 },  // Накладная
      { wch: 12 },  // Дата
      { wch: 20 },  // Ресторан
    ];
    worksheet['!cols'] = colWidths;

    // Генерируем буфер
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Отправляем файл
    const filename = `products_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Ошибка экспорта в Excel:', error);
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
});

// Экспорт продуктов в CSV
router.get('/products/csv', authenticateToken, (req, res) => {
  try {
    const { search, supplier, invoice, dateFrom, dateTo, restaurant_id } = req.query;
    
    let query = `
      SELECT 
        p.code,
        p.name,
        p.supplier,
        p.quantity,
        p.price_wholesale,
        p.price_vatincluded,
        p.sum_vatincluded,
        p.invoice_number,
        p.invoice_date,
        r.name as restaurant_name
      FROM products p
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (supplier) {
      query += ` AND p.supplier LIKE ?`;
      params.push(`%${supplier}%`);
    }
    if (invoice) {
      query += ` AND p.invoice_number LIKE ?`;
      params.push(`%${invoice}%`);
    }
    if (dateFrom) {
      query += ` AND p.invoice_date >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ` AND p.invoice_date <= ?`;
      params.push(dateTo);
    }
    if (restaurant_id) {
      query += ` AND p.restaurant_id = ?`;
      params.push(restaurant_id);
    }

    query += ` ORDER BY p.created_at DESC`;

    const products = db.prepare(query).all(...params);

    // Формируем CSV
    let csv = 'Код;Название;Поставщик;Количество;Цена б/НДС;Цена с НДС;Сумма;Накладная;Дата;Ресторан\n';
    products.forEach(p => {
      csv += `${p.code};${p.name};${p.supplier};${p.quantity};${p.price_wholesale};${p.price_vatincluded};${p.sum_vatincluded};${p.invoice_number};${p.invoice_date};${p.restaurant_name || ''}\n`;
    });

    const filename = `products_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send('\uFEFF' + csv); // BOM для корректного отображения кириллицы в Excel

  } catch (error) {
    console.error('Ошибка экспорта в CSV:', error);
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
});

export default router;
