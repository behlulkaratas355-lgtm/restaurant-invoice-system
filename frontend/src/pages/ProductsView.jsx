import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import './ProductsView.css';

const ProductsView = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    supplier_id: '',
    invoice_number: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/products/suppliers');
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки поставщиков:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки продуктов:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadProducts();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      supplier_id: '',
      invoice_number: '',
      date_from: '',
      date_to: ''
    });
    setTimeout(() => loadProducts(), 100);
  };

  const exportToExcel = () => {
    const data = products.map(p => ({
      'Код': p.product_code || '',
      'Название': p.product_name,
      'Поставщик': p.supplier_name,
      'Ресторан': p.restaurant_name || 'Не указан',
      'Накладная': p.invoice_number,
      'Дата': p.invoice_date,
      'Количество': p.quantity,
      'Цена': p.price,
      'Сумма': p.total
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Продукты');
    XLSX.writeFile(wb, `products_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToCSV = () => {
    const headers = ['Код', 'Название', 'Поставщик', 'Ресторан', 'Накладная', 'Дата', 'Количество', 'Цена', 'Сумма'];
    const rows = products.map(p => [
      p.product_code || '',
      p.product_name,
      p.supplier_name,
      p.restaurant_name || 'Не указан',
      p.invoice_number,
      p.invoice_date,
      p.quantity,
      p.price,
      p.total
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };
  const clearProducts = async () => {
    setIsClearing(true);
    setShowConfirmDialog(false);

    try {
      const res = await api.post('/admin/clear-products');
      
      if (res.data.success) {
        showNotification('✅ Все продукты успешно удалены!', 'success');
        await loadProducts();
      } else {
        showNotification('❌ Ошибка: ' + (res.data.error || 'Неизвестная ошибка'), 'error');
      }
    } catch (error) {
      showNotification('❌ Ошибка: ' + (error?.response?.data?.error || error.message || 'Не удалось очистить продукты'), 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };


  return (
    <div className="products-view">
      <div className="header">
        <h1>📦 Продукты</h1>
        <div className="header-actions">
          <div className="export-buttons">
            <button onClick={exportToExcel} disabled={products.length === 0}>
              📊 Excel
            </button>
            <button onClick={exportToCSV} disabled={products.length === 0}>
              📄 CSV
            </button>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="btn-danger"
              disabled={isClearing}
            >
              {isClearing ? '⏳ Удаление...' : '🗑️ Очистить продукты'}
            </button>
          )}
        </div>
      </div>

      <div className="filters-section">
        <h3>🔍 Фильтры</h3>
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Поиск по названию/коду"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />

          <select
            value={filters.supplier_id}
            onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
          >
            <option value="">Все поставщики</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Номер накладной"
            value={filters.invoice_number}
            onChange={(e) => handleFilterChange('invoice_number', e.target.value)}
          />

          <input
            type="date"
            placeholder="Дата от"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />

          <input
            type="date"
            placeholder="Дата до"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="btn-primary">Применить фильтры</button>
          <button onClick={resetFilters} className="btn-secondary">Сбросить</button>
        </div>
      </div>

      <div className="results-info">
        <p>Найдено: <strong>{products.length}</strong> позиций</p>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : products.length === 0 ? (
        <div className="no-data">📭 Нет данных для отображения</div>
      ) : (
        <div className="table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Название</th>
                <th>Поставщик</th>
                <th>Ресторан</th>
                <th>Накладная</th>
                <th>Дата</th>
                <th>Количество</th>
                <th>Цена</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.product_code || '-'}</td>
                  <td>{p.product_name}</td>
                  <td>{p.supplier_name}</td>
                  <td>{p.restaurant_name || 'Не указан'}</td>
                  <td>{p.invoice_number}</td>
                  <td>{p.invoice_date}</td>
                  <td className="number">{p.quantity}</td>
                  <td className="number">{p.price?.toFixed(2)}</td>
                  <td className="number">{p.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Модальное окно подтверждения */}
      {showConfirmDialog && (
        <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить ВСЕ продукты из базы данных?</p>
            <p><strong>Это действие нельзя отменить!</strong></p>
            <p style={{ fontSize: '14px', color: '#999' }}>
              Все исторические записи о продуктах будут удалены.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmDialog(false)} className="btn-secondary">
                ❌ Отмена
              </button>
              <button onClick={clearProducts} className="btn-danger" disabled={isClearing}>
                {isClearing ? '⏳ Удаление...' : '✅ Да, удалить всё'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Уведомление */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ProductsView;
