FROM node:22-alpine

# Установка зависимостей для компиляции нативных модулей
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование всех файлов проекта
COPY . .

# Создание директории для базы данных
RUN mkdir -p /app/data

# Открытие порта
EXPOSE 5000

# Запуск приложения
CMD ["npm", "start"]
