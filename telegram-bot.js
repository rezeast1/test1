// Telegram Bot Configuration - ОТКЛЮЧЕНО
// Все предложения теперь сохраняются только в Firebase

// Отправить предложение темы (теперь только в Firebase)
async function sendSuggestionToTelegram(title, keywords, content, email) {
    // Функция оставлена для совместимости, но отправка в Telegram отключена
    console.log('Отправка в Telegram отключена. Предложение будет сохранено только в Firebase.');
    return { success: true };
}

// Сохранить предложение в Firebase
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
        date: new Date().toISOString(),
        status: 'pending'
    };

    try {
        await suggestionsRef.push(newSuggestion);
        console.log('Предложение сохранено в Firebase');
    } catch (error) {
        console.error('Ошибка сохранения в Firebase:', error);
    }
}
