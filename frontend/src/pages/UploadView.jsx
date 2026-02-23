import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './UploadView.css';

const UploadView = () => {
  const { user, loading } = useAuth();

  const [files, setFiles] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const loadData = async () => {
    try {
      setError(null);
      const [filesRes, restRes] = await Promise.all([
        api.get('/upload'),
        api.get('/restaurants'),
      ]);
      setUploadedFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      setRestaurants(Array.isArray(restRes.data) ? restRes.data : []);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError(err?.response?.data?.error || err?.message || 'Ошибка загрузки данных');
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const suggestRestaurantFromFilename = (filename) => {
    const base = filename.replace(/\.(html?|htm)$/i, '').replace(/^\d{10,13}-/, '').replace(/[_-]/g, ' ').trim();
    if (!base || base.length < 2) return null;
    const lower = base.toLowerCase();
    const match = restaurants.find(r => r.name && r.name.toLowerCase() === lower);
    if (match) return match.id;
    const partial = restaurants.find(r => r.name && r.name.toLowerCase().includes(lower));
    return partial ? partial.id : null;
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const htmlFiles = selected.filter(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));

    if (htmlFiles.length !== selected.length) {
      alert(`Выбрано ${selected.length} файлов, из них HTML: ${htmlFiles.length}`);
    }

    if (htmlFiles.length > 0) {
      setFiles(htmlFiles);
      setUploadResults([]);
      setError(null);
      const suggestedId = suggestRestaurantFromFilename(htmlFiles[0].name);
      if (suggestedId && !selectedRestaurantId) setSelectedRestaurantId(String(suggestedId));
    } else {
      alert('Выберите HTML файлы');
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Выберите файлы');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadResults([]);
      setProgress({ current: 0, total: files.length });

      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        try {
          const formData = new FormData();
          formData.append('file', file);
          if (selectedRestaurantId) formData.append('restaurant_id', selectedRestaurantId);

          const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          results.push({
            filename: file.name,
            success: true,
            data: res.data
          });

          console.log(`✅ ${file.name} загружен`);
        } catch (err) {
          results.push({
            filename: file.name,
            success: false,
            error: err?.response?.data?.error || err?.message || 'Ошибка загрузки'
          });

          console.error(`❌ ${file.name}:`, err);
        }
      }

      setUploadResults(results);
      setFiles([]);

      await loadData();

      const input = document.getElementById('file-input');
      if (input) input.value = '';

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      alert(
        `✅ Загрузка завершена!\n` +
        `Успешно: ${successCount}\n` +
        `Ошибок: ${failCount}`
      );

    } catch (err) {
      console.error('Ошибка загрузки:', err);
      const msg = err?.response?.data?.error || err?.message || 'Ошибка загрузки файлов';
      setError(msg);
      alert('Ошибка загрузки файлов: ' + msg);
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Удалить файл?')) return;

    try {
      await api.delete(`/upload/${fileId}`);
      await loadData();
      alert('Файл удален');
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Ошибка удаления файла: ' + (err?.response?.data?.error || err?.message));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="upload-view">
        <h1>📤 Загрузка накладных</h1>
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="upload-view">
      <h1>📤 Загрузка накладных</h1>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="upload-section">
        <div className="upload-card">
          <h3>Загрузить файлы</h3>
          
          <p className="hint">
            Ресторан можно выбрать из списка или оставить пустым — тогда он определится по имени файла.
          </p>

          <div className="form-group">
            <label>Ресторан (необязательно)</label>
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              disabled={uploading}
              className="restaurant-select"
            >
              <option value="">— Выберите ресторан —</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {restaurants.length === 0 && (
              <p className="hint-small">Сначала добавьте рестораны в разделе «Рестораны»</p>
            )}
          </div>

          <div className="form-group">
            <label>HTML файлы накладных (можно выбрать несколько)</label>
            <input
              id="file-input"
              type="file"
              accept=".html,.htm"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
            />
            {files.length > 0 && (
              <div className="files-selected">
                <p>✓ Выбрано файлов: <strong>{files.length}</strong></p>
                <ul>
                  {files.slice(0, 5).map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                  {files.length > 5 && <li>... и ещё {files.length - 5}</li>}
                </ul>
              </div>
            )}
          </div>

          {uploading && (
            <div className="upload-progress">
              <p>Загрузка {progress.current} из {progress.total}...</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="btn-upload"
          >
            {uploading ? `Загрузка ${progress.current}/${progress.total}...` : `Загрузить файлы (${files.length})`}
          </button>

          {uploadResults.length > 0 && (
            <div className="upload-results">
              <h4>📊 Результаты загрузки:</h4>
              <div className="results-list">
                {uploadResults.map((result, i) => (
                  <div key={i} className={`result-item ${result.success ? 'success' : 'error'}`}>
                    <div className="result-icon">{result.success ? '✅' : '❌'}</div>
                    <div className="result-info">
                      <strong>{result.filename}</strong>
                      {result.success ? (
                        <div className="result-details">
                          <p>🏪 Ресторан: {result.data.restaurant_name}</p>
                          <p>📦 Строк: {result.data.stats.products} | 🚚 Поставщиков: {result.data.stats.suppliers} | 📄 Накладных: {result.data.stats.invoices}</p>
                        </div>
                      ) : (
                        <p className="error-text">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="files-section">
        <h3>Загруженные файлы ({uploadedFiles.length})</h3>

        {uploadedFiles.length === 0 ? (
          <p className="no-files">Нет загруженных файлов</p>
        ) : (
          <div className="files-grid">
            {uploadedFiles.map((f) => (
              <div key={f.id} className="file-card">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <h4>{f.filename}</h4>
                  <p>🏪 Ресторан: <strong>{f.restaurant_name || 'Не определён'}</strong></p>
                  <p>📏 Размер: {formatFileSize(f.filesize)}</p>
                  <p>📅 Загружен: {new Date(f.created_at).toLocaleString('ru-RU')}</p>
                </div>

                <button onClick={() => handleDelete(f.id)} className="btn-delete">
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadView;
