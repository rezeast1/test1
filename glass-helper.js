// ===== ПОМОЩНИК ЗАМЕНЫ СТЁКОЛ =====

// Элементы главного меню
const mainMenu = document.getElementById('mainMenu');
const testingBtn = document.getElementById('testingBtn');
const knowledgeBaseBtn = document.getElementById('knowledgeBaseBtn');
const glassHelperBtn = document.getElementById('glassHelperBtn');

// Разделы
const knowledgeBaseSection = document.getElementById('knowledgeBaseSection');
const glassHelperSection = document.getElementById('glassHelperSection');
const testingSection = document.getElementById('testingSection');

// Кнопки возврата в меню
const backToMenuFromKB = document.getElementById('backToMenuFromKB');
const backToMenuFromGlass = document.getElementById('backToMenuFromGlass');
const backToMenuFromTest = document.getElementById('backToMenuFromTest');

// Элементы поиска стёкол
const glassSearchInput = document.getElementById('glassSearchInput');
const glassResults = document.getElementById('glassResults');
const suggestGlassBtn = document.getElementById('suggestGlassBtn');
const manageGlassBtn = document.getElementById('manageGlassBtn');

// Модальные окна
const suggestGlassModal = document.getElementById('suggestGlassModal');
const closeSuggestGlass = document.getElementById('closeSuggestGlass');
const cancelSuggestGlass = document.getElementById('cancelSuggestGlass');
const suggestGlassForm = document.getElementById('suggestGlassForm');

const manageGlassModal = document.getElementById('manageGlassModal');
const closeManageGlass = document.getElementById('closeManageGlass');
const addGlassLinkBtn = document.getElementById('addGlassLinkBtn');
const glassLinksList = document.getElementById('glassLinksList');

const addGlassLinkModal = document.getElementById('addGlassLinkModal');
const closeAddGlassLink = document.getElementById('closeAddGlassLink');
const cancelAddGlassLink = document.getElementById('cancelAddGlassLink');
const addGlassLinkForm = document.getElementById('addGlassLinkForm');

// Показать главное меню
function showMainMenu() {
    mainMenu.classList.remove('hidden');
    knowledgeBaseSection.classList.add('hidden');
    glassHelperSection.classList.add('hidden');
    testingSection.classList.add('hidden');
}

// Показать раздел База знаний
function showKnowledgeBase() {
    mainMenu.classList.add('hidden');
    knowledgeBaseSection.classList.remove('hidden');
    glassHelperSection.classList.add('hidden');
    testingSection.classList.add('hidden');
}

// Показать раздел Помощник замены стёкол
function showGlassHelper() {
    mainMenu.classList.add('hidden');
    knowledgeBaseSection.classList.add('hidden');
    glassHelperSection.classList.remove('hidden');
    testingSection.classList.add('hidden');
}

// Показать раздел Тестирование
function showTesting() {
    mainMenu.classList.add('hidden');
    knowledgeBaseSection.classList.add('hidden');
    glassHelperSection.classList.add('hidden');
    testingSection.classList.remove('hidden');
}

// Обработчики кнопок главного меню
testingBtn?.addEventListener('click', showTesting);
knowledgeBaseBtn?.addEventListener('click', showKnowledgeBase);
glassHelperBtn?.addEventListener('click', showGlassHelper);

// Обработчики кнопок возврата в меню
backToMenuFromKB?.addEventListener('click', showMainMenu);
backToMenuFromGlass?.addEventListener('click', showMainMenu);
backToMenuFromTest?.addEventListener('click', showMainMenu);

// ===== ПОИСК СОВМЕСТИМЫХ СТЁКОЛ =====

