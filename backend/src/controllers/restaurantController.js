import Restaurant from '../models/Restaurant.js';

// Получение всех ресторанов
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = Restaurant.getAll();
    
    res.json({
      success: true,
      data: { restaurants }
    });
  } catch (error) {
    console.error('Ошибка получения ресторанов:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Получение ресторана по ID
export const getRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = Restaurant.findById(id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Ресторан не найден'
      });
    }

    const stats = Restaurant.getStats(id);
    
    res.json({
      success: true,
      data: { 
        restaurant,
        stats
      }
    });
  } catch (error) {
    console.error('Ошибка получения ресторана:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Создание ресторана
export const createRestaurant = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Название ресторана обязательно'
      });
    }
    
    const restaurant = Restaurant.create({ name });
    
    res.status(201).json({
      success: true,
      message: 'Ресторан успешно создан',
      data: { restaurant }
    });
  } catch (error) {
    console.error('Ошибка создания ресторана:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Обновление ресторана
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Название ресторана обязательно'
      });
    }
    
    const restaurant = Restaurant.update(id, { name });
    
    res.json({
      success: true,
      message: 'Ресторан успешно обновлен',
      data: { restaurant }
    });
  } catch (error) {
    console.error('Ошибка обновления ресторана:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Удаление ресторана
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    
    Restaurant.delete(id);
    
    res.json({
      success: true,
      message: 'Ресторан успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления ресторана:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
