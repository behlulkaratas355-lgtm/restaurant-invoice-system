import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h2>Система управления закупками</h2>
        </div>
        <div className="header-right">
          <span className="user-info">
            👤 {user?.login || 'Пользователь'}
          </span>
          <button onClick={logout} className="btn-logout">
            Выход
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