// Поиск стёкол
async function searchGlass() {
    const query = glassSearchInput.value.trim();

    if (!query) {
        glassResults.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">Введите модель телефона для поиска</p>';
        return;
    }

    glassResults.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">Поиск...</p>';

    try {
        if (!database) {
            throw new Error('Firebase не инициализирован');
        }

        // Ищем в базе данных
        const glassLinksRef = database.ref('glassLinks');
        const snapshot = await glassLinksRef.once('value');
        const glassLinks = snapshot.val();

        if (!glassLinks) {
            glassResults.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">Совместимые стёкла не найдены</p>';
            return;
        }

        // Нормализуем запрос для поиска
        const normalizedQuery = query.toLowerCase().trim();
        let found = false;
        let html = '';

        // Ищем совпадения
        Object.keys(glassLinks).forEach(linkId => {
            const link = glassLinks[linkId];
            const normalizedModel = link.phoneModel.toLowerCase();

            // Проверяем точное совпадение или частичное
            if (normalizedModel.includes(normalizedQuery) || normalizedQuery.includes(normalizedModel)) {
                found = true;

                // Формируем список совместимых моделей (каждая на новой строке)
                const compatibleList = link.compatibleModels
                    .map(model => `<div class="compatible-model-item">${model}</div>`)
                    .join('');

                html += `
                    <div class="glass-result-item">
                        <div class="glass-model-name">${link.phoneModel}</div>
                        <div class="glass-compatible-list">
                            <strong>Совместимые стёкла:</strong>
                            <div class="compatible-models-container">
                                ${compatibleList}
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        if (found) {
            glassResults.innerHTML = html;
        } else {
            glassResults.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">Совместимые стёкла не найдены. Попробуйте другой запрос или предложите совместимость.</p>';
        }

    } catch (error) {
        console.error('Ошибка поиска:', error);
        glassResults.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 40px;">Ошибка поиска. Попробуйте позже.</p>';
    }
}

// Живой поиск при вводе текста
let glassSearchTimeout;
glassSearchInput?.addEventListener('input', () => {
    clearTimeout(glassSearchTimeout);
    glassSearchTimeout = setTimeout(() => {
        searchGlass();
    }, 300); // Задержка 300мс для оптимизации
});

// ===== ПРЕДЛОЖЕНИЕ СОВМЕСТИМОСТИ =====

// Открыть модальное окно предложения
suggestGlassBtn?.addEventListener('click', () => {
    suggestGlassModal.classList.remove('hidden');
});

// Закрыть модальное окно
closeSuggestGlass?.addEventListener('click', () => {
    suggestGlassModal.classList.add('hidden');
    suggestGlassForm.reset();
});

cancelSuggestGlass?.addEventListener('click', () => {
    suggestGlassModal.classList.add('hidden');
    suggestGlassForm.reset();
});

// Отправка предложения
suggestGlassForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phoneModel = document.getElementById('suggestPhoneModel').value.trim();
    const compatibleGlass = document.getElementById('suggestCompatibleGlass').value.trim();
    const comment = document.getElementById('suggestGlassComment').value.trim();

    if (!phoneModel || !compatibleGlass) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    const submitBtn = suggestGlassForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
        if (!database) {
            throw new Error('Firebase не инициализирован');
        }

        // Сохраняем предложение в Firebase
        const suggestionsRef = database.ref('glassSuggestions');
        const newSuggestionRef = suggestionsRef.push();

        await newSuggestionRef.set({
            phoneModel: phoneModel,
            compatibleGlass: compatibleGlass,
            comment: comment,
            suggestedBy: currentUser ? currentUser.email : 'Аноним',
            suggestedAt: Date.now(),
            status: 'pending'
        });

        alert('✅ Спасибо! Ваше предложение отправлено на рассмотрение.');
        suggestGlassModal.classList.add('hidden');
        suggestGlassForm.reset();

    } catch (error) {
        console.error('Ошибка отправки предложения:', error);
        alert('❌ Ошибка отправки. Попробуйте позже.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ===== УПРАВЛЕНИЕ СВЯЗКАМИ (ТОЛЬКО ДЛЯ АДМИНА) =====

// Показать кнопку управления для админа
function showGlassAdminControls() {
    manageGlassBtn.classList.remove('hidden');
}

// Скрыть кнопку управления
function hideGlassAdminControls() {
    manageGlassBtn.classList.add('hidden');
}

// Открыть панель управления связками
manageGlassBtn?.addEventListener('click', () => {
    manageGlassModal.classList.remove('hidden');
    loadGlassLinks();
});

// Закрыть панель управления
closeManageGlass?.addEventListener('click', () => {
    manageGlassModal.classList.add('hidden');
});

// Загрузить список связок
async function loadGlassLinks() {
    if (!database) {
        console.error('Firebase не инициализирован');
        return;
    }

    glassLinksList.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const glassLinksRef = database.ref('glassLinks');
        const snapshot = await glassLinksRef.once('value');
        const glassLinks = snapshot.val();

        if (!glassLinks || Object.keys(glassLinks).length === 0) {
            glassLinksList.innerHTML = '<div class="no-users">Нет связок стёкол</div>';
            return;
        }

        let html = '';
        Object.keys(glassLinks).forEach(linkId => {
            const link = glassLinks[linkId];
            html += `
                <div class="glass-link-item">
                    <div class="glass-link-info">
                        <div class="glass-link-model">${link.phoneModel}</div>
                        <div class="glass-link-compatible">Совместимо: ${link.compatibleModels.join(', ')}</div>
                    </div>
                    <button class="delete-glass-link-btn" data-id="${linkId}">Удалить</button>
                </div>
            `;
        });

        glassLinksList.innerHTML = html;

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-glass-link-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const linkId = btn.dataset.id;
                deleteGlassLink(linkId);
            });
        });

    } catch (error) {
        console.error('Ошибка загрузки связок:', error);
        glassLinksList.innerHTML = '<div class="error">Ошибка загрузки: ' + error.message + '</div>';
    }
}

// Открыть форму добавления связки
addGlassLinkBtn?.addEventListener('click', () => {
    addGlassLinkModal.classList.remove('hidden');
});

// Закрыть форму добавления
closeAddGlassLink?.addEventListener('click', () => {
    addGlassLinkModal.classList.add('hidden');
    addGlassLinkForm.reset();
});

cancelAddGlassLink?.addEventListener('click', () => {
    addGlassLinkModal.classList.add('hidden');
    addGlassLinkForm.reset();
});

// Добавить новую связку
addGlassLinkForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phoneModel = document.getElementById('newPhoneModel').value.trim();
    const compatibleModelsStr = document.getElementById('newCompatibleModels').value.trim();

    if (!phoneModel || !compatibleModelsStr) {
        alert('Пожалуйста, заполните все поля');
        return;
    }

    const compatibleModels = compatibleModelsStr.split(',').map(m => m.trim()).filter(m => m);

    if (compatibleModels.length === 0) {
        alert('Укажите хотя бы одну совместимую модель');
        return;
    }

    const submitBtn = addGlassLinkForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Добавление...';

    try {
        if (!database) {
            throw new Error('Firebase не инициализирован');
        }

        // Добавляем связку в Firebase
        const glassLinksRef = database.ref('glassLinks');
        const newLinkRef = glassLinksRef.push();

        await newLinkRef.set({
            phoneModel: phoneModel,
            compatibleModels: compatibleModels,
            createdAt: Date.now(),
            createdBy: currentUser ? currentUser.email : 'admin'
        });

        alert('✅ Связка успешно добавлена!');
        addGlassLinkModal.classList.add('hidden');
        addGlassLinkForm.reset();

        // Обновляем список
        loadGlassLinks();

    } catch (error) {
        console.error('Ошибка добавления связки:', error);
        alert('❌ Ошибка добавления: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Удалить связку
async function deleteGlassLink(linkId) {
    if (!confirm('Вы уверены, что хотите удалить эту связку?')) {
        return;
    }

    try {
        if (!database) {
            throw new Error('Firebase не инициализирован');
        }

        await database.ref('glassLinks/' + linkId).remove();
        alert('✅ Связка удалена');

        // Обновляем список
        loadGlassLinks();

    } catch (error) {
        console.error('Ошибка удаления связки:', error);
        alert('❌ Ошибка удаления: ' + error.message);
    }
}

// Экспортируем функции для использования в других файлах
window.showMainMenu = showMainMenu;
window.showKnowledgeBase = showKnowledgeBase;
window.showGlassHelper = showGlassHelper;
window.showGlassAdminControls = showGlassAdminControls;
window.hideGlassAdminControls = hideGlassAdminControls;
