import { useState } from 'react';
import './LoginForm.css';

const LoginForm = ({ onSubmit, loading }) => {
  const [credentials, setCredentials] = useState({
    login: '',
    password: '',
  });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(credentials);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Вход в систему</h2>
      
      <div className="form-group">
        <label htmlFor="login">Логин</label>
        <input
          type="text"
          id="login"
          name="login"
          value={credentials.login}
          onChange={handleChange}
          required
          autoComplete="username"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Пароль</label>
        <input
          type="password"
          id="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
};

export default LoginForm;
