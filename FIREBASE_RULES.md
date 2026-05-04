# 🔧 ПРАВИЛА БЕЗОПАСНОСТИ FIREBASE

## Скопируйте эти правила в Firebase Console

1. Откройте https://console.firebase.google.com/
2. Выберите проект **topglass-82657**
3. Перейдите в **Realtime Database**
4. Перейдите на вкладку **Rules**
5. Замените ВСЕ содержимое на это:

```json
{
  "rules": {
    "users": {
      ".read": true,
      "$uid": {
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

6. Нажмите **Publish**

## ⚠️ Почему `users` доступен для чтения всем?

При входе система должна найти пользователя по username ДО авторизации.
Это безопасно, потому что:
- Пароли НЕ хранятся в `users` (они в Firebase Authentication)
- Видны только username, имя и дата регистрации
- Записывать могут только владелец или админ

## ✅ После применения правил:

1. Перезагрузите страницу (F5)
2. Попробуйте войти или зарегистрироваться
3. Должно работать!
