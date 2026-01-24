import Product from '../models/Product.js';

// Получение всех продуктов
export const getAllProducts = async (req, res) => {
  try {
    const filters = {
      restaurant_id: req.query.restaurant_id,
      supplier: req.query.supplier,
      category: req.query.category,
      invoice_number: req.query.invoice_number,
      limit: req.query.limit
    };
    
    const products = Product.getAll(filters);
    
    res.json({
      success: true,
      data: { 
        products,
        count: products.length
      }
    });
  } catch (error) {
    console.error('Ошибка получения продуктов:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Получение продукта по ID
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Продукт не найден'
      });
    }
    
    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Ошибка получения продукта:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Создание продукта
export const createProduct = async (req, res) => {
  try {
    const product = Product.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Продукт успешно создан',
      data: { product }
    });
  } catch (error) {
    console.error('Ошибка создания продукта:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Обновление продукта
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = Product.update(id, req.body);
    
    res.json({
      success: true,
      message: 'Продукт успешно обновлен',
      data: { product }
    });
  } catch (error) {
    console.error('Ошибка обновления продукта:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Удаление продукта
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    Product.delete(id);
    
    res.json({
      success: true,
      message: 'Продукт успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления продукта:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Получение категорий
export const getCategories = async (req, res) => {
  try {
    const categories = Product.getCategories();
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Получение поставщиков
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = Product.getSuppliers();
    
    res.json({
      success: true,
      data: { suppliers }
    });
  } catch (error) {
    console.error('Ошибка получения поставщиков:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
