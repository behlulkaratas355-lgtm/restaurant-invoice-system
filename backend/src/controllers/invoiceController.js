import Invoice from '../models/Invoice.js';

// Получение всех накладных
export const getAllInvoices = async (req, res) => {
  try {
    const filters = {
      restaurant_id: req.query.restaurant_id,
      supplier: req.query.supplier
    };
    
    const invoices = Invoice.getAll(filters);
    
    res.json({
      success: true,
      data: { 
        invoices,
        count: invoices.length
      }
    });
  } catch (error) {
    console.error('Ошибка получения накладных:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Получение накладной по ID
export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = Invoice.findById(id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Накладная не найдена'
      });
    }

    const products = Invoice.getProducts(id);
    
    res.json({
      success: true,
      data: { 
        invoice,
        products
      }
    });
  } catch (error) {
    console.error('Ошибка получения накладной:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Создание накладной
export const createInvoice = async (req, res) => {
  try {
    const invoice = Invoice.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Накладная успешно создана',
      data: { invoice }
    });
  } catch (error) {
    console.error('Ошибка создания накладной:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Обновление накладной
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = Invoice.update(id, req.body);
    
    res.json({
      success: true,
      message: 'Накладная успешно обновлена',
      data: { invoice }
    });
  } catch (error) {
    console.error('Ошибка обновления накладной:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Удаление накладной
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    Invoice.delete(id);
    
    res.json({
      success: true,
      message: 'Накладная успешно удалена'
    });
  } catch (error) {
    console.error('Ошибка удаления накладной:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
