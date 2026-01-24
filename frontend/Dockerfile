# Сборочный этап (устанавливаем ВСЕ зависимости)
FROM node:22-alpine as build

WORKDIR /app

# Копируем зависимости и устанавливаем ВСЕ пакеты
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY . .

# Собираем для продакшена
RUN npm run build

# Финальный образ (используем http-server вместо vite preview)
FROM node:22-alpine

WORKDIR /app

# Копируем ТОЛЬКО собранные файлы и package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Устанавливаем http-server для отдачи статики
RUN npm install -g http-server

EXPOSE 3000

# Запускаем http-server вместо vite preview
CMD ["http-server", "dist", "-p", "3000", "-a", "0.0.0.0", "--cors", "--gzip"]
