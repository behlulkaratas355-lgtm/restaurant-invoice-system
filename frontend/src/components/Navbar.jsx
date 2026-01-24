import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          🏪 Restaurant System
        </Link>
        
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/dashboard" className="navbar-link">
              Dashboard
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/restaurants" className="navbar-link">
              Рестораны
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/products" className="navbar-link">
              Продукты
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/invoices" className="navbar-link">
              Накладные
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/upload" className="navbar-link">
              Загрузка
            </Link>
          </li>
          {user?.role === 'admin' && (
            <li className="navbar-item">
              <Link to="/admin" className="navbar-link">
                Админ
              </Link>
            </li>
          )}
        </ul>

        <div className="navbar-user">
          <span className="user-info">
            {user?.login} ({user?.role})
          </span>
          <button onClick={handleLogout} className="logout-button">
            Выход
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
