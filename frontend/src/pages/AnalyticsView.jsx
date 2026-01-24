import React, { useState } from 'react';
import api from '../utils/api';
import './AnalyticsView.css';

const AnalyticsView = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: ''
  });

  const fetchAnalytics = async () => {
    if (!filters.date_from || !filters.date_to) {
      alert('Укажите период');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        date_from: filters.date_from,
        date_to: filters.date_to
      });

      const res = await api.get(`/analytics?${params.toString()}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Ошибка загрузки аналитики:', err);
      alert('Ошибка загрузки аналитики: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="analytics-view">
      <h1>📊 Аналитика</h1>

      <div className="filters-section">
        <div className="filters-grid">
          <div>
            <label>Дата от</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>

          <div>
            <label>Дата до</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </div>

        <button onClick={fetchAnalytics} disabled={loading} className="btn-primary">
          {loading ? 'Загрузка...' : 'Применить'}
        </button>
      </div>

      {!analytics ? (
        <div className="no-data">📭 Нет данных для отображения</div>
      ) : (
        <div className="analytics-content">
          {/* Общая статистика */}
          <div className="summary-cards">
            <div className="stat-card">
              <h3>📄 Накладных</h3>
              <div className="stat-value">{analytics.summary?.invoices_count || 0}</div>
            </div>
            <div className="stat-card">
              <h3>🚚 Поставщиков</h3>
              <div className="stat-value">{analytics.summary?.suppliers_count || 0}</div>
            </div>
            <div className="stat-card">
              <h3>📦 Продуктов</h3>
              <div className="stat-value">{analytics.summary?.products_count || 0}</div>
            </div>
            <div className="stat-card">
              <h3>💰 Общая сумма</h3>
              <div className="stat-value">
                {(analytics.summary?.total_amount || 0).toLocaleString('ru-RU', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₽
              </div>
            </div>
          </div>

          {/* Топ поставщиков */}
          <div className="section">
            <h2>🏆 Топ поставщиков</h2>
            {analytics.topSuppliers?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Поставщик</th>
                    <th>Накладных</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topSuppliers.map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      <td>{s.invoices_count}</td>
                      <td className="number">
                        {(s.total_amount || 0).toLocaleString('ru-RU', {
                          minimumFractionDigits: 2
                        })} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет данных</p>
            )}
          </div>

          {/* Топ продуктов */}
          <div className="section">
            <h2>📦 Топ продуктов</h2>
            {analytics.topProducts?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Код</th>
                    <th>Количество</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((p, i) => (
                    <tr key={i}>
                      <td>{p.name}</td>
                      <td>{p.code || '-'}</td>
                      <td className="number">{p.total_quantity}</td>
                      <td className="number">
                        {(p.total_amount || 0).toLocaleString('ru-RU', {
                          minimumFractionDigits: 2
                        })} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет данных</p>
            )}
          </div>

          {/* По датам */}
          <div className="section">
            <h2>📅 По датам</h2>
            {analytics.byDate?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Накладных</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.byDate.map((d, i) => (
                    <tr key={i}>
                      <td>{d.date}</td>
                      <td>{d.invoices_count}</td>
                      <td className="number">
                        {(d.total_amount || 0).toLocaleString('ru-RU', {
                          minimumFractionDigits: 2
                        })} ₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Нет данных</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
