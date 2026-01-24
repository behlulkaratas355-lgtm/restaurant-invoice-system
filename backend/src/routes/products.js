import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Получить все продукты с фильтрами
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, supplier_id, invoice_number, date_from, date_to } = req.query;

    let query = `
      SELECT 
        ip.id,
        p.name as product_name,
        p.category as product_code,
        ip.quantity,
        ip.price,
        (ip.quantity * ip.price) as total,
        i.invoice_number,
        i.invoice_date,
        s.name as supplier_name,
        r.name as restaurant_name
      FROM invoice_products ip
      JOIN products p ON ip.product_id = p.id
      JOIN invoices i ON ip.invoice_id = i.id
      JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN restaurants r ON i.restaurant_id = r.id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.category LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (supplier_id) {
      query += ` AND i.supplier_id = ?`;
      params.push(supplier_id);
    }

    if (invoice_number) {
      query += ` AND i.invoice_number LIKE ?`;
      params.push(`%${invoice_number}%`);
    }

    if (date_from) {
      query += ` AND i.invoice_date >= ?`;
      params.push(date_from);
    }

    if (date_to) {
      query += ` AND i.invoice_date <= ?`;
      params.push(date_to);
    }

    query += ` ORDER BY i.invoice_date DESC, p.name ASC`;

    const products = db.prepare(query).all(...params);

    res.json(products);
  } catch (error) {
    console.error('Ошибка получения продуктов:', error);
    res.status(500).json({ error: 'Ошибка получения продуктов' });
  }
});

// Получить список поставщиков для фильтра
router.get('/suppliers', authenticateToken, (req, res) => {
  try {
    const suppliers = db.prepare('SELECT id, name FROM suppliers ORDER BY name').all();
    res.json(suppliers);
  } catch (error) {
    console.error('Ошибка получения поставщиков:', error);
    res.status(500).json({ error: 'Ошибка получения поставщиков' });
  }
});

export default router;
