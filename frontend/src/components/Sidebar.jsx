import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Главная' },
    { path: '/products', icon: '📦', label: 'Продукты' },
    { path: '/upload', icon: '📤', label: 'Загрузка' },
    { path: '/analytics', icon: '📊', label: 'Аналитика' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🍽️ Ресторан</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
