import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './RestaurantsView.css';

const RestaurantsView = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const res = await api.get('/restaurants');
      setRestaurants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки ресторанов:', err);
      alert('Ошибка загрузки: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Введите название');
      return;
    }

    try {
      await api.post('/restaurants', formData);
      alert('✅ Ресторан создан');
      setShowCreateModal(false);
      setFormData({ name: '', address: '' });
      loadRestaurants();
    } catch (err) {
      alert('Ошибка создания: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Введите название');
      return;
    }

    try {
      await api.put(`/restaurants/${editingRestaurant.id}`, formData);
      alert('✅ Ресторан обновлён');
      setEditingRestaurant(null);
      setFormData({ name: '', address: '' });
      loadRestaurants();
    } catch (err) {
      alert('Ошибка обновления: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Удалить ресторан "${name}"?\n\nВнимание: связанные файлы останутся без привязки.`)) return;

    try {
      await api.delete(`/restaurants/${id}`);
      alert('✅ Ресторан удалён');
      loadRestaurants();
    } catch (err) {
      alert('Ошибка удаления: ' + (err?.response?.data?.error || err.message));
    }
  };

  const openEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({ name: restaurant.name, address: restaurant.address || '' });
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingRestaurant(null);
    setFormData({ name: '', address: '' });
  };

  if (loading) {
    return (
      <div className="restaurants-view">
        <h1>🏪 Рестораны</h1>
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="restaurants-view">
      <div className="header">
        <h1>🏪 Рестораны</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          ➕ Добавить ресторан
        </button>
      </div>

      <div className="restaurants-grid">
        {restaurants.length === 0 ? (
          <div className="no-data">📭 Нет ресторанов</div>
        ) : (
          restaurants.map((r) => (
            <div key={r.id} className="restaurant-card">
              <div className="restaurant-icon">🏪</div>
              <div className="restaurant-info">
                <h3>{r.name}</h3>
                {r.address && <p className="address">📍 {r.address}</p>}
                <p className="meta">ID: {r.id} | Создан: {new Date(r.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
              <div className="restaurant-actions">
                <button onClick={() => openEditModal(r)} className="btn-small btn-secondary">
                  ✏️ Изменить
                </button>
                <button onClick={() => handleDelete(r.id, r.name)} className="btn-small btn-danger">
                  🗑️ Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно создания */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Создать ресторан</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Например: Ресторан Москва"
                />
              </div>

              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Например: г. Москва, ул. Ленина, 1"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Создать</button>
                <button type="button" onClick={closeModals} className="btn-secondary">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {editingRestaurant && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Редактировать ресторан</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Адрес</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Сохранить</button>
                <button type="button" onClick={closeModals} className="btn-secondary">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsView;
