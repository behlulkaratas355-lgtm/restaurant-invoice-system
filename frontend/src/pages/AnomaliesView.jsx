import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { exportToExcel, exportToPDF, createTableForPDF } from '../utils/export';
import './AnomaliesView.css';

const AnomaliesView = () => {
  const [activeTab, setActiveTab] = useState('price-changes');
  const [loading, setLoading] = useState(false);
  const [priceChanges, setPriceChanges] = useState([]);
  const [priceComparison, setPriceComparison] = useState([]);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  const tableRef = useRef(null);
  
  const [filters, setFilters] = useState({
    threshold: 10,
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.threshold]);

  const loadStats = async () => {
    try {
      const res = await api.get(`/anomalies/stats?threshold=${filters.threshold}`);
      setStats(res.data);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  const loadPriceChanges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        threshold: filters.threshold,
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      });

      const res = await api.get(`/anomalies/price-changes?${params}`);
      setPriceChanges(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки аномалий:', err);
      alert('Ошибка: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadPriceComparison = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        threshold: filters.threshold,
        ...(filters.date_from && { date_from: filters.date_from }),
        ...(filters.date_to && { date_to: filters.date_to })
      });

      const res = await api.get(`/anomalies/price-comparison?${params}`);
      setPriceComparison(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки сравнения:', err);
      alert('Ошибка: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (activeTab === 'price-changes') {
      loadPriceChanges();
    } else {
      loadPriceComparison();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'price-changes' && priceChanges.length === 0) {
      loadPriceChanges();
    } else if (tab === 'price-comparison' && priceComparison.length === 0) {
      loadPriceComparison();
    }
  };

  const handleExportExcel = () => {
    try {
      setExporting(true);
      const dataToExport = activeTab === 'price-changes' ? priceChanges : priceComparison;
      
      if (dataToExport.length === 0) {
        alert('Нечего экспортировать');
        return;
      }

      const filename = `anomalies_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      exportToExcel(dataToExport, filename, 'Аномалии');
      alert('✅ Файл экспортирован');
    } catch (error) {
      alert('❌ Ошибка экспорта: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      
      if (!tableRef.current) {
        alert('Таблица не найдена');
        return;
      }

      const title = activeTab === 'price-changes' 
        ? 'Отчёт: Изменения цен во времени'
        : 'Отчёт: Сравнение цен между поставщиками';
      
      const filename = `anomalies_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // Клонируем таблицу для PDF
      const tableClone = tableRef.current.cloneNode(true);
      tableClone.style.display = 'block';
      
      // Создаём контейнер с заголовком
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.backgroundColor = 'white';
      
      const header = document.createElement('h2');
      header.textContent = title;
      header.style.marginBottom = '10px';
      container.appendChild(header);
      
      const dateInfo = document.createElement('p');
      dateInfo.textContent = `Дата отчёта: ${new Date().toLocaleString('ru-RU')}`;
      dateInfo.style.color = '#666';
      dateInfo.style.fontSize = '12px';
      dateInfo.style.marginBottom = '20px';
      container.appendChild(dateInfo);
      
      const filterInfo = document.createElement('p');
      filterInfo.textContent = `Параметры: Порог ${filters.threshold}%${filters.date_from ? ` | Период: ${filters.date_from} - ${filters.date_to}` : ''}`;
      filterInfo.style.color = '#666';
      filterInfo.style.fontSize = '12px';
      filterInfo.style.marginBottom = '20px';
      container.appendChild(filterInfo);
      
      container.appendChild(tableClone);
      
      // Добавляем в DOM временно
      document.body.appendChild(container);
      
      await exportToPDF(container, filename);
      
      // Удаляем из DOM
      document.body.removeChild(container);
      
      alert('✅ PDF экспортирован');
    } catch (error) {
      alert('❌ Ошибка экспорта PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getChangeClass = (percent) => {
    if (percent > 0) return 'increase';
    if (percent < 0) return 'decrease';
    return '';
  };

  return (
    <div className="anomalies-view">
      <h1>⚠️ Аномалии цен</h1>

      {/* Статистика */}
      {stats && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-label">Изменения цен</div>
              <div className="stat-value">{stats.price_changes}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-info">
              <div className="stat-label">Разница между поставщиками</div>
              <div className="stat-value">{stats.price_comparison}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-info">
              <div className="stat-label">Порог отклонения</div>
              <div className="stat-value">{stats.threshold}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="filters-section">
        <h3>🔍 Настройки поиска</h3>
        <div className="filters-grid">
          <div>
            <label>Порог отклонения (%)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={filters.threshold}
              onChange={(e) => setFilters({ ...filters, threshold: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label>Дата от</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>

          <div>
            <label>Дата до</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleApplyFilters} className="btn-primary">
            Найти аномалии
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'price-changes' ? 'active' : ''}`}
          onClick={() => handleTabChange('price-changes')}
        >
          📊 Изменения цен во времени
        </button>
        <button
          className={`tab ${activeTab === 'price-comparison' ? 'active' : ''}`}
          onClick={() => handleTabChange('price-comparison')}
        >
          🔄 Сравнение между поставщиками
        </button>
      </div>

      {/* Кнопки экспорта */}
      {(activeTab === 'price-changes' ? priceChanges : priceComparison).length > 0 && (
        <div className="export-section">
          <button 
            onClick={handleExportExcel} 
            disabled={exporting}
            className="btn-export btn-excel"
          >
            📊 Экспорт в Excel
          </button>
          <button 
            onClick={handleExportPDF} 
            disabled={exporting}
            className="btn-export btn-pdf"
          >
            📄 Экспорт в PDF
          </button>
        </div>
      )}

      {/* Контент */}
      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="content">
          {activeTab === 'price-changes' && (
            <div className="anomalies-section">
              {priceChanges.length === 0 ? (
                <div className="no-data">
                  📭 Нет аномалий для отображения
                  <p>Попробуйте изменить порог или период</p>
                </div>
              ) : (
                <div className="table-container">
                  <table ref={tableRef}>
                    <thead>
                      <tr>
                        <th>Товар</th>
                        <th>Код</th>
                        <th>Поставщик</th>
                        <th>Пред. дата</th>
                        <th>Пред. цена</th>
                        <th>Тек. дата</th>
                        <th>Тек. цена</th>
                        <th>Изменение</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceChanges.map((anomaly, i) => (
                        <tr key={i}>
                          <td>{anomaly.product_name}</td>
                          <td>{anomaly.product_code || '-'}</td>
                          <td>{anomaly.supplier_name}</td>
                          <td>{anomaly.previous_date}<br/><small>{anomaly.previous_invoice}</small></td>
                          <td className="number">{formatPrice(anomaly.previous_price)} ₽</td>
                          <td>{anomaly.current_date}<br/><small>{anomaly.current_invoice}</small></td>
                          <td className="number">{formatPrice(anomaly.current_price)} ₽</td>
                          <td className={`change ${getChangeClass(anomaly.change_percent)}`}>
                            <strong>{anomaly.change_percent > 0 ? '+' : ''}{anomaly.change_percent}%</strong>
                            <br/>
                            <small>{anomaly.change_amount > 0 ? '+' : ''}{formatPrice(anomaly.change_amount)} ₽</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'price-comparison' && (
            <div className="anomalies-section">
              {priceComparison.length === 0 ? (
                <div className="no-data">
                  📭 Нет аномалий для отображения
                  <p>Попробуйте изменить порог или период</p>
                </div>
              ) : (
                <div className="table-container">
                  <table ref={tableRef}>
                    <thead>
                      <tr>
                        <th>Товар</th>
                        <th>Код</th>
                        <th>Поставщик</th>
                        <th>Цена поставщика</th>
                        <th>Средняя цена</th>
                        <th>Мин/Макс</th>
                        <th>Отклонение</th>
                        <th>Дата/Накладная</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceComparison.map((anomaly, i) => (
                        <tr key={i}>
                          <td>{anomaly.product_name}</td>
                          <td>{anomaly.product_code || '-'}</td>
                          <td>{anomaly.supplier_name}</td>
                          <td className="number">{formatPrice(anomaly.supplier_price)} ₽</td>
                          <td className="number">{formatPrice(anomaly.avg_price)} ₽</td>
                          <td className="number">
                            {formatPrice(anomaly.min_price)} - {formatPrice(anomaly.max_price)} ₽
                          </td>
                          <td className={`change ${getChangeClass(anomaly.deviation_percent)}`}>
                            <strong>{anomaly.deviation_percent > 0 ? '+' : ''}{anomaly.deviation_percent}%</strong>
                            <br/>
                            <small>{anomaly.deviation_amount > 0 ? '+' : ''}{formatPrice(anomaly.deviation_amount)} ₽</small>
                          </td>
                          <td>{anomaly.invoice_date}<br/><small>{anomaly.invoice_number}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnomaliesView;
