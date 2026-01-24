import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './UsersView.css';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ login: '', password: '', role: 'user' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      alert('Ошибка загрузки пользователей: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!newUser.login || !newUser.password) {
      alert('Заполните все поля');
      return;
    }

    try {
      await api.post('/users', newUser);
      alert('✅ Пользователь создан');
      setShowCreateModal(false);
      setNewUser({ login: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      alert('Ошибка создания: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Изменить роль на "${newRole}"?`)) return;

    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      alert('✅ Роль изменена');
      loadUsers();
    } catch (err) {
      alert('Ошибка: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleResetPassword = async (userId, login) => {
    const newPassword = prompt(`Введите новый пароль для "${login}":`);
    
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      await api.patch(`/users/${userId}/password`, { password: newPassword });
      alert('✅ Пароль изменён');
    } catch (err) {
      alert('Ошибка: ' + (err?.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async (userId, login) => {
    if (!confirm(`Удалить пользователя "${login}"?`)) return;

    try {
      await api.delete(`/users/${userId}`);
      alert('✅ Пользователь удалён');
      loadUsers();
    } catch (err) {
      alert('Ошибка: ' + (err?.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="users-view">
        <h1>👥 Пользователи</h1>
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="users-view">
      <div className="header">
        <h1>👥 Пользователи</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          ➕ Создать пользователя
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Создан</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.login}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? '👑 Админ' : '👤 Пользователь'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleString('ru-RU')}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleChangeRole(user.id, user.role)}
                      className="btn-small btn-secondary"
                      title="Изменить роль"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id, user.login)}
                      className="btn-small btn-secondary"
                      title="Сбросить пароль"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.login)}
                      className="btn-small btn-danger"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Создать пользователя</h2>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Логин</label>
                <input
                  type="text"
                  value={newUser.login}
                  onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>Роль</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Создать</button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersView;
