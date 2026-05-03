// Telegram Bot Configuration
// Отправка через Render бот-сервер

const BOT_SERVER_URL = 'https://test1-1-cd2h.onrender.com/api/suggest';

// Отправить предложение темы через бот-сервер
async function sendSuggestionToTelegram(title, keywords, content, email) {
    const date = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const data = {
        title: title,
        keywords: keywords,
        content: content,
        email: email,
        date: date,
        telegramUser: telegramUser ? {
            id: telegramUser.id,
            username: telegramUser.username || 'не указан',
            first_name: telegramUser.first_name || '',
            last_name: telegramUser.last_name || ''
        } : null
    };

    try {
        const response = await fetch(BOT_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Ошибка отправки');
        }

        return result;
    } catch (error) {
        console.error('Ошибка отправки предложения:', error);

        // Проверяем, запущен ли бот
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Бот не запущен. Пожалуйста, запустите Python бота (import asyncio.py)');
        }

        throw error;
    }
}

// Сохранить предложение в Firebase (опционально)
async function saveSuggestionToFirebase(title, keywords, content, email) {
    if (!database) {
        console.log('Firebase не инициализирован, предложение не сохранено в БД');
        return;
    }

    const suggestionsRef = database.ref('suggestions');
    const newSuggestion = {
        title: title,
        keywords: keywords,
        content: content,
        email: email,
        timestamp: Date.now(),
        date: new Date().toISOString()
    };

    try {
        await suggestionsRef.push(newSuggestion);
        console.log('Предложение сохранено в Firebase');
    } catch (error) {
        console.error('Ошибка сохранения в Firebase:', error);
    }
}
