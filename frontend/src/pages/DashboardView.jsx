import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './DashboardView.css';

const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-view">
        <h1>📊 Панель управления</h1>
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      <h1>📊 Панель управления</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏪</div>
          <div className="stat-info">
            <h3>Ресторанов</h3>
            <div className="stat-value">{stats?.restaurants || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Продуктов</h3>
            <div className="stat-value">{stats?.products || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-info">
            <h3>Поставщиков</h3>
            <div className="stat-value">{stats?.suppliers || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Накладных</h3>
            <div className="stat-value">{stats?.invoices || 0}</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Быстрые действия</h2>
        <div className="actions-grid">
          <Link to="/upload" className="action-card">
            <div className="action-icon">📤</div>
            <h3>Загрузить накладную</h3>
            <p>Импортируйте HTML-файлы накладных для обработки</p>
          </Link>

          <Link to="/analytics" className="action-card">
            <div className="action-icon">📈</div>
            <h3>Просмотреть аналитику</h3>
            <p>Анализ закупок по периодам и поставщикам</p>
          </Link>

          <Link to="/anomalies" className="action-card">
            <div className="action-icon">⚠️</div>
            <h3>Проверить аномалии</h3>
            <p>Выявление резких изменений цен и отклонений</p>
          </Link>

          <Link to="/restaurants" className="action-card">
            <div className="action-icon">🏪</div>
            <h3>Управление ресторанами</h3>
            <p>Просмотр и редактирование списка точек</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
