# TopGlass - База знаний и помощник

## Описание проекта
TopGlass - это веб-приложение для сотрудников магазина, включающее базу знаний, помощник по замене стёкол и систему тестирования.

## Технологии
- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Backend**: Firebase (Realtime Database, Authentication, Storage)
- **Редактор**: Quill.js для форматирования статей
- **Telegram**: Интеграция с Telegram Mini App
- **Хостинг изображений**: ImgBB API

## Структура проекта

### Основные файлы
- `index.html` - главная страница с модальными окнами
- `style.css` - стили приложения
- `script.js` - логика базы знаний (поиск, статьи, просмотры)
- `auth.js` - система авторизации и управление пользователями
- `firebase-config.js` - конфигурация и инициализация Firebase
- `glass-helper.js` - помощник по замене стёкол
- `messages-manager.js` - управление сообщениями и предложениями
- `data.js` - пустой массив articles (данные хранятся в Firebase)

### Firebase структура
```
/articles/{id}
  - title: string
  - keywords: array
  - content: string (HTML из Quill)
  - views: number
  - helpful: number
  - notHelpful: number
  - images: array
  - videos: array

/users/{uid}
  - username: string
  - name: string
  - store: string
  - email: string
  - createdAt: timestamp
  - role: string

/admins/{uid}
  - role: "admin"
  - createdAt: timestamp

/glassLinks/{id}
  - phoneModel: string
  - compatibleModels: array
  - createdAt: timestamp
  - createdBy: string

/glassSuggestions/{id}
  - phoneModel: string
  - compatibleGlass: string
  - comment: string
  - suggestedBy: string
  - suggestedAt: timestamp
  - status: string

/feedback/{id}
  - title: string
  - content: string
  - timestamp: number
  - date: string
  - suggestedBy: string
```

## Функционал

### 1. База знаний
- Поиск по статьям (заголовок, ключевые слова, содержание)
- Просмотр статей с подсчетом просмотров
- Оценка статей (помогло/не помогло)
- Предложение новых тем (для пользователей)
- Добавление/редактирование/удаление статей (для админов)
- Сброс просмотров (для админов)

### 2. Помощник замены стёкол
- Поиск совместимых стёкол по модели телефона
- **Важно**: Показывает единый список всех совместимых моделей без разделения на "главный телефон"
- Поиск работает в обе стороны (по любой модели из группы совместимости)
- Предложение совместимости (для пользователей)
- Управление связками: добавление, редактирование, удаление (для админов)

### 3. Система авторизации
- Вход по username и паролю
- Регистрация только через админа
- Email формируется автоматически: `{username}@topglass.local`
- Роли: user, admin
- Управление пользователями (для админов)

### 4. Управление сообщениями (для админов)
- Предложенные темы
- Предложения совместимости стёкол
- Отзывы об улучшении статей

## Важные особенности

### Версионирование кеша
При каждом обновлении нужно менять версию в `index.html`:
```html
<link rel="stylesheet" href="style.css?v=YYYYMMDDHHMMSS">
<script src="script.js?v=YYYYMMDDHHMMSS"></script>
```

### Загрузка статей
- Статьи загружаются из Firebase при авторизации пользователя
- Массив `articles` в `data.js` пустой - данные только в Firebase
- Функция `loadArticlesFromFirebase()` загружает статьи один раз через `.once()`
- Нет подписки на изменения в реальном времени (убрана для избежания конфликтов)

### Поиск стёкол
- Использует `Set` для уникальных моделей
- Собирает все совместимые модели из всех найденных связок
- Показывает единый список без разделения

### Логирование
В коде добавлено подробное логирование для отладки:
- Инициализация Firebase
- Загрузка статей
- Авторизация пользователей
- Отображение данных

## Git workflow
```bash
git add .
git commit -m "Описание изменений

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
git push
```

## Последние изменения (2026-05-17)
1. Исправлена загрузка статей из Firebase (убрана дублирующая подписка)
2. Улучшен поиск совместимых стёкол (единый список без разделения)
3. Добавлена возможность редактирования связок стёкол для админа
4. Добавлено подробное логирование для отладки

## Контакты
- GitHub: https://github.com/rezeast1/test1
- Firebase Project: topglass-82657

## Заметки для разработки
- Всегда обновляй версию кеша после изменений
- Проверяй консоль браузера для отладки
- Firebase Rules настроены для авторизованных пользователей
- ImgBB API Key: 71077e7395b6b7ae7fe585a7434247ed
