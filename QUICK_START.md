# 🚀 БЫСТРЫЙ СТАРТ - Авторизация по Username

## ✅ Система изменена: теперь вход по USERNAME, а не по email!

---

## Шаг 1: Создайте администратора в Firebase

### 1.1 Создайте пользователя в Authentication

1. Откройте https://console.firebase.google.com/
2. Выберите проект **topglass-82657**
3. Перейдите в **Authentication** → **Users**
4. Нажмите **Add user**
5. Введите:
   ```
   Email: admin@topglass.local
   Password: admin123
   ```
   ⚠️ **Важно**: Email должен быть в формате `username@topglass.local`
6. Нажмите **Add user**
7. **Скопируйте UID** пользователя (например: `7CqS6bZwmuez2BBPY8TQjnZde0K2`)

### 1.2 Добавьте данные пользователя в Realtime Database

1. Перейдите в **Realtime Database**
2. Нажмите **+** рядом с корнем базы
3. Создайте структуру `users`:
   ```
   Name: users
   ```
4. Нажмите **+** внутри `users`
5. Введите:
   ```
   Name: [вставьте UID из шага 1.1]
   ```
6. Нажмите **+** внутри UID и добавьте поля:
   ```
   username: "admin"
   name: "Администратор"
   email: "admin@topglass.local"
   createdAt: 1714813062000
   role: "user"
   ```

Должна получиться структура:
```
users/
  └── 7CqS6bZwmuez2BBPY8TQjnZde0K2/
        ├── username: "admin"
        ├── name: "Администратор"
        ├── email: "admin@topglass.local"
        ├── createdAt: 1714813062000
        └── role: "user"
```

### 1.3 Назначьте права администратора

1. В Realtime Database нажмите **+** рядом с корнем
2. Создайте структуру `admins`:
   ```
   Name: admins
   ```
3. Нажмите **+** внутри `admins`
4. Введите:
   ```
   Name: [вставьте тот же UID]
   ```
5. Нажмите **+** внутри UID
6. Введите:
   ```
   Name: role
   Value: admin
   ```

Должна получиться структура:
```
admins/
  └── 7CqS6bZwmuez2BBPY8TQjnZde0K2/
        └── role: "admin"
```

---

## Шаг 2: Настройте правила безопасности

1. В **Realtime Database** перейдите на вкладку **Rules**
2. Замените правила на эти:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).exists())"
      }
    },
    "admins": {
      ".read": "auth != null",
      ".write": false
    },
    "articles": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "articleViews": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "suggestions": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null"
    }
  }
}
```

3. Нажмите **Publish**

---

## Шаг 3: Войдите на сайт

1. Откройте `index.html` в браузере
2. Вы увидите форму входа
3. Введите:
   ```
   Имя пользователя: admin
   Пароль: admin123
   ```
4. Нажмите **Войти**

### ✅ После входа вы увидите:

- В шапке: **Администратор** (ваше имя)
- Кнопку **"Управление пользователями"** (фиолетовая)
- Кнопку **"Добавить тему"** (синяя)
- Кнопку **"Сбросить просмотры"**
- Кнопку **"Выйти"** (красная)
- На каждой статье: ✏️ (редактировать) и 🗑️ (удалить)

---

## 📝 Создание новых пользователей

### Через форму регистрации (рекомендуется):

1. Откройте сайт
2. Перейдите на вкладку **"Регистрация"**
3. Заполните:
   - **Имя пользователя**: `user1` (минимум 3 символа)
   - **Полное имя**: `Тестовый пользователь`
   - **Пароль**: `test123` (минимум 6 символов)
   - **Подтвердите пароль**: `test123`
4. Нажмите **Зарегистрироваться**
5. Пользователь автоматически получит роль "user"

### Вручную через Firebase:

1. **Authentication** → **Add user**:
   ```
   Email: username@topglass.local
   Password: password123
   ```
2. **Realtime Database** → `users/[UID]`:
   ```
   username: "username"
   name: "Имя пользователя"
   email: "username@topglass.local"
   createdAt: [timestamp]
   role: "user"
   ```

---

## 🔍 Проверка в консоли браузера

Откройте консоль (F12) и проверьте логи:

```
✅ Пользователь авторизован: admin@topglass.local
🔑 UID пользователя: 7CqS6bZwmuez2BBPY8TQjnZde0K2
🔍 Проверка прав администратора для UID: 7CqS6bZwmuez2BBPY8TQjnZde0K2
📊 Результат проверки администратора: true
👤 Является администратором: true
✅ Показаны элементы управления администратора
```

Если видите `false` вместо `true` - проверьте структуру `admins/` в Firebase.

---

## ⚠️ Частые проблемы

### Проблема: "Permission denied"
**Решение**: Проверьте правила безопасности в Realtime Database (Шаг 2)

### Проблема: "Пользователь не найден"
**Решение**: Убедитесь, что в `users/[UID]/username` есть правильный username

### Проблема: Нет кнопок администратора
**Решение**: Проверьте, что UID в `admins/` совпадает с UID в `users/`

### Проблема: "Ошибка загрузки пользователей"
**Решение**: Проверьте правила безопасности - `users` должен быть доступен для чтения всем авторизованным

---

## 🎉 Готово!

Теперь система работает с **username** вместо email!

- Вход: **username** + пароль
- Регистрация: **username** + имя + пароль
- В шапке отображается **имя пользователя**
- В панели управления показывается **username**
