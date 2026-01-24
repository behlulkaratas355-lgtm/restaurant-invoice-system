import { useState, useEffect } from 'react';
import { invoicesAPI, restaurantsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './RestaurantsView.css';

const InvoicesView = () => {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    date: '',
    supplier: '',
    restaurant_id: ''
  });

  useEffect(() => {
    loadInvoices();
    loadRestaurants();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoicesAPI.getAll();
      setInvoices(response.data.data.invoices);
    } catch (error) {
      console.error('Ошибка загрузки накладных:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurants = async () => {
    try {
      const response = await restaurantsAPI.getAll();
      setRestaurants(response.data.data.restaurants);
    } catch (error) {
      console.error('Ошибка загрузки ресторанов:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        restaurant_id: parseInt(formData.restaurant_id)
      };

      if (editingId) {
        await invoicesAPI.update(editingId, data);
      } else {
        await invoicesAPI.create(data);
      }
      
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadInvoices();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(error.response?.data?.message || 'Ошибка сохранения');
    }
  };

  const handleEdit = (invoice) => {
    setEditingId(invoice.id);
    setFormData({
      number: invoice.number,
      date: invoice.date,
      supplier: invoice.supplier,
      restaurant_id: invoice.restaurant_id
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить накладную?')) return;
    
    try {
      await invoicesAPI.delete(id);
      loadInvoices();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert(error.response?.data?.message || 'Ошибка удаления');
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      date: '',
      supplier: '',
      restaurant_id: ''
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const canEdit = hasRole('admin') || hasRole('manager');

  return (
    <div className="restaurants-view">
      <div className="header">
        <h1>Накладные</h1>
        {canEdit && !showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Добавить накладную
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-card">
          <h2>{editingId ? 'Редактировать накладную' : 'Новая накладная'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Номер накладной *</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Дата *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Поставщик *</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Ресторан *</label>
              <select
                value={formData.restaurant_id}
                onChange={(e) => setFormData({...formData, restaurant_id: e.target.value})}
                required
              >
                <option value="">Выберите ресторан</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? 'Сохранить' : 'Создать'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Номер</th>
                <th>Дата</th>
                <th>Поставщик</th>
                <th>Ресторан</th>
                {canEdit && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.id}</td>
                  <td>{invoice.number}</td>
                  <td>{new Date(invoice.date).toLocaleDateString('ru-RU')}</td>
                  <td>{invoice.supplier}</td>
                  <td>{invoice.restaurant_name}</td>
                  {canEdit && (
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(invoice)}>
                        Изменить
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(invoice.id)}>
                        Удалить
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && (
            <p style={{textAlign: 'center', padding: '2rem'}}>Нет накладных</p>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoicesView;
