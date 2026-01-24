import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import HTMLParser from '../utils/htmlParser.js';

// Загрузка и парсинг HTML файла
export const uploadAndParse = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не загружен'
      });
    }

    const { restaurant_id } = req.body;

    if (!restaurant_id) {
      // Удаляем загруженный файл
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'ID ресторана обязателен'
      });
    }

    // Сохраняем информацию о файле в БД
    const fileData = {
      filename: req.file.filename,
      filepath: req.file.path,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      restaurant_id: parseInt(restaurant_id)
    };

    const file = File.create(fileData);

    // Парсинг HTML файла
    const parser = new HTMLParser(req.file.path);
    const products = parser.parse();
    const stats = parser.getStats();

    console.log(`Найдено продуктов: ${stats.totalProducts}`);
    console.log(`Уникальных поставщиков: ${stats.uniqueSuppliers}`);
    console.log(`Уникальных накладных: ${stats.uniqueInvoices}`);

    // Создание накладных
    const invoices = parser.getInvoices();
    const createdInvoices = [];

    for (const inv of invoices) {
      try {
        const invoice = Invoice.create({
          number: inv.number,
          date: inv.date,
          supplier: inv.supplier,
          restaurant_id: parseInt(restaurant_id),
          file_id: file.id
        });
        createdInvoices.push(invoice);
      } catch (error) {
        console.error(`Ошибка создания накладной ${inv.number}:`, error.message);
      }
    }

    // Создание продуктов
    const createdProducts = [];
    const errors = [];

    for (const prod of products) {
      try {
        const product = Product.create({
          name: prod.name,
          category: null, // Можно добавить логику определения категории
          supplier: prod.supplier,
          price_wholesale: prod.price_wholesale,
          price_vatincluded: prod.price_vatincluded,
          sum_vatincluded: prod.sum_vatincluded,
          invoice_number: prod.invoice_number,
          invoice_date: prod.invoice_date,
          restaurant_id: parseInt(restaurant_id),
          file_id: file.id
        });
        createdProducts.push(product);
      } catch (error) {
        errors.push({
          product: prod.name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Файл успешно загружен и обработан',
      data: {
        file,
        stats: {
          parsedProducts: stats.totalProducts,
          createdProducts: createdProducts.length,
          createdInvoices: createdInvoices.length,
          errors: errors.length
        },
        errors: errors.slice(0, 10) // Показываем первые 10 ошибок
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    
    // Удаляем файл при ошибке
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Получение всех файлов
export const getAllFiles = async (req, res) => {
  try {
    const filters = {
      restaurant_id: req.query.restaurant_id
    };

    const files = File.getAll(filters);

    res.json({
      success: true,
      data: { files }
    });
  } catch (error) {
    console.error('Ошибка получения файлов:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Удаление файла
export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = File.findById(id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Файл не найден'
      });
    }

    // Удаляем физический файл
    if (fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    // Удаляем запись из БД
    File.delete(id);

    res.json({
      success: true,
      message: 'Файл успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
