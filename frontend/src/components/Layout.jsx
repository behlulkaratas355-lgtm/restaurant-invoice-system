import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🍽️ Система</h2>
          <p className="user-info">👤 {user.login} <span className="role-badge">{user.role}</span></p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
            📊 Дашборд
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => isActive ? "active" : ""}>
            📤 Загрузка
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? "active" : ""}>
            📦 Продукты
          </NavLink>
          <NavLink to="/product-analysis" className={({ isActive }) => isActive ? "active" : ""}>
            📈 Анализ цен
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? "active" : ""}>
            📈 Аналитика
          </NavLink>
          <NavLink to="/anomalies" className={({ isActive }) => isActive ? "active" : ""}>
            ⚠️ Аномалии
          </NavLink>
          <NavLink to="/restaurants" className={({ isActive }) => isActive ? "active" : ""}>
            🏪 Рестораны
          </NavLink>
          
          {user.role === 'admin' && (
            <>
              <NavLink to="/users" className={({ isActive }) => isActive ? "active" : ""}>
                👥 Пользователи
              </NavLink>
              <NavLink to="/logs" className={({ isActive }) => isActive ? "active" : ""}>
                📜 Логи
              </NavLink>
            </>
          )}
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          🚪 Выйти
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
