// ===== УПРАВЛЕНИЕ СООБЩЕНИЯМИ (ТОЛЬКО ДЛЯ АДМИНА) =====

const messagesBtn = document.getElementById('messagesBtn');
const messagesModal = document.getElementById('messagesModal');
const closeMessages = document.getElementById('closeMessages');
const messagesContent = document.getElementById('messagesContent');
const messagesTabs = document.querySelectorAll('.messages-tab');

let currentMessagesTab = 'suggestions';

// Показать кнопку сообщений для админа
function showMessagesButton() {
    messagesBtn?.classList.remove('hidden');
}

// Скрыть кнопку сообщений
function hideMessagesButton() {
    messagesBtn?.classList.add('hidden');
}

// Открыть панель сообщений
messagesBtn?.addEventListener('click', () => {
    messagesModal.classList.remove('hidden');
    loadMessages(currentMessagesTab);
});

// Закрыть панель сообщений
closeMessages?.addEventListener('click', () => {
    messagesModal.classList.add('hidden');
});

// Переключение вкладок
messagesTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Убираем активный класс со всех вкладок
        messagesTabs.forEach(t => t.classList.remove('active'));
        // Добавляем активный класс на текущую вкладку
        tab.classList.add('active');

        // Загружаем сообщения для выбранной вкладки
        currentMessagesTab = tab.dataset.tab;
        loadMessages(currentMessagesTab);
    });
});

// Загрузить сообщения
async function loadMessages(type) {
    if (!database) {
        console.error('Firebase не инициализирован');
        messagesContent.innerHTML = '<div class="error">Firebase не инициализирован</div>';
        return;
    }

    messagesContent.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const messagesRef = database.ref(type);
        const snapshot = await messagesRef.once('value');
        const messages = snapshot.val();

        if (!messages || Object.keys(messages).length === 0) {
            messagesContent.innerHTML = '<div class="no-messages">Нет сообщений</div>';
            return;
        }

        let html = '';

        // Сортируем по дате (новые сверху)
        const sortedMessages = Object.keys(messages)
            .map(id => ({ id, ...messages[id] }))
            .sort((a, b) => (b.timestamp || b.suggestedAt || 0) - (a.timestamp || a.suggestedAt || 0));

        sortedMessages.forEach(message => {
            if (type === 'suggestions') {
                html += renderSuggestionMessage(message);
            } else if (type === 'glassSuggestions') {
                html += renderGlassSuggestionMessage(message);
            } else if (type === 'feedback') {
                html += renderFeedbackMessage(message);
            }
        });

        messagesContent.innerHTML = html;

        // Добавляем обработчики для кнопок
        attachMessageHandlers(type);

    } catch (error) {
        console.error('Ошибка загрузки сообщений:', error);
        messagesContent.innerHTML = '<div class="error">Ошибка загрузки: ' + error.message + '</div>';
    }
}

// Отрисовка предложенной темы
function renderSuggestionMessage(message) {
    const date = message.date || new Date(message.timestamp).toLocaleString('ru-RU');
    const status = message.status || 'pending';
    const statusText = status === 'approved' ? '✅ Одобрено' : status === 'rejected' ? '❌ Отклонено' : '⏳ Ожидает';

    return `
        <div class="message-item ${status}" data-id="${message.id}">
            <div class="message-header">
                <h3>${message.title}</h3>
                <span class="message-status">${statusText}</span>
            </div>
            <div class="message-meta">
                <span>📅 ${date}</span>
                <span>👤 ${message.suggestedBy || 'Аноним'}</span>
            </div>
            ${message.keywords ? `<div class="message-keywords"><strong>Ключевые слова:</strong> ${message.keywords}</div>` : ''}
            <div class="message-content">${message.content}</div>
            ${status === 'pending' ? `
                <div class="message-actions">
                    <button class="approve-btn" data-id="${message.id}" data-type="suggestions">✅ Одобрить</button>
                    <button class="reject-btn" data-id="${message.id}" data-type="suggestions">❌ Отклонить</button>
                    <button class="delete-msg-btn" data-id="${message.id}" data-type="suggestions">🗑️ Удалить</button>
                </div>
            ` : `
                <div class="message-actions">
                    <button class="delete-msg-btn" data-id="${message.id}" data-type="suggestions">🗑️ Удалить</button>
                </div>
            `}
        </div>
    `;
}

// Отрисовка предложенной совместимости стёкол
function renderGlassSuggestionMessage(message) {
    const date = new Date(message.suggestedAt).toLocaleString('ru-RU');
    const status = message.status || 'pending';
    const statusText = status === 'approved' ? '✅ Одобрено' : status === 'rejected' ? '❌ Отклонено' : '⏳ Ожидает';

    return `
        <div class="message-item ${status}" data-id="${message.id}">
            <div class="message-header">
                <h3>Совместимость: ${message.phoneModel}</h3>
                <span class="message-status">${statusText}</span>
            </div>
            <div class="message-meta">
                <span>📅 ${date}</span>
                <span>👤 ${message.suggestedBy || 'Аноним'}</span>
            </div>
            <div class="message-content">
                <strong>Совместимое стекло:</strong> ${message.compatibleGlass}<br>
                ${message.comment ? `<strong>Комментарий:</strong> ${message.comment}` : ''}
            </div>
            ${status === 'pending' ? `
                <div class="message-actions">
                    <button class="approve-glass-btn" data-id="${message.id}">✅ Одобрить и добавить</button>
                    <button class="reject-btn" data-id="${message.id}" data-type="glassSuggestions">❌ Отклонить</button>
                    <button class="delete-msg-btn" data-id="${message.id}" data-type="glassSuggestions">🗑️ Удалить</button>
                </div>
            ` : `
                <div class="message-actions">
                    <button class="delete-msg-btn" data-id="${message.id}" data-type="glassSuggestions">🗑️ Удалить</button>
                </div>
            `}
        </div>
    `;
}

