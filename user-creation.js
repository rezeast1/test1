// ===== СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ ЧЕРЕЗ REST API =====

// Функция для создания пользователя через Firebase REST API
async function createUserViaRestAPI(email, password, displayName) {
    const API_KEY = "AIzaSyBd9wDDKNYFRpd07piB4rW6JVkPZGLl9ek";

    try {
        // Создаём пользователя через REST API
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return {
            uid: data.localId,
            email: data.email
        };
    } catch (error) {
        console.error('Ошибка создания через REST API:', error);
        throw error;
    }
}

// Экспортируем функцию
window.createUserViaRestAPI = createUserViaRestAPI;
