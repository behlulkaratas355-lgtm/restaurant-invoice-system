import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import './ProductAnalysisView.css';

const ProductAnalysisView = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadPriceHistory(selectedProduct);
    } else {
      setPriceHistory([]);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get('/products/list');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки продуктов:', err);
      alert('Ошибка загрузки продуктов: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadPriceHistory = async (productId) => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${productId}/price-history`);
      const history = Array.isArray(res.data) ? res.data : [];
      
      // Форматируем данные для графика
      const chartData = history.map(item => ({
        date: new Date(item.date).toLocaleDateString('ru-RU', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        price: parseFloat(item.price),
        quantity: parseFloat(item.quantity),
        total: parseFloat(item.total),
        invoiceNumber: item.invoice_number,
        supplier: item.supplier_name,
        restaurant: item.restaurant_name,
        fullDate: item.date
      }));
      
      setPriceHistory(chartData);
    } catch (err) {
      console.error('Ошибка загрузки истории цен:', err);
      alert('Ошибка загрузки истории цен: ' + (err?.response?.data?.error || err.message));
      setPriceHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.find(p => p.id.toString() === selectedProduct);

  // Вычисляем статистику
  const stats = priceHistory.length > 0 ? {
    minPrice: Math.min(...priceHistory.map(d => d.price)),
    maxPrice: Math.max(...priceHistory.map(d => d.price)),
    avgPrice: priceHistory.reduce((sum, d) => sum + d.price, 0) / priceHistory.length,
    priceChange: priceHistory.length > 1 
      ? priceHistory[priceHistory.length - 1].price - priceHistory[0].price 
      : 0,
    priceChangePercent: priceHistory.length > 1 
      ? ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price * 100)
      : 0
  } : null;

  return (
    <div className="product-analysis-view">
      <h1>📈 Анализ цен продуктов</h1>

      <div className="product-selector-section">
        <div className="selector-group">
          <label htmlFor="product-select">Выберите продукт:</label>
          <select
            id="product-select"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            disabled={loadingProducts}
            className="product-select"
          >
            <option value="">-- Выберите продукт --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name || product.name} 
                {product.supplier_name && ` (${product.supplier_name})`}
                {(product.product_code || product.category) && ` [${product.product_code || product.category}]`}
              </option>
            ))}
          </select>
        </div>

        {loadingProducts && <div className="loading">Загрузка продуктов...</div>}
      </div>

      {selectedProduct && (
        <>
          {loading ? (
            <div className="loading">Загрузка истории цен...</div>
          ) : priceHistory.length === 0 ? (
            <div className="no-data">
              📭 Нет данных о ценах для выбранного продукта
            </div>
          ) : (
            <>
              {selectedProductData && (
                <div className="product-info">
                  <h2>{selectedProductData.product_name || selectedProductData.name}</h2>
                  {selectedProductData.supplier_name && (
                    <p><strong>Поставщик:</strong> {selectedProductData.supplier_name}</p>
                  )}
                  {(selectedProductData.product_code || selectedProductData.category) && (
                    <p><strong>Код:</strong> {selectedProductData.product_code || selectedProductData.category}</p>
                  )}
                </div>
              )}

              {stats && (
                <div className="stats-cards">
                  <div className="stat-card">
                    <h3>Минимальная цена</h3>
                    <div className="stat-value">{stats.minPrice.toFixed(2)} ₽</div>
                  </div>
                  <div className="stat-card">
                    <h3>Максимальная цена</h3>
                    <div className="stat-value">{stats.maxPrice.toFixed(2)} ₽</div>
                  </div>
                  <div className="stat-card">
                    <h3>Средняя цена</h3>
                    <div className="stat-value">{stats.avgPrice.toFixed(2)} ₽</div>
                  </div>
                  <div className="stat-card">
                    <h3>Изменение цены</h3>
                    <div className={`stat-value ${stats.priceChange >= 0 ? 'positive' : 'negative'}`}>
                      {stats.priceChange >= 0 ? '+' : ''}{stats.priceChange.toFixed(2)} ₽
                      <br />
                      <small>({stats.priceChangePercent >= 0 ? '+' : ''}{stats.priceChangePercent.toFixed(2)}%)</small>
                    </div>
                  </div>
                </div>
              )}

              <div className="chart-section">
                <h2>График изменения цен</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={priceHistory} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      label={{ value: 'Цена (₽)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="custom-tooltip">
                              <p><strong>Дата:</strong> {data.date}</p>
                              <p><strong>Цена:</strong> {data.price.toFixed(2)} ₽</p>
                              <p><strong>Количество:</strong> {data.quantity}</p>
                              <p><strong>Сумма:</strong> {data.total.toFixed(2)} ₽</p>
                              {data.supplier && <p><strong>Поставщик:</strong> {data.supplier}</p>}
                              {data.invoiceNumber && <p><strong>Накладная:</strong> {data.invoiceNumber}</p>}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Цена (₽)"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="history-table-section">
                <h2>История цен</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Цена (₽)</th>
                        <th>Количество</th>
                        <th>Сумма (₽)</th>
                        <th>Накладная</th>
                        <th>Поставщик</th>
                        <th>Ресторан</th>
                      </tr>
                    </thead>
                    <tbody>
                      {priceHistory.map((item, index) => (
                        <tr key={index}>
                          <td>{item.date}</td>
                          <td className="number">{item.price.toFixed(2)}</td>
                          <td className="number">{item.quantity}</td>
                          <td className="number">{item.total.toFixed(2)}</td>
                          <td>{item.invoiceNumber || '-'}</td>
                          <td>{item.supplier || '-'}</td>
                          <td>{item.restaurant || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!selectedProduct && !loadingProducts && (
        <div className="no-data">
          👆 Выберите продукт для просмотра истории изменения цен
        </div>
      )}
    </div>
  );
};

export default ProductAnalysisView;
