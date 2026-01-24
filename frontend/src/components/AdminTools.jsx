import React, { useState, useEffect } from 'react';
import './AdminTools.css';

const AdminTools = () => {
  const [stats, setStats] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      showNotification('Ошибка загрузки статистики', 'error');
    }
  };

  const clearProducts = async () => {
    setIsClearing(true);
    setShowConfirmDialog(false);

    try {
      const response = await fetch('/api/admin/clear-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        showNotification('✅ База данных очищена!', 'success');
        await loadStats();
      } else {
        showNotification('❌ ' + result.error, 'error');
      }
    } catch (error) {
      showNotification('❌ Ошибка: ' + error.message, 'error');
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
    <div className="admin-tools">
      <div className="admin-card">
        <h2>🛠️ Инструменты администратора</h2>

        <div className="stats-section">
          <h3>📊 Статистика базы данных</h3>
          {stats ? (
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Продуктов:</span>
                <span className="stat-value">{stats.products}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Поставщиков:</span>
                <span className="stat-value">{stats.suppliers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Ресторанов:</span>
                <span className="stat-value">{stats.restaurants}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Размер БД:</span>
                <span className="stat-value">{stats.dbSize}</span>
              </div>
            </div>
          ) : (
            <p>Загрузка...</p>
          )}
          <button onClick={loadStats} className="btn-secondary">
            🔄 Обновить
          </button>
        </div>

        <div className="danger-zone">
          <h3>⚠️ Опасная зона</h3>
          <p>Эти действия необратимы!</p>
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="btn-danger"
            disabled={isClearing}
          >
            {isClearing ? '⏳ Удаление...' : '🗑️ Очистить все продукты'}
          </button>
        </div>
      </div>

      {/* Модальное окно */}
      {showConfirmDialog && (
        <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Подтверждение удаления</h3>
            <p>Вы уверены, что хотите удалить ВСЕ продукты из базы данных?</p>
            <p><strong>Это действие нельзя отменить!</strong></p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmDialog(false)} className="btn-secondary">
                ❌ Отмена
              </button>
              <button onClick={clearProducts} className="btn-danger">
                ✅ Да, удалить всё
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

export default AdminTools;
