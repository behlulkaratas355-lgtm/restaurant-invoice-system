import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './LogsView.css';

const LogsView = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    date_from: '',
    date_to: '',
    limit: 100
  });

  useEffect(() => {
    loadLogs();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await api.get(`/logs?${params.toString()}`);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки логов:', err);
      alert('Ошибка загрузки логов: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get('/logs/stats');
      setStats(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadLogs();
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      date_from: '',
      date_to: '',
      limit: 100
    });
    setTimeout(() => loadLogs(), 100);
  };

  const getActionIcon = (action) => {
    const icons = {
      'CREATE_USER': '➕',
      'DELETE_USER': '🗑️',
      'CHANGE_USER_ROLE': '🔄',
      'CHANGE_USER_PASSWORD': '🔑',
      'UPLOAD_FILE': '📤',
      'LOGIN': '🔐',
      'LOGOUT': '🚪'
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'red';
    if (action.includes('CREATE')) return 'green';
    if (action.includes('CHANGE')) return 'orange';
    if (action.includes('UPLOAD')) return 'blue';
    return 'gray';
  };

  return (
    <div className="logs-view">
      <h1>📜 Логи системы</h1>

      <div className="stats-section">
        <h3>📊 Статистика действий</h3>
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">{getActionIcon(stat.action)}</div>
              <div className="stat-info">
                <div className="stat-label">{stat.action}</div>
                <div className="stat-value">{stat.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="filters-section">
        <h3>🔍 Фильтры</h3>
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Действие (CREATE_USER, UPLOAD_FILE...)"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
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

          <select
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', e.target.value)}
          >
            <option value="50">50 записей</option>
            <option value="100">100 записей</option>
            <option value="500">500 записей</option>
            <option value="1000">1000 записей</option>
          </select>
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="btn-primary">Применить фильтры</button>
          <button onClick={resetFilters} className="btn-secondary">Сбросить</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="logs-container">
          <p className="results-info">Найдено: <strong>{logs.length}</strong> записей</p>
          
          {logs.length === 0 ? (
            <div className="no-data">📭 Нет логов для отображения</div>
          ) : (
            <div className="logs-list">
              {logs.map((log) => (
                <div key={log.id} className="log-item">
                  <div className="log-header">
                    <span className={`log-action ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)} {log.action}
                    </span>
                    <span className="log-user">👤 {log.user_login || 'Система'}</span>
                    <span className="log-date">
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  
                  {log.details && (
                    <div className="log-details">
                      <details>
                        <summary>Подробности</summary>
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogsView;
