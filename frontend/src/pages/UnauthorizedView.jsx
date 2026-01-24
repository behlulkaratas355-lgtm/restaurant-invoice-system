import { Link } from 'react-router-dom';

const UnauthorizedView = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '4rem', color: '#e74c3c' }}>403</h1>
      <h2>Доступ запрещен</h2>
      <p>У вас нет прав для просмотра этой страницы</p>
      <Link to="/dashboard" style={{
        marginTop: '1rem',
        padding: '0.75rem 1.5rem',
        background: '#3498db',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px'
      }}>
        Вернуться на Dashboard
      </Link>
    </div>
  );
};

export default UnauthorizedView;
