<template>
  <div class="admin-tools">
    <div class="card">
      <h3>🛠️ Инструменты администратора</h3>
      
      <div class="stats-section">
        <h4>📊 Статистика базы данных</h4>
        <div class="stats-grid" v-if="stats">
          <div class="stat-item">
            <span class="stat-label">Продуктов:</span>
            <span class="stat-value">{{ stats.products }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Поставщиков:</span>
            <span class="stat-value">{{ stats.suppliers }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ресторанов:</span>
            <span class="stat-value">{{ stats.restaurants }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Размер БД:</span>
            <span class="stat-value">{{ stats.dbSize }}</span>
          </div>
        </div>
        <button @click="loadStats" class="btn-secondary">🔄 Обновить</button>
      </div>

      <div class="danger-zone">
        <h4>⚠️ Опасная зона</h4>
        <p>Эти действия необратимы!</p>
        
        <button 
          @click="showConfirmDialog = true" 
          class="btn-danger"
          :disabled="isClearing"
        >
          🗑️ Очистить все продукты
        </button>
      </div>
    </div>

    <!-- Диалог подтверждения -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click="showConfirmDialog = false">
      <div class="modal-content" @click.stop>
        <h3>⚠️ Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить ВСЕ продукты из базы данных?</p>
        <p><strong>Это действие нельзя отменить!</strong></p>
        
        <div class="modal-actions">
          <button @click="showConfirmDialog = false" class="btn-secondary">
            ❌ Отмена
          </button>
          <button @click="clearProducts" class="btn-danger" :disabled="isClearing">
            {{ isClearing ? '⏳ Удаление...' : '✅ Да, удалить всё' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Уведомление -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminTools',
  data() {
    return {
      stats: null,
      showConfirmDialog: false,
      isClearing: false,
      notification: null
    };
  },
  mounted() {
    this.loadStats();
  },
  methods: {
    async loadStats() {
      try {
        const response = await fetch('/api/admin/stats');
        this.stats = await response.json();
      } catch (error) {
        this.showNotification('Ошибка загрузки статистики', 'error');
      }
    },
    
    async clearProducts() {
      this.isClearing = true;
      this.showConfirmDialog = false;
      
      try {
        const response = await fetch('/api/admin/clear-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.showNotification('✅ База данных очищена!', 'success');
          await this.loadStats();
        } else {
          this.showNotification('❌ ' + result.error, 'error');
        }
      } catch (error) {
        this.showNotification('❌ Ошибка: ' + error.message, 'error');
      } finally {
        this.isClearing = false;
      }
    },
    
    showNotification(message, type = 'info') {
      this.notification = { message, type };
      setTimeout(() => {
        this.notification = null;
      }, 5000);
    }
  }
};
</script>

<style scoped>
.admin-tools {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h3 {
  margin-top: 0;
  color: #333;
}

.stats-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #eee;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.danger-zone {
  background: #fff5f5;
  border: 2px solid #fee;
  border-radius: 8px;
  padding: 16px;
}

.danger-zone h4 {
  color: #c53030;
  margin-top: 0;
}

.btn-secondary, .btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 12px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
}

.modal-content h3 {
  color: #dc3545;
  margin-top: 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
}

/* Уведомления */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.notification.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
