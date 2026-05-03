# Инструкция по деплою бота на Render.com

## Шаг 1: Подготовка GitHub репозитория

### 1.1 Создайте репозиторий на GitHub

1. Перейдите на https://github.com/new
2. Название: `wiki-telegram-bot` (или любое другое)
3. Выберите **Public** или **Private**
4. **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)
5. Нажмите **Create repository**

### 1.2 Загрузите файлы в репозиторий

Откройте командную строку в папке `C:\Users\Lenovo\Desktop\claude` и выполните:

```bash
git init
git add bot.py requirements.txt runtime.txt Procfile .gitignore
git commit -m "Initial commit: Telegram bot for wiki suggestions"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/wiki-telegram-bot.git
git push -u origin main
```

**Замените** `ВАШ_USERNAME` на ваш GitHub username!

## Шаг 2: Деплой на Render.com

### 2.1 Создайте аккаунт на Render

1. Перейдите на https://render.com/
2. Нажмите **Get Started** или **Sign Up**
3. Войдите через GitHub (рекомендуется)
4. Разрешите Render доступ к вашим репозиториям

### 2.2 Создайте новый Web Service

1. На главной странице Render нажмите **New +** → **Web Service**
2. Найдите репозиторий `wiki-telegram-bot` и нажмите **Connect**
3. Заполните настройки:

**Основные настройки:**
- **Name**: `wiki-telegram-bot` (или любое имя)
- **Region**: выберите ближайший регион (например, Frankfurt)
- **Branch**: `main`
- **Root Directory**: оставьте пустым
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python bot.py`

**План:**
- Выберите **Free** (бесплатный план)

4. Нажмите **Create Web Service**

### 2.3 Дождитесь деплоя

Render начнет деплой. Вы увидите логи в реальном времени:
```
==> Installing dependencies...
==> Starting service...
Бот запущен и готов к работе...
Веб-сервер запущен на порту 8080
```

Когда увидите статус **Live** - бот запущен! 🎉

### 2.4 Получите URL вашего бота

В верхней части страницы вы увидите URL вида:
```
https://wiki-telegram-bot.onrender.com
```

**Скопируйте этот URL!**

## Шаг 3: Обновите telegram-bot.js

Откройте файл `telegram-bot.js` и замените URL:

```javascript
const BOT_SERVER_URL = 'https://wiki-telegram-bot.onrender.com/api/suggest';
```

**Замените** `wiki-telegram-bot` на ваше имя сервиса!

## Шаг 4: Загрузите обновленный сайт на GitHub Pages

### 4.1 Обновите файлы сайта в репозитории

```bash
cd C:\Users\Lenovo\Desktop\claude
git add telegram-bot.js
git commit -m "Update bot URL for Render deployment"
git push
```

### 4.2 Если сайт на другом репозитории

Если ваш сайт в репозитории `rezeast1/test1`:

1. Скопируйте обновленный `telegram-bot.js` в папку сайта
2. Закоммитьте и запушьте:
```bash
git add telegram-bot.js
git commit -m "Update bot URL"
git push
```

## Шаг 5: Тестирование

1. Откройте ваш сайт: https://rezeast1.github.io/test1/
2. Нажмите **"Предложить тему"**
3. Заполните форму и отправьте
4. **Важно**: Первый запрос может занять 30-60 секунд (бот просыпается)
5. Проверьте Telegram - должно прийти сообщение!

## Важные моменты

### ⏰ Бот засыпает после 15 минут неактивности

Это нормально для бесплатного плана Render. Когда приходит запрос:
1. Render автоматически будит бот (~30 секунд)
2. Запрос обрабатывается
3. Сообщение отправляется в Telegram

Пользователь увидит небольшую задержку при первом запросе после простоя.

### 🔄 Автоматические обновления

Когда вы пушите изменения в GitHub:
1. Render автоматически обнаруживает изменения
2. Перезапускает бота с новым кодом
3. Никаких дополнительных действий не требуется!

### 📊 Мониторинг

В панели Render вы можете:
- Смотреть логи в реальном времени
- Видеть статус бота (Live/Sleeping)
- Проверять использование ресурсов
- Перезапускать сервис вручную

### 🔒 Безопасность

Токен бота находится в коде, но репозиторий можно сделать приватным:
1. Откройте репозиторий на GitHub
2. Settings → Danger Zone → Change visibility → Make private

Или используйте переменные окружения (см. ниже).

## Дополнительно: Использование переменных окружения

Для большей безопасности можно вынести токен в переменные окружения:

### 1. Обновите bot.py

Замените строку 12:
```python
TOKEN = "8374209578:AAG2nCNoi9rct_cZQFNVhMDWkyqPxJZ6xTo"
```

На:
```python
import os
TOKEN = os.environ.get('BOT_TOKEN', '8374209578:AAG2nCNoi9rct_cZQFNVhMDWkyqPxJZ6xTo')
```

### 2. Добавьте переменную в Render

1. В панели Render откройте ваш сервис
2. Перейдите в **Environment**
3. Нажмите **Add Environment Variable**
4. Key: `BOT_TOKEN`
5. Value: `8374209578:AAG2nCNoi9rct_cZQFNVhMDWkyqPxJZ6xTo`
6. Нажмите **Save Changes**

Теперь токен не будет виден в коде!

## Возможные проблемы

### Ошибка: "Failed to fetch"

**Причина:** Неправильный URL или бот спит.

**Решение:**
1. Проверьте URL в `telegram-bot.js`
2. Убедитесь, что бот в статусе **Live** в Render
3. Подождите 30-60 секунд для первого запроса

### Ошибка: "Build failed"

**Причина:** Проблема с зависимостями.

**Решение:**
1. Проверьте `requirements.txt`
2. Убедитесь, что все файлы загружены в GitHub
3. Проверьте логи в Render

### Бот не отвечает

**Причина:** Бот не запущен или ошибка в коде.

**Решение:**
1. Откройте логи в Render
2. Проверьте, есть ли сообщение "Бот запущен и готов к работе..."
3. Если есть ошибки - исправьте код и запушьте

### CORS ошибки

**Причина:** Проблемы с кросс-доменными запросами.

**Решение:** В коде уже настроены CORS заголовки (`Access-Control-Allow-Origin: *`), должно работать.

## Лимиты бесплатного плана Render

✅ **750 часов/месяц** - достаточно для 24/7 работы одного сервиса
✅ **512 MB RAM** - достаточно для бота
✅ **Неограниченный трафик**
❌ **Засыпает после 15 минут неактивности**
❌ **Медленный старт** (~30 секунд при пробуждении)

Для вики с предложениями тем этого более чем достаточно!

## Готово!

Теперь ваш бот работает 24/7 в облаке, и предложения тем приходят с любого устройства! 🎉

**Полезные ссылки:**
- Панель Render: https://dashboard.render.com/
- Документация Render: https://render.com/docs
- Ваш бот: https://wiki-telegram-bot.onrender.com (замените на ваш URL)
