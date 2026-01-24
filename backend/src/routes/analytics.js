import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Аналитика по периоду
router.get('/', authenticateToken, (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({ error: 'Укажите период (date_from и date_to)' });
    }

    // Общая статистика
    const summary = db.prepare(`
      SELECT 
        COUNT(DISTINCT i.id) as invoices_count,
        COUNT(DISTINCT s.id) as suppliers_count,
        COUNT(DISTINCT p.id) as products_count,
        SUM(ip.quantity * ip.price) as total_amount
      FROM invoices i
      JOIN invoice_products ip ON i.id = ip.invoice_id
      JOIN suppliers s ON i.supplier_id = s.id
      JOIN products p ON ip.product_id = p.id
      WHERE i.invoice_date BETWEEN ? AND ?
    `).get(date_from, date_to);

    // Топ поставщиков
    const topSuppliers = db.prepare(`
      SELECT 
        s.name,
        COUNT(DISTINCT i.id) as invoices_count,
        SUM(ip.quantity * ip.price) as total_amount
      FROM suppliers s
      JOIN invoices i ON s.id = i.supplier_id
      JOIN invoice_products ip ON i.id = ip.invoice_id
      WHERE i.invoice_date BETWEEN ? AND ?
      GROUP BY s.id
      ORDER BY total_amount DESC
      LIMIT 10
    `).all(date_from, date_to);

    // Топ продуктов
    const topProducts = db.prepare(`
      SELECT 
        p.name,
        p.category as code,
        SUM(ip.quantity) as total_quantity,
        SUM(ip.quantity * ip.price) as total_amount
      FROM products p
      JOIN invoice_products ip ON p.id = ip.product_id
      JOIN invoices i ON ip.invoice_id = i.id
      WHERE i.invoice_date BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY total_amount DESC
      LIMIT 10
    `).all(date_from, date_to);

    // По дням
    const byDate = db.prepare(`
      SELECT 
        i.invoice_date as date,
        COUNT(DISTINCT i.id) as invoices_count,
        SUM(ip.quantity * ip.price) as total_amount
      FROM invoices i
      JOIN invoice_products ip ON i.id = ip.invoice_id
      WHERE i.invoice_date BETWEEN ? AND ?
      GROUP BY i.invoice_date
      ORDER BY i.invoice_date ASC
    `).all(date_from, date_to);

    res.json({
      summary,
      topSuppliers,
      topProducts,
      byDate
    });

  } catch (error) {
    console.error('Ошибка получения аналитики:', error);
    res.status(500).json({ error: 'Ошибка получения аналитики' });
  }
});

export default router;