// Отрисовка отзыва об улучшении статьи
function renderFeedbackMessage(message) {
    const date = message.date || new Date(message.timestamp).toLocaleString('ru-RU');

    return `
        <div class="message-item" data-id="${message.id}">
            <div class="message-header">
                <h3>${message.title || 'Отзыв об улучшении'}</h3>
            </div>
            <div class="message-meta">
                <span>📅 ${date}</span>
                <span>👤 ${message.suggestedBy || 'Аноним'}</span>
            </div>
            <div class="message-content">${message.content}</div>
            <div class="message-actions">
                <button class="delete-msg-btn" data-id="${message.id}" data-type="feedback">🗑️ Удалить</button>
            </div>
        </div>
    `;
}

// Добавить обработчики для кнопок
function attachMessageHandlers(type) {
    // Одобрить предложенную тему
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const messageId = btn.dataset.id;
            await approveTopicSuggestion(messageId);
        });
    });

    // Одобрить совместимость стёкол
    document.querySelectorAll('.approve-glass-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const messageId = btn.dataset.id;
            await approveGlassSuggestion(messageId);
        });
    });

    // Отклонить сообщение
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const messageId = btn.dataset.id;
            const messageType = btn.dataset.type;
            await rejectMessage(messageId, messageType);
        });
    });

    // Удалить сообщение
    document.querySelectorAll('.delete-msg-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const messageId = btn.dataset.id;
            const messageType = btn.dataset.type;
            await deleteMessage(messageId, messageType);
        });
    });
}

// Одобрить предложенную тему
async function approveTopicSuggestion(messageId) {
    if (!confirm('Одобрить это предложение? Оно будет помечено как одобренное.')) {
        return;
    }

    try {
        const messageRef = database.ref(`suggestions/${messageId}`);
        await messageRef.update({ status: 'approved' });

        alert('✅ Предложение одобрено! Теперь вы можете создать статью на основе этого предложения.');
        loadMessages(currentMessagesTab);
    } catch (error) {
        console.error('Ошибка одобрения:', error);
        alert('❌ Ошибка одобрения: ' + error.message);
    }
}

// Одобрить совместимость стёкол и добавить в базу
async function approveGlassSuggestion(messageId) {
    if (!confirm('Одобрить и добавить эту совместимость в базу данных?')) {
        return;
    }

    try {
        // Получаем данные предложения
        const suggestionRef = database.ref(`glassSuggestions/${messageId}`);
        const snapshot = await suggestionRef.once('value');
        const suggestion = snapshot.val();

        if (!suggestion) {
            throw new Error('Предложение не найдено');
        }

        // Проверяем, существует ли уже связка для этой модели
        const glassLinksRef = database.ref('glassLinks');
        const linksSnapshot = await glassLinksRef.once('value');
        const existingLinks = linksSnapshot.val() || {};

        let linkFound = false;
        let linkId = null;

        // Ищем существующую связку
        Object.keys(existingLinks).forEach(id => {
            const link = existingLinks[id];
            if (link.phoneModel.toLowerCase() === suggestion.phoneModel.toLowerCase()) {
                linkFound = true;
                linkId = id;
            }
        });

        if (linkFound) {
            // Добавляем к существующей связке
            const existingLink = existingLinks[linkId];
            const updatedModels = [...existingLink.compatibleModels];

            // Добавляем новую модель, если её ещё нет
            if (!updatedModels.includes(suggestion.compatibleGlass)) {
                updatedModels.push(suggestion.compatibleGlass);
            }

            await database.ref(`glassLinks/${linkId}`).update({
                compatibleModels: updatedModels
            });
        } else {
            // Создаём новую связку
            const newLinkRef = glassLinksRef.push();
            await newLinkRef.set({
                phoneModel: suggestion.phoneModel,
                compatibleModels: [suggestion.compatibleGlass],
                createdAt: Date.now(),
                createdBy: 'admin (из предложения)'
            });
        }

        // Помечаем предложение как одобренное
        await suggestionRef.update({ status: 'approved' });

        alert('✅ Совместимость добавлена в базу данных!');
        loadMessages(currentMessagesTab);

    } catch (error) {
        console.error('Ошибка добавления совместимости:', error);
        alert('❌ Ошибка: ' + error.message);
    }
}

// Отклонить сообщение
async function rejectMessage(messageId, messageType) {
    if (!confirm('Отклонить это предложение?')) {
        return;
    }

    try {
        const messageRef = database.ref(`${messageType}/${messageId}`);
        await messageRef.update({ status: 'rejected' });

        alert('✅ Предложение отклонено');
        loadMessages(currentMessagesTab);
    } catch (error) {
        console.error('Ошибка отклонения:', error);
        alert('❌ Ошибка отклонения: ' + error.message);
    }
}

// Удалить сообщение
async function deleteMessage(messageId, messageType) {
    if (!confirm('Удалить это сообщение? Это действие нельзя отменить.')) {
        return;
    }

    try {
        await database.ref(`${messageType}/${messageId}`).remove();
        alert('✅ Сообщение удалено');
        loadMessages(currentMessagesTab);
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('❌ Ошибка удаления: ' + error.message);
    }
}

// Экспортируем функции
window.showMessagesButton = showMessagesButton;
window.hideMessagesButton = hideMessagesButton;
