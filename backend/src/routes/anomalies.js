import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Аномалии цен одного товара от одного поставщика (во времени)
router.get('/price-changes', authenticateToken, (req, res) => {
  try {
    const { threshold = 1, date_from, date_to } = req.query;
    const thresholdPercent = parseFloat(threshold);

    let dateFilter = '';
    const params = [];

    if (date_from && date_to) {
      dateFilter = 'AND i.invoice_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    }

    // Находим товары с изменением цены у одного поставщика
    const query = `
      WITH price_history AS (
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.category as product_code,
          s.id as supplier_id,
          s.name as supplier_name,
          i.invoice_date,
          i.invoice_number,
          ip.price as current_price,
          LAG(ip.price) OVER (
            PARTITION BY p.id, s.id 
            ORDER BY i.invoice_date
          ) as previous_price,
          LAG(i.invoice_date) OVER (
            PARTITION BY p.id, s.id 
            ORDER BY i.invoice_date
          ) as previous_date,
          LAG(i.invoice_number) OVER (
            PARTITION BY p.id, s.id 
            ORDER BY i.invoice_date
          ) as previous_invoice
        FROM invoice_products ip
        JOIN products p ON ip.product_id = p.id
        JOIN invoices i ON ip.invoice_id = i.id
        JOIN suppliers s ON i.supplier_id = s.id
        WHERE 1=1 ${dateFilter}
      )
      SELECT 
        product_id,
        product_name,
        product_code,
        supplier_id,
        supplier_name,
        previous_date,
        previous_invoice,
        previous_price,
        invoice_date as current_date,
        invoice_number as current_invoice,
        current_price,
        ROUND(((current_price - previous_price) / previous_price * 100), 2) as change_percent,
        ROUND(current_price - previous_price, 2) as change_amount
      FROM price_history
      WHERE previous_price IS NOT NULL
        AND ABS((current_price - previous_price) / previous_price * 100) > ?
      ORDER BY ABS((current_price - previous_price) / previous_price * 100) DESC
      LIMIT 500
    `;

    params.push(thresholdPercent);

    const anomalies = db.prepare(query).all(...params);

    res.json(anomalies);
  } catch (error) {
    console.error('Ошибка получения аномалий цен:', error);
    res.status(500).json({ error: 'Ошибка получения аномалий: ' + error.message });
  }
});

// Аномалии цен одинаковых товаров между поставщиками
router.get('/price-comparison', authenticateToken, (req, res) => {
  try {
    const { threshold = 1, date_from, date_to } = req.query;
    const thresholdPercent = parseFloat(threshold);

    let dateFilter = '';
    const params = [];

    if (date_from && date_to) {
      dateFilter = 'AND i.invoice_date BETWEEN ? AND ?';
      params.push(date_from, date_to);
    }

    // Сравниваем цены на один товар между поставщиками
    const query = `
      WITH latest_prices AS (
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.category as product_code,
          s.id as supplier_id,
          s.name as supplier_name,
          ip.price,
          i.invoice_date,
          i.invoice_number,
          ROW_NUMBER() OVER (
            PARTITION BY p.id, s.id 
            ORDER BY i.invoice_date DESC
          ) as rn
        FROM invoice_products ip
        JOIN products p ON ip.product_id = p.id
        JOIN invoices i ON ip.invoice_id = i.id
        JOIN suppliers s ON i.supplier_id = s.id
        WHERE 1=1 ${dateFilter}
      ),
      supplier_prices AS (
        SELECT * FROM latest_prices WHERE rn = 1
      ),
      price_stats AS (
        SELECT 
          product_id,
          product_name,
          product_code,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          COUNT(DISTINCT supplier_id) as supplier_count
        FROM supplier_prices
        GROUP BY product_id
        HAVING supplier_count > 1
      )
      SELECT 
        sp.product_id,
        sp.product_name,
        sp.product_code,
        sp.supplier_id,
        sp.supplier_name,
        sp.price as supplier_price,
        sp.invoice_date,
        sp.invoice_number,
        ps.avg_price,
        ps.min_price,
        ps.max_price,
        ps.supplier_count,
        ROUND(((sp.price - ps.avg_price) / ps.avg_price * 100), 2) as deviation_percent,
        ROUND(sp.price - ps.avg_price, 2) as deviation_amount
      FROM supplier_prices sp
      JOIN price_stats ps ON sp.product_id = ps.product_id
      WHERE ABS((sp.price - ps.avg_price) / ps.avg_price * 100) > ?
      ORDER BY ABS((sp.price - ps.avg_price) / ps.avg_price * 100) DESC
      LIMIT 500
    `;

    params.push(thresholdPercent);

    const anomalies = db.prepare(query).all(...params);

    res.json(anomalies);
  } catch (error) {
    console.error('Ошибка сравнения цен:', error);
    res.status(500).json({ error: 'Ошибка сравнения цен: ' + error.message });
  }
});

// Статистика аномалий
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { threshold = 1 } = req.query;
    const thresholdPercent = parseFloat(threshold);

    // Количество аномалий по изменению цен
    const priceChanges = db.prepare(`
      WITH price_history AS (
        SELECT 
          ip.price as current_price,
          LAG(ip.price) OVER (
            PARTITION BY p.id, s.id 
            ORDER BY i.invoice_date
          ) as previous_price
        FROM invoice_products ip
        JOIN products p ON ip.product_id = p.id
        JOIN invoices i ON ip.invoice_id = i.id
        JOIN suppliers s ON i.supplier_id = s.id
      )
      SELECT COUNT(*) as count
      FROM price_history
      WHERE previous_price IS NOT NULL
        AND ABS((current_price - previous_price) / previous_price * 100) > ?
    `).get(thresholdPercent);

    // Количество аномалий между поставщиками
    const priceComparison = db.prepare(`
      WITH latest_prices AS (
        SELECT 
          p.id as product_id,
          s.id as supplier_id,
          ip.price,
          ROW_NUMBER() OVER (
            PARTITION BY p.id, s.id 
            ORDER BY i.invoice_date DESC
          ) as rn
        FROM invoice_products ip
        JOIN products p ON ip.product_id = p.id
        JOIN invoices i ON ip.invoice_id = i.id
        JOIN suppliers s ON i.supplier_id = s.id
      ),
      supplier_prices AS (
        SELECT * FROM latest_prices WHERE rn = 1
      ),
      price_stats AS (
        SELECT 
          product_id,
          AVG(price) as avg_price,
          COUNT(DISTINCT supplier_id) as supplier_count
        FROM supplier_prices
        GROUP BY product_id
        HAVING supplier_count > 1
      )
      SELECT COUNT(*) as count
      FROM supplier_prices sp
      JOIN price_stats ps ON sp.product_id = ps.product_id
      WHERE ABS((sp.price - ps.avg_price) / ps.avg_price * 100) > ?
    `).get(thresholdPercent);

    res.json({
      price_changes: priceChanges.count || 0,
      price_comparison: priceComparison.count || 0,
      threshold: thresholdPercent
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

export default router;
