// ===== TELEGRAM WEBAPP АВТОРИЗАЦИЯ =====

let telegramUser = null;

// Проверка что сайт открыт через Telegram
function checkTelegramAuth() {
    // ВРЕМЕННО: разрешаем доступ всегда для отладки
    console.log('Проверка Telegram авторизации...');
    console.log('Telegram объект:', typeof Telegram);
    console.log('Telegram.WebApp:', typeof Telegram !== 'undefined' ? Telegram.WebApp : 'не определен');

    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        try {
            const tg = Telegram.WebApp;
            tg.ready();
            tg.expand();

            // Получаем данные пользователя
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                telegramUser = tg.initDataUnsafe.user;
                console.log('✅ Telegram пользователь получен:', telegramUser);
            } else {
                console.log('⚠️ Данные пользователя не получены');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации Telegram WebApp:', error);
        }
    } else {
        console.log('⚠️ Telegram WebApp SDK не загружен');
    }

    // ВРЕМЕННО: всегда возвращаем true
    return true;
}

// Показать сообщение об ограничении доступа
function showAccessDenied() {
    document.body.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            text-align: center;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        ">
            <div style="
                background: rgba(255, 255, 255, 0.95);
                padding: 40px;
                border-radius: 20px;
                max-width: 500px;
                color: #1f2937;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <h1 style="font-size: 2em; margin-bottom: 20px; color: #10b981;">🔒 Доступ ограничен</h1>
                <p style="font-size: 1.1em; margin-bottom: 30px; line-height: 1.6;">
                    Эта база знаний доступна только через Telegram бот.
                </p>
                <div style="
                    background: #f3f4f6;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    text-align: left;
                ">
                    <p style="font-weight: 600; margin-bottom: 10px;">Как получить доступ:</p>
                    <ol style="margin-left: 20px; line-height: 1.8;">
                        <li>Найдите бота в Telegram</li>
                        <li>Отправьте команду /start</li>
                        <li>Нажмите кнопку "Открыть Mini App 🚀"</li>
                    </ol>
                </div>
                <p style="color: #6b7280; font-size: 0.9em;">
                    Если у вас нет доступа к боту, обратитесь к администратору.
                </p>
            </div>
        </div>
    `;
}

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results');
const articleView = document.getElementById('articleView');
const articleContent = document.getElementById('articleContent');
const backBtn = document.getElementById('backBtn');
const allArticlesContainer = document.getElementById('allArticles');
const articlesList = document.getElementById('articlesList');

let useFirebase = false;
let isAdmin = false;
let quill = null;

// Инициализация Quill редактора
function initQuillEditor() {
    if (typeof Quill === 'undefined') {
        console.error('Quill не загружен');
        return;
    }

    quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Напишите содержание статьи...',
        modules: {
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ],
                handlers: {
                    image: imageHandler
                }
            }
        }
    });

    // Синхронизируем содержимое с hidden input
    quill.on('text-change', function() {
        const html = quill.root.innerHTML;
        document.getElementById('articleContentInput').value = html;
    });
}

// Обработчик кнопки "Изображение" в Quill
function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        // Показываем индикатор загрузки
        const range = quill.getSelection(true);
        quill.insertText(range.index, 'Загрузка изображения...');
        quill.setSelection(range.index + 23);

        try {
            // Загружаем на ImgBB
            const imageUrl = await uploadImageToImgBB(file);

            // Удаляем текст "Загрузка..."
            quill.deleteText(range.index, 23);

            // Вставляем изображение
            quill.insertEmbed(range.index, 'image', imageUrl);
            quill.setSelection(range.index + 1);
        } catch (error) {
            // Удаляем текст "Загрузка..." при ошибке
            quill.deleteText(range.index, 23);
            alert('❌ Ошибка загрузки изображения. Попробуйте еще раз.');
        }
    };
}

// Проверка авторизации админа при загрузке
function checkAdminAuth() {
    // Эта функция больше не используется, так как авторизация обрабатывается в auth.js
    console.log('checkAdminAuth вызвана из script.js (устарела)');
}

// Показать элементы управления для админа
function showAdminControls() {
    document.getElementById('addArticleBtn').classList.remove('hidden');
    document.getElementById('resetViewsBtn').classList.remove('hidden');
    document.getElementById('manageUsersBtn').classList.remove('hidden');
    // document.getElementById('adminLoginBtn').textContent = 'Админ-панель'; // УДАЛЕНО

    // Показываем кнопку сообщений
    if (typeof showMessagesButton === 'function') {
        showMessagesButton();
    }

    // Показываем кнопку управления стёклами
    if (typeof showGlassAdminControls === 'function') {
        showGlassAdminControls();
    }

    displayAllArticles(); // Обновляем список статей с кнопками
}

// Скрыть элементы управления админа
function hideAdminControls() {
    document.getElementById('addArticleBtn').classList.add('hidden');
    document.getElementById('resetViewsBtn').classList.add('hidden');
    document.getElementById('manageUsersBtn').classList.add('hidden');
    // document.getElementById('adminLoginBtn').textContent = 'Вход для админа'; // УДАЛЕНО

    // Скрываем кнопку сообщений
    if (typeof hideMessagesButton === 'function') {
        hideMessagesButton();
    }

    // Скрываем кнопку управления стёклами
    if (typeof hideGlassAdminControls === 'function') {
        hideGlassAdminControls();
    }

    displayAllArticles(); // Обновляем список статей без кнопок
}

// Система подсчета просмотров с поддержкой Firebase
function loadViews() {
    if (useFirebase) {
        // Загружаем статьи и просмотры из Firebase
        loadArticlesFromFirebase(() => {
            displayAllArticles();
        });
    } else {
        // Fallback на localStorage если Firebase не настроен
        console.log('Используется localStorage (Firebase не настроен)');
        const savedViews = localStorage.getItem('articleViews');
        if (savedViews) {
            const viewsData = JSON.parse(savedViews);
            articles.forEach(article => {
                if (viewsData[article.id] !== undefined) {
                    article.views = viewsData[article.id];
                }
            });
        }
        displayAllArticles();
    }
}

// Загрузить статьи из Firebase
// Загрузить статьи из Firebase
function loadArticlesFromFirebase(callback) {
    if (!database) {
        console.error('Firebase не инициализирован');
        displayAllArticles();
        return;
    }

    const articlesRef = database.ref('articles');

    articlesRef.once('value', (snapshot) => {
        const firebaseArticles = snapshot.val();

        if (!firebaseArticles || Object.keys(firebaseArticles).length === 0) {
            // Если в Firebase нет статей, загружаем из data.js
            console.log('Firebase пуст, загружаем статьи из data.js...');
            syncArticlesToFirebase();
        } else {
            // Загружаем статьи из Firebase
            articles.length = 0; // Очищаем массив
            Object.keys(firebaseArticles).forEach(id => {
                const articleId = parseInt(id);
                articles.push({
                    id: articleId,
                    ...firebaseArticles[id]
                });
            });

            displayAllArticles();
        }

        callback();
    });

    // Подписываемся на изменения ПОСЛЕ первой загрузки (только один раз)
    articlesRef.on('value', (snapshot) => {
        const firebaseArticles = snapshot.val();
        if (firebaseArticles) {
            articles.length = 0;
            Object.keys(firebaseArticles).forEach(id => {
                const articleId = parseInt(id);
                articles.push({
                    id: articleId,
                    ...firebaseArticles[id]
                });
            });
            displayAllArticles();
        }
    });
}

function saveViews() {
    if (!useFirebase) {
        // Сохраняем в localStorage если Firebase не используется
        const viewsData = {};
        articles.forEach(article => {
            viewsData[article.id] = article.views;
        });
        localStorage.setItem('articleViews', JSON.stringify(viewsData));
    }
}

function incrementViews(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (article) {
        article.views++;
        console.log(`Увеличение просмотров для статьи ${articleId}: ${article.views}`);

        if (useFirebase && database) {
            // Сохраняем обновленные просмотры в Firebase
            const articleRef = database.ref('articles/' + articleId + '/views');
            articleRef.set(article.views)
                .then(() => {
                    console.log(`✅ Просмотры сохранены в Firebase для статьи ${articleId}`);
                })
                .catch((error) => {
                    console.error(`❌ Ошибка сохранения просмотров в Firebase:`, error);
                });
        } else {
            console.log('Сохранение в localStorage');
            saveViews();
        }

        // Обновляем отображение
        displayAllArticles();
    }
}

// Обработка оценки статьи
async function handleFeedback(articleId, isHelpful) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    // Проверяем, не оценивал ли пользователь уже эту статью
    const ratedArticles = JSON.parse(localStorage.getItem('ratedArticles') || '{}');
    if (ratedArticles[articleId]) {
        alert('Вы уже оценили эту статью');
        return;
    }

    // Увеличиваем счетчик
    if (isHelpful) {
        article.helpful = (article.helpful || 0) + 1;
    } else {
        article.notHelpful = (article.notHelpful || 0) + 1;
    }

    // Сохраняем в Firebase
    if (useFirebase) {
        try {
            const articleRef = database.ref('articles/' + articleId);
            await articleRef.update({
                helpful: article.helpful,
                notHelpful: article.notHelpful
            });
        } catch (error) {
            console.error('Ошибка сохранения оценки:', error);
        }
    }

    // Отмечаем, что пользователь оценил статью
    ratedArticles[articleId] = isHelpful ? 'helpful' : 'notHelpful';
    localStorage.setItem('ratedArticles', JSON.stringify(ratedArticles));

    // Если "Не помогло", спрашиваем что не так
    if (!isHelpful) {
        const feedback = prompt('Что можно улучшить в этой статье?');
        if (feedback && feedback.trim()) {
            // Отправляем в Telegram
            await sendFeedbackToTelegram(article.title, feedback);
        }
    }

    // Обновляем отображение
    showArticle(articleId);
    alert(isHelpful ? '✅ Спасибо за оценку!' : '✅ Спасибо за отзыв! Мы улучшим эту статью.');
}

// Отправить отзыв (теперь только в Firebase)
async function sendFeedbackToTelegram(articleTitle, feedback) {
    const date = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    try {
        // Сохраняем в Firebase для панели сообщений
        if (useFirebase && database) {
            const feedbackRef = database.ref('feedback');
            await feedbackRef.push({
                title: `Отзыв о статье: ${articleTitle}`,
                content: feedback,
                timestamp: Date.now(),
                date: date
            });
            console.log('Отзыв сохранён в Firebase');
        }
    } catch (error) {
        console.error('Ошибка отправки отзыва:', error);
    }
}

function resetAllViews() {
    if (confirm('Вы уверены, что хотите сбросить все просмотры?')) {
        articles.forEach(article => {
            article.views = 0;
        });

        if (useFirebase) {
            // Сбрасываем просмотры в Firebase для каждой статьи
            articles.forEach(article => {
                const articleRef = database.ref('articles/' + article.id + '/views');
                articleRef.set(0);
            });
        } else {
            saveViews();
        }

        displayAllArticles();
        alert('Все просмотры сброшены!');
    }
}

// Стоп-слова для фильтрации
const stopWords = [
    'как', 'что', 'где', 'когда', 'почему', 'зачем', 'кто', 'чем', 'какой', 'какая', 'какие',
    'это', 'этот', 'эта', 'эти', 'тот', 'та', 'те', 'мне', 'мой', 'моя', 'мои',
    'в', 'на', 'с', 'по', 'из', 'к', 'у', 'о', 'об', 'от', 'до', 'для', 'при', 'через',
    'я', 'ты', 'он', 'она', 'мы', 'вы', 'они', 'надо', 'нужно', 'можно', 'ли', 'делать'
];

function normalizeText(text) {
    return text.toLowerCase().trim();
}

// Простой стемминг для русского языка
function stem(word) {
    word = normalizeText(word);

    // Минимальная длина слова для стемминга
    if (word.length < 4) return word;

    // Удаляем распространённые окончания
    const endings = [
        'ение', 'ание', 'ость', 'ение', 'ание',
        'ени', 'ани', 'ость', 'ени', 'ани',
        'ать', 'ять', 'еть', 'ить', 'ыть',
        'ющ', 'ащ', 'ущ', 'ящ',
        'ова', 'ева', 'ыва', 'ива',
        'ов', 'ев', 'ив', 'ыв',
        'ом', 'ем', 'им', 'ым',
        'ой', 'ей', 'ий', 'ый',
        'ая', 'яя', 'ое', 'ее',
        'ие', 'ые', 'ую', 'юю',
        'ам', 'ям', 'ах', 'ях',
        'ами', 'ями',
        'ы', 'и', 'а', 'я', 'у', 'ю', 'о', 'е'
    ];

    for (let ending of endings) {
        if (word.endsWith(ending) && word.length - ending.length >= 3) {
            return word.slice(0, -ending.length);
        }
    }

    return word;
}

// Удаление стоп-слов и разбиение на ключевые слова
function extractKeywords(query) {
    const normalized = normalizeText(query);
    const words = normalized.split(/\s+/);

    // Убираем стоп-слова и знаки препинания
    const keywords = words
        .map(word => word.replace(/[?!.,;:]/g, ''))
        .filter(word => word.length > 2 && !stopWords.includes(word));

    return keywords;
}

function highlightText(text, query) {
    if (!query) return text;

    const keywords = extractKeywords(query);
    let result = text;

    keywords.forEach(keyword => {
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`([\\wа-яА-ЯёЁ]*${escapedKeyword}[\\wа-яА-ЯёЁ]*)`, 'gi');
        result = result.replace(regex, '<span class="highlight">$1</span>');
    });

    return result;
}

function searchArticles(query) {
    if (!query) {
        resultsContainer.innerHTML = '<div class="no-results">Введите запрос для поиска</div>';
        resultsContainer.classList.remove('empty');
        return;
    }

    const keywords = extractKeywords(query);

    if (keywords.length === 0) {
        resultsContainer.classList.remove('empty');
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>Попробуйте уточнить запрос</p>
                <p>Например: "открыть кассу" или "возврат товара"</p>
            </div>
        `;
        return;
    }

    const exactResults = [];
    const stemResults = [];

    articles.forEach(article => {
        let exactScore = 0;
        let stemScore = 0;
        let exactTitleMatch = false;
        let exactKeywordsMatch = false;
        let exactContentMatch = false;
        let stemTitleMatch = false;
        let stemKeywordsMatch = false;
        let stemContentMatch = false;

        const normalizedTitle = normalizeText(article.title);
        const normalizedContent = normalizeText(article.content);
        const normalizedKeywords = article.keywords.map(k => normalizeText(k));

        // Стеммированные версии
        const stemmedTitle = normalizedTitle.split(/\s+/).map(w => stem(w)).join(' ');
        const stemmedContent = normalizedContent.split(/\s+/).map(w => stem(w)).join(' ');
        const stemmedKeywords = normalizedKeywords.map(k => k.split(/\s+/).map(w => stem(w)).join(' '));

        keywords.forEach(keyword => {
            const stemmedKeyword = stem(keyword);

            // Точное совпадение (высокий приоритет)
            if (normalizedTitle.includes(keyword)) {
                exactScore += 10;
                exactTitleMatch = true;
            }
            if (normalizedKeywords.some(k => k.includes(keyword))) {
                exactScore += 5;
                exactKeywordsMatch = true;
            }
            if (normalizedContent.includes(keyword)) {
                exactScore += 2;
                exactContentMatch = true;
            }

            // Стемминг совпадение (средний приоритет)
            if (stemmedTitle.includes(stemmedKeyword)) {
                stemScore += 7;
                stemTitleMatch = true;
            }
            if (stemmedKeywords.some(k => k.includes(stemmedKeyword))) {
                stemScore += 4;
                stemKeywordsMatch = true;
            }
            if (stemmedContent.includes(stemmedKeyword)) {
                stemScore += 1;
                stemContentMatch = true;
            }

            // Префиксный поиск (низкий приоритет)
            if (normalizedTitle.split(/\s+/).some(w => w.startsWith(keyword))) {
                stemScore += 3;
                stemTitleMatch = true;
            }
            if (normalizedKeywords.some(k => k.split(/\s+/).some(w => w.startsWith(keyword)))) {
                stemScore += 2;
                stemKeywordsMatch = true;
            }
        });

        if (exactScore > 0) {
            exactResults.push({
                article: article,
                score: exactScore,
                titleMatch: exactTitleMatch,
                keywordsMatch: exactKeywordsMatch,
                contentMatch: exactContentMatch
            });
        } else if (stemScore > 0) {
            stemResults.push({
                article: article,
                score: stemScore,
                titleMatch: stemTitleMatch,
                keywordsMatch: stemKeywordsMatch,
                contentMatch: stemContentMatch
            });
        }
    });

    // Сортируем по релевантности
    exactResults.sort((a, b) => b.score - a.score);
    stemResults.sort((a, b) => b.score - a.score);

    displayResults(exactResults, stemResults, query);
}

function displayResults(exactResults, stemResults, query) {
    if (exactResults.length === 0 && stemResults.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Ничего не найдено. Попробуйте другой запрос.</div>';
        resultsContainer.classList.remove('empty');
        return;
    }

    let html = '';

    // Точные совпадения
    if (exactResults.length > 0) {
        const titleMatches = exactResults.filter(r => r.titleMatch);
        const keywordMatches = exactResults.filter(r => !r.titleMatch && r.keywordsMatch);
        const contentMatches = exactResults.filter(r => !r.titleMatch && !r.keywordsMatch && r.contentMatch);

        if (titleMatches.length > 0) {
            html += '<div class="results-section">';
            html += '<h3>📌 Найдено в заголовках</h3>';
            titleMatches.forEach(result => {
                const article = result.article;
                const snippet = article.content.substring(0, 150) + '...';

                html += `
                    <div class="result-item" data-id="${article.id}">
                        <div class="result-title">${highlightText(article.title, query)}</div>
                        <div class="result-keywords">
                            <strong>Ключевые слова:</strong> ${article.keywords.map(k => highlightText(k, query)).join(', ')}
                        </div>
                        <div class="result-snippet">${highlightText(snippet, query)}</div>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (keywordMatches.length > 0) {
            html += '<div class="results-section">';
            html += '<h3>🔑 Найдено в ключевых словах</h3>';
            keywordMatches.forEach(result => {
                const article = result.article;
                const snippet = article.content.substring(0, 150) + '...';

                html += `
                    <div class="result-item" data-id="${article.id}">
                        <div class="result-title">${highlightText(article.title, query)}</div>
                        <div class="result-keywords">
                            <strong>Ключевые слова:</strong> ${article.keywords.map(k => highlightText(k, query)).join(', ')}
                        </div>
                        <div class="result-snippet">${highlightText(snippet, query)}</div>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (contentMatches.length > 0) {
            html += '<div class="results-section">';
            html += '<h3>📄 Найдено в содержании</h3>';
            contentMatches.forEach(result => {
                const article = result.article;
                const normalizedContent = normalizeText(article.content);
                const keywords = extractKeywords(query);

                let snippet = '';
                let foundIndex = -1;

                for (let keyword of keywords) {
                    const index = normalizedContent.indexOf(keyword);
                    if (index !== -1 && (foundIndex === -1 || index < foundIndex)) {
                        foundIndex = index;
                    }
                }

                if (foundIndex !== -1) {
                    const start = Math.max(0, foundIndex - 50);
                    const end = Math.min(article.content.length, foundIndex + 100);
                    snippet = (start > 0 ? '...' : '') +
                             article.content.substring(start, end) +
                             (end < article.content.length ? '...' : '');
                } else {
                    snippet = article.content.substring(0, 150) + '...';
                }

                html += `
                    <div class="result-item" data-id="${article.id}">
                        <div class="result-title">${highlightText(article.title, query)}</div>
                        <div class="result-keywords">
                            <strong>Ключевые слова:</strong> ${article.keywords.map(k => highlightText(k, query)).join(', ')}
                        </div>
                        <div class="result-snippet">${highlightText(snippet, query)}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
    }

    // Похожие результаты (стемминг)
    if (stemResults.length > 0) {
        html += '<div class="results-section">';
        html += '<h3>💡 Возможно вы искали?</h3>';
        stemResults.forEach(result => {
            const article = result.article;
            const snippet = article.content.substring(0, 150) + '...';

            html += `
                <div class="result-item" data-id="${article.id}">
                    <div class="result-title">${article.title}</div>
                    <div class="result-keywords">
                        <strong>Ключевые слова:</strong> ${article.keywords.join(', ')}
                    </div>
                    <div class="result-snippet">${snippet}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    resultsContainer.innerHTML = html;
    resultsContainer.classList.remove('empty');

    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
            const articleId = parseInt(item.dataset.id);
            showArticle(articleId);
        });
    });
}

function showArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;

    // Увеличиваем счетчик просмотров
    incrementViews(id);

    // Контент уже в HTML формате из Quill, просто выводим его
    const contentHtml = article.content;

    // Формируем HTML для изображений
    let imagesHtml = '';
    if (article.images && article.images.length > 0) {
        imagesHtml = '<div class="article-media">';
        article.images.forEach(imageUrl => {
            imagesHtml += `<img src="${imageUrl}" alt="${article.title}" loading="lazy">`;
        });
        imagesHtml += '</div>';
    }

    // Формируем HTML для видео
    let videosHtml = '';
    if (article.videos && article.videos.length > 0) {
        videosHtml = '<div class="article-media">';
        article.videos.forEach(videoUrl => {
            videosHtml += `<video src="${videoUrl}" controls preload="metadata"></video>`;
        });
        videosHtml += '</div>';
    }

    const totalRatings = (article.helpful || 0) + (article.notHelpful || 0);
    const helpfulPercent = totalRatings > 0 ? Math.round((article.helpful / totalRatings) * 100) : 0;

    articleContent.innerHTML = `
        <h2>${article.title}</h2>
        <div class="article-meta">
            <strong>Ключевые слова:</strong> ${article.keywords.join(', ')}
            <br>
            <strong>Просмотров:</strong> ${article.views}
        </div>
        <div class="article-body">
            ${contentHtml}
        </div>
        ${imagesHtml}
        ${videosHtml}
        <div class="article-feedback">
            <p class="feedback-question">Эта статья была полезна?</p>
            <div class="feedback-buttons">
                <button class="feedback-btn helpful-btn" data-id="${article.id}">
                    👍 Помогло <span class="feedback-count">${article.helpful || 0}</span>
                </button>
                <button class="feedback-btn not-helpful-btn" data-id="${article.id}">
                    👎 Не помогло <span class="feedback-count">${article.notHelpful || 0}</span>
                </button>
            </div>
            ${totalRatings > 0 ? `<p class="feedback-stats">${helpfulPercent}% считают эту статью полезной</p>` : ''}
        </div>
    `;

    // Добавляем обработчики для кнопок оценки
    document.querySelectorAll('.helpful-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFeedback(parseInt(btn.dataset.id), true));
    });

    document.querySelectorAll('.not-helpful-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFeedback(parseInt(btn.dataset.id), false));
    });

    resultsContainer.classList.add('empty');
    allArticlesContainer.style.display = 'none';
    articleView.classList.remove('hidden');
    window.scrollTo(0, 0);
}

function hideArticle() {
    articleView.classList.add('hidden');
    // Очищаем поиск и скрываем результаты
    searchInput.value = '';
    resultsContainer.innerHTML = '';
    resultsContainer.classList.add('empty');
    allArticlesContainer.style.display = 'block';
}

function displayAllArticles() {
    // Сортируем статьи по количеству просмотров (от большего к меньшему)
    const sortedArticles = [...articles].sort((a, b) => b.views - a.views);

    let html = '';
    sortedArticles.forEach(article => {
        html += `
            <div class="article-item">
                <a href="#" class="article-link" data-id="${article.id}">
                    <span class="article-title">${article.title}</span>
                    <span class="article-views">👁 ${article.views}</span>
                </a>
                ${isAdmin ? `
                    <div class="article-admin-controls">
                        <button class="edit-article-btn" data-id="${article.id}" title="Редактировать">✏️</button>
                        <button class="delete-article-btn" data-id="${article.id}" title="Удалить">🗑️</button>
                    </div>
                ` : ''}
            </div>
        `;
    });
    articlesList.innerHTML = html;

    // Обработчики для ссылок на статьи
    document.querySelectorAll('.article-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const articleId = parseInt(link.dataset.id);
            showArticle(articleId);
        });
    });

    // Обработчики для кнопок редактирования (только для админа)
    if (isAdmin) {
        document.querySelectorAll('.edit-article-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const articleId = parseInt(btn.dataset.id);
                openEditArticleModal(articleId);
            });
        });

        document.querySelectorAll('.delete-article-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const articleId = parseInt(btn.dataset.id);
                deleteArticle(articleId);
            });
        });
    }
}

// Живой поиск с задержкой (debounce)
let searchTimeout;
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();

    // Очищаем предыдущий таймер
    clearTimeout(searchTimeout);

    if (query === '') {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('empty');
        allArticlesContainer.style.display = 'block';
    } else {
        // Задержка 300мс перед поиском
        searchTimeout = setTimeout(() => {
            searchArticles(query);
            allArticlesContainer.style.display = 'none';
        }, 300);
    }
});

backBtn.addEventListener('click', hideArticle);

// Клик на заголовок TopGlass возвращает к списку тем
document.querySelector('header h1').addEventListener('click', () => {
    // Скрываем статью если открыта
    articleView.classList.add('hidden');
    // Очищаем поиск
    searchInput.value = '';
    resultsContainer.innerHTML = '';
    resultsContainer.classList.add('empty');
    // Показываем список всех статей
    allArticlesContainer.style.display = 'block';
    window.scrollTo(0, 0);
});

// Делаем заголовок кликабельным
document.querySelector('header h1').style.cursor = 'pointer';

// Авторизация админа
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginBtn = document.getElementById('adminLoginBtn'); // Удалена из HTML
const closeAdminLogin = document.getElementById('closeAdminLogin');
const cancelAdminLogin = document.getElementById('cancelAdminLogin');
const adminLoginForm = document.getElementById('adminLoginForm');

// Открыть/закрыть модальное окно входа
// ЗАКОММЕНТИРОВАНО: кнопка adminLoginBtn удалена из HTML
/*
adminLoginBtn.addEventListener('click', () => {
    if (isAdmin) {
        // Выход
        if (confirm('Выйти из режима администратора?')) {
            // Выход из Firebase Auth
            if (auth) {
                auth.signOut().then(() => {
                    isAdmin = false;
                    hideAdminControls();
                    alert('Вы вышли из режима администратора');
                });
            } else {
                isAdmin = false;
                hideAdminControls();
                alert('Вы вышли из режима администратора');
            }
        }
    } else {
        // Вход
        adminLoginModal.classList.remove('hidden');
    }
});

closeAdminLogin.addEventListener('click', () => {
    adminLoginModal.classList.add('hidden');
    adminLoginForm.reset();
});

cancelAdminLogin.addEventListener('click', () => {
    adminLoginModal.classList.add('hidden');
    adminLoginForm.reset();
});

// Обработка входа админа через Firebase Auth
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    if (!auth) {
        alert('❌ Firebase Authentication не инициализирован');
        return;
    }

    const submitBtn = adminLoginForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Вход...';

    try {
        // Вход через Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);

        isAdmin = true;
        showAdminControls();
        adminLoginModal.classList.add('hidden');
        adminLoginForm.reset();
        alert('✅ Вы вошли как администратор');
    } catch (error) {
        console.error('Ошибка входа:', error);

        let errorMessage = '❌ Ошибка входа';
        if (error.code === 'auth/user-not-found') {
            errorMessage = '❌ Пользователь не найден';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = '❌ Неверный пароль';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = '❌ Неверный формат email';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = '❌ Слишком много попыток. Попробуйте позже';
        }

        alert(errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
*/

// Модальное окно добавления темы
const addArticleModal = document.getElementById('addArticleModal');
const addArticleBtn = document.getElementById('addArticleBtn');
const closeAddArticle = document.getElementById('closeAddArticle');
const cancelAddArticle = document.getElementById('cancelAddArticle');
const addArticleForm = document.getElementById('addArticleForm');

// Открыть модальное окно добавления темы
addArticleBtn.addEventListener('click', () => {
    addArticleModal.classList.remove('hidden');
    // Инициализируем Quill если еще не инициализирован
    if (!quill) {
        initQuillEditor();
    }
});

closeAddArticle.addEventListener('click', () => {
    addArticleModal.classList.add('hidden');
    addArticleForm.reset();
    if (quill) quill.setText('');
    clearMediaInputs();
    editingArticleId = null;
    // Восстанавливаем заголовок и кнопку
    document.querySelector('#addArticleModal h2').textContent = 'Добавить новую тему';
    document.querySelector('#addArticleModal .submit-btn').textContent = 'Добавить тему';
});

cancelAddArticle.addEventListener('click', () => {
    addArticleModal.classList.add('hidden');
    addArticleForm.reset();
    if (quill) quill.setText('');
    clearMediaInputs();
    editingArticleId = null;
    // Восстанавливаем заголовок и кнопку
    document.querySelector('#addArticleModal h2').textContent = 'Добавить новую тему';
    document.querySelector('#addArticleModal .submit-btn').textContent = 'Добавить тему';
});

// Открыть модальное окно редактирования
let editingArticleId = null;

function openEditArticleModal(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    editingArticleId = articleId;

    // Инициализируем Quill если еще не инициализирован
    if (!quill) {
        initQuillEditor();
    }

    // Заполняем форму данными статьи
    document.getElementById('articleTitle').value = article.title;
    document.getElementById('articleKeywords').value = article.keywords.join(', ');

    // Загружаем контент в Quill
    if (quill) {
        quill.root.innerHTML = article.content;
        document.getElementById('articleContentInput').value = article.content;
    }

    // Меняем заголовок и текст кнопки
    document.querySelector('#addArticleModal h2').textContent = 'Редактировать тему';
    document.querySelector('#addArticleModal .submit-btn').textContent = 'Сохранить изменения';

    addArticleModal.classList.remove('hidden');
}

// Обработка формы добавления/редактирования статьи
addArticleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('articleTitle');
    const keywordsInput = document.getElementById('articleKeywords');
    const contentInput = document.getElementById('articleContentInput');

    console.log('Form inputs:', { titleInput, keywordsInput, contentInput });

    if (!titleInput || !keywordsInput || !contentInput) {
        console.error('Не найдены поля формы');
        alert('❌ Ошибка: не найдены поля формы');
        return;
    }

    const title = (titleInput.value || '').trim();
    const keywordsStr = (keywordsInput.value || '').trim();
    const content = (contentInput.value || '').trim();

    console.log('Form values:', { title, keywordsStr, content });

    if (!title || !keywordsStr || !content) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
    const submitBtn = addArticleForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = editingArticleId ? 'Сохранение...' : 'Добавление...';

    try {
        if (editingArticleId) {
            // Редактирование существующей статьи
            const article = articles.find(a => a.id === editingArticleId);
            if (article) {
                article.title = title;
                article.keywords = keywords;
                article.content = content;

                // Загружаем медиа файлы
                if (useFirebase && storage) {
                    submitBtn.textContent = 'Загрузка медиа...';
                    const media = await uploadArticleMedia(editingArticleId);

                    // Добавляем новые медиа к существующим
                    article.images = [...(article.images || []), ...media.images];
                    article.videos = [...(article.videos || []), ...media.videos];
                }

                // Сохраняем в Firebase БЕЗ добавления в массив (уже там)
                if (useFirebase) {
                    await saveArticleToFirebase(article);
                } else {
                    // Обновляем отображение если нет Firebase
                    displayAllArticles();
                }

                alert('✅ Тема успешно обновлена!');
            }
        } else {
            // Добавление новой статьи
            const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
            const newArticle = {
                id: newId,
                title: title,
                keywords: keywords,
                content: content,
                views: 0,
                images: [],
                videos: []
            };

            // Загружаем медиа файлы
            if (useFirebase && storage) {
                submitBtn.textContent = 'Загрузка медиа...';
                const media = await uploadArticleMedia(newId);
                newArticle.images = media.images;
                newArticle.videos = media.videos;
            }

            // Добавляем в массив
            articles.push(newArticle);

            // Сохраняем в Firebase
            if (useFirebase) {
                await saveArticleToFirebase(newArticle);
            } else {
                // Обновляем отображение если нет Firebase
                displayAllArticles();
            }

            alert('✅ Тема успешно добавлена!');
        }

        // Закрываем модальное окно
        addArticleModal.classList.add('hidden');
        addArticleForm.reset();
        clearMediaInputs();
        editingArticleId = null;

        // Восстанавливаем заголовок и кнопку
        document.querySelector('#addArticleModal h2').textContent = 'Добавить новую тему';
        document.querySelector('#addArticleModal .submit-btn').textContent = 'Добавить тему';

    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка при сохранении темы: ' + error.message);

        // Откатываем изменения если была ошибка при добавлении
        if (!editingArticleId) {
            const index = articles.findIndex(a => a.id === articles[articles.length - 1].id);
            if (index > -1) articles.splice(index, 1);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Удалить статью
async function deleteArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    if (!confirm(`Вы уверены, что хотите удалить тему "${article.title}"?`)) {
        return;
    }

    try {
        // Удаляем из массива
        const index = articles.findIndex(a => a.id === articleId);
        if (index > -1) {
            articles.splice(index, 1);
        }

        // Удаляем из Firebase
        if (useFirebase) {
            await deleteArticleFromFirebase(articleId);
        }

        displayAllArticles();
        alert('✅ Тема успешно удалена!');
    } catch (error) {
        console.error('Ошибка удаления темы:', error);
        alert('❌ Ошибка при удалении темы');
    }
}

// Синхронизировать все статьи из data.js в Firebase
async function syncArticlesToFirebase() {
    if (!database) {
        console.log('Firebase не инициализирован');
        return;
    }

    console.log('Синхронизация статей с Firebase...');

    // Загружаем статьи из data.js заново
    const articlesFromDataJs = [
        {
            id: 1,
            title: "Открытие кассы",
            keywords: ["касса", "открытие смены", "начало работы", "подготовка"],
            content: `Открытие кассы — это первая операция, которую выполняет кассир в начале рабочей смены.

        Перед открытием кассы необходимо проверить наличие разменной монеты, чистоту рабочего места и работоспособность оборудования (сканер, терминал, принтер чеков).

        Процедура открытия включает: вход в систему по логину и паролю, внесение начальной суммы в кассу (размен), печать отчета об открытии смены.

        Важно зафиксировать точное время открытия и начальную сумму в кассе — эти данные понадобятся при закрытии смены для сверки.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 2,
            title: "Закрытие кассы",
            keywords: ["касса", "закрытие смены", "окончание работы", "отчет"],
            content: `Закрытие кассы — это завершающая процедура рабочей смены кассира.

        При закрытии необходимо: пробить все отложенные чеки, подсчитать наличные в кассе, сверить фактическую сумму с данными системы.

        Процедура включает: печать Z-отчета (отчет о закрытии смены), заполнение кассовой книги, передачу выручки старшему кассиру или инкассатору.

        Расхождения между фактической суммой и данными системы должны быть задокументированы. Недостача или излишек фиксируются в специальном акте.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 3,
            title: "Возврат товара",
            keywords: ["возврат", "обмен", "рекламация", "чек"],
            content: `Возврат товара — это процедура возврата денежных средств покупателю за ранее приобретенный товар.

        Для оформления возврата необходимы: чек или его электронная копия, паспорт покупателя, сам товар в надлежащем состоянии с бирками и упаковкой.

        Процедура возврата: проверка срока (обычно 14 дней), осмотр товара, заполнение заявления на возврат, оформление возвратного чека, выдача денег.

        Возврат по безналичному расчету осуществляется на ту же карту, с которой была произведена оплата. Срок возврата — от 3 до 30 дней в зависимости от банка.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 4,
            title: "Работа с терминалом",
            keywords: ["терминал", "эквайринг", "банковская карта", "оплата"],
            content: `Платежный терминал — это устройство для приема оплаты банковскими картами.

        Основные операции: оплата картой (вставить/приложить карту, ввести сумму, дождаться авторизации), отмена операции (до закрытия смены), возврат средств.

        При сбое терминала: проверить связь с интернетом, перезагрузить устройство, связаться с технической поддержкой банка-эквайера.

        Важно: никогда не вводите PIN-код за покупателя, не принимайте карты без чипа или магнитной полосы, проверяйте подпись на обратной стороне карты при необходимости.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 5,
            title: "Работа со сканером штрих-кодов",
            keywords: ["сканер", "штрих-код", "товар", "оборудование"],
            content: `Сканер штрих-кодов — это устройство для автоматического считывания информации о товаре.

        Типы сканеров: ручные (для небольших магазинов), стационарные (встроенные в кассу), беспроводные (для крупногабаритных товаров).

        Правила работы: направлять луч сканера перпендикулярно штрих-коду, держать на расстоянии 5-15 см, при неудаче — ввести код вручную.

        Частые проблемы: поврежденный или загрязненный штрих-код, слишком мелкий шрифт, блики на упаковке. Решение: протереть код, изменить угол сканирования или ввести цифры вручную.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 6,
            title: "Работа с весами",
            keywords: ["весы", "взвешивание", "товар на вес", "этикетка"],
            content: `Электронные весы используются для взвешивания товаров, продаваемых на вес (овощи, фрукты, мясо, сыры).

        Процедура взвешивания: положить товар на весы, выбрать код товара на клавиатуре весов, дождаться печати этикетки со штрих-кодом, наклеить этикетку на упаковку.

        Важно: обнулять весы перед каждым взвешиванием, не превышать максимальную нагрузку, следить за чистотой платформы весов.

        При сбое весов: проверить подключение к сети, откалибровать весы, обратиться к техническому специалисту. Запрещено использовать неисправные весы.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 7,
            title: "Работа с наличными",
            keywords: ["наличные", "деньги", "купюры", "размен"],
            content: `Работа с наличными деньгами требует внимательности и соблюдения правил безопасности.

        Прием наличных: проверить подлинность купюр (водяные знаки, защитная нить, рельеф), пересчитать сумму дважды, озвучить полученную сумму покупателю.

        Выдача сдачи: сначала положить купюры, затем монеты, озвучить сумму сдачи, дождаться подтверждения от покупателя.

        Признаки фальшивых купюр: отсутствие водяных знаков, нечеткая печать, неправильная текстура бумаги. При подозрении — вежливо попросить другую купюру и сообщить администратору.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 8,
            title: "Работа с промо-акциями и скидками",
            keywords: ["скидки", "акции", "промокод", "бонусы"],
            content: `Промо-акции и скидки — это маркетинговые инструменты для привлечения покупателей.

        Типы скидок: процентные (10%, 20%), фиксированные (100 руб. скидка), акции 2+1, накопительные бонусы, промокоды.

        Применение скидки: проверить условия акции (срок действия, категория товаров), отсканировать карту лояльности или ввести промокод, убедиться, что скидка применилась.

        Важно: скидки не суммируются, если это не указано в условиях акции. При возникновении вопросов — обратиться к администратору или проверить информацию в системе.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 9,
            title: "Конфликтные ситуации с покупателями",
            keywords: ["конфликт", "жалоба", "покупатель", "общение"],
            content: `Конфликтные ситуации могут возникать из-за недопонимания, ошибок в работе или завышенных ожиданий покупателя.

        Правила поведения: сохранять спокойствие, выслушать покупателя, извиниться за неудобства, предложить решение проблемы.

        Типичные конфликты: неправильная цена на ценнике, отказ в возврате товара, длинная очередь, грубость персонала.

        Если не можете решить проблему самостоятельно — пригласите администратора. Никогда не повышайте голос и не вступайте в спор с покупателем.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        },
        {
            id: 10,
            title: "Кассовая дисциплина",
            keywords: ["дисциплина", "правила", "ответственность", "инструкция"],
            content: `Кассовая дисциплина — это свод правил, которые должен соблюдать каждый кассир.

        Основные правила: не оставлять кассу без присмотра, не передавать свой логин и пароль другим, не хранить личные деньги в кассе, не пробивать чеки "мимо кассы".

        Ответственность кассира: за недостачу, за нарушение правил работы с ККТ, за разглашение коммерческой тайны.

        Кассир обязан: знать ассортимент товаров, уметь работать со всем оборудованием, соблюдать дресс-код, быть вежливым с покупателями.`,
            views: 0,
            helpful: 0,
            notHelpful: 0,
            images: [],
            videos: []
        }
    ];

    try {
        for (const article of articlesFromDataJs) {
            await saveArticleToFirebase(article);
            console.log(`Статья "${article.title}" синхронизирована`);
        }

        // Обновляем локальный массив
        articles.length = 0;
        articles.push(...articlesFromDataJs);

        console.log('✅ Все статьи успешно синхронизированы с Firebase');
        displayAllArticles();
    } catch (error) {
        console.error('Ошибка синхронизации:', error);
    }
}

// Сохранить статью в Firebase
async function saveArticleToFirebase(article) {
    if (!database) {
        console.log('Firebase не инициализирован');
        return;
    }

    const articlesRef = database.ref('articles/' + article.id);
    await articlesRef.set({
        title: article.title,
        keywords: article.keywords,
        content: article.content,
        views: article.views || 0,
        helpful: article.helpful || 0,
        notHelpful: article.notHelpful || 0,
        images: article.images || [],
        videos: article.videos || []
    });
}

// Удалить статью из Firebase
async function deleteArticleFromFirebase(articleId) {
    if (!database) {
        console.log('Firebase не инициализирован');
        return;
    }

    const articlesRef = database.ref('articles/' + articleId);
    await articlesRef.remove();
}

// Модальное окно для предложения темы
const suggestModal = document.getElementById('suggestModal');
const suggestBtn = document.getElementById('suggestBtn');
const closeModal = document.querySelector('.close-modal');
const cancelSuggest = document.getElementById('cancelSuggest');
const suggestForm = document.getElementById('suggestForm');

// Открыть модальное окно
suggestBtn.addEventListener('click', () => {
    suggestModal.classList.remove('hidden');
});

// Закрыть модальное окно
closeModal.addEventListener('click', () => {
    suggestModal.classList.add('hidden');
    suggestForm.reset();
});

cancelSuggest.addEventListener('click', () => {
    suggestModal.classList.add('hidden');
    suggestForm.reset();
});

// Закрыть при клике вне модального окна
window.addEventListener('click', (e) => {
    if (e.target === suggestModal) {
        suggestModal.classList.add('hidden');
        suggestForm.reset();
    }
});

// Отправка формы предложения
suggestForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('suggestTitle').value.trim();
    const keywords = document.getElementById('suggestKeywords').value.trim();
    const content = document.getElementById('suggestContent').value.trim();
    const email = document.getElementById('suggestEmail').value.trim();

    if (!title || !content) {
        alert('Пожалуйста, заполните обязательные поля');
        return;
    }

    // Блокируем кнопку отправки
    const submitBtn = suggestForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    try {
        // Отправляем в Telegram
        await sendSuggestionToTelegram(title, keywords, content, email);

        // Сохраняем в Firebase (обязательно)
        if (useFirebase) {
            await saveSuggestionToFirebase(title, keywords, content, email);
        }

        alert('✅ Спасибо! Ваше предложение отправлено.');
        suggestModal.classList.add('hidden');
        suggestForm.reset();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('❌ Ошибка отправки. Попробуйте позже или свяжитесь с администратором.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Обработчик кнопки сброса просмотров
document.getElementById('resetViewsBtn').addEventListener('click', resetAllViews);

// ВАЖНО: Сначала проверяем Telegram авторизацию
if (!checkTelegramAuth()) {
    // Если проверка не прошла, страница уже заменена на сообщение об ошибке
    throw new Error('Доступ запрещен');
}

// Инициализируем Firebase сначала
// useFirebase = initFirebase(); // УЖЕ ВЫЗВАНО В firebase-config.js
useFirebase = (typeof database !== 'undefined' && database !== null);

console.log('📊 useFirebase:', useFirebase);

// Проверяем авторизацию пользователя (из auth.js)
checkUserAuth();

// НЕ загружаем просмотры при старте - они загрузятся после авторизации в auth.js
// loadViews();

// Добавляем глобальную функцию для сброса просмотров (можно вызвать из консоли)
window.resetViews = resetAllViews;

// ===== РАБОТА С МЕДИА ФАЙЛАМИ =====

// ImgBB API Key (бесплатный, получить на https://api.imgbb.com/)
const IMGBB_API_KEY = '71077e7395b6b7ae7fe585a7434247ed';

// Загрузить изображение на ImgBB
async function uploadImageToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            return result.data.url;
        } else {
            throw new Error('Ошибка загрузки на ImgBB');
        }
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        throw error;
    }
}

// Хранилище для загруженных медиа (временное, до сохранения статьи)
let uploadedImages = [];
let uploadedVideos = [];

// Превью выбранных изображений
document.getElementById('articleImages')?.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    const preview = document.getElementById('imagePreview');

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const div = document.createElement('div');
                div.className = 'media-preview-item';
                div.innerHTML = `
                    <img src="${event.target.result}" alt="Preview">
                    <button type="button" class="remove-media" onclick="removePreviewItem(this, 'image')">&times;</button>
                `;
                div.dataset.file = file.name;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    });
});

// Превью выбранных видео
document.getElementById('articleVideos')?.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    const preview = document.getElementById('videoPreview');

    files.forEach(file => {
        if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const div = document.createElement('div');
                div.className = 'media-preview-item';
                div.innerHTML = `
                    <video src="${event.target.result}" muted></video>
                    <button type="button" class="remove-media" onclick="removePreviewItem(this, 'video')">&times;</button>
                `;
                div.dataset.file = file.name;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        }
    });
});

// Удалить превью элемент
function removePreviewItem(button, type) {
    const item = button.parentElement;
    const fileName = item.dataset.file;

    // Удаляем из DOM
    item.remove();

    // Очищаем input если все превью удалены
    const preview = type === 'image' ? document.getElementById('imagePreview') : document.getElementById('videoPreview');
    if (preview.children.length === 0) {
        const input = type === 'image' ? document.getElementById('articleImages') : document.getElementById('articleVideos');
        input.value = '';
    }
}

// Загрузить файл в Firebase Storage
async function uploadFileToStorage(file, articleId, type) {
    if (!storage) {
        console.error('Firebase Storage не инициализирован');
        return null;
    }

    try {
        const timestamp = Date.now();
        const fileName = `${articleId}_${timestamp}_${file.name}`;
        const storageRef = storage.ref(`articles/${type}/${fileName}`);

        // Загружаем файл
        const snapshot = await storageRef.put(file);

        // Получаем URL загруженного файла
        const downloadURL = await snapshot.ref.getDownloadURL();

        return downloadURL;
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        throw error;
    }
}

// Загрузить все медиа файлы для статьи
async function uploadArticleMedia(articleId) {
    const imageFiles = document.getElementById('articleImages')?.files || [];
    const videoFiles = document.getElementById('articleVideos')?.files || [];

    const imageUrls = [];
    const videoUrls = [];

    // Загружаем изображения
    for (let file of imageFiles) {
        try {
            const url = await uploadFileToStorage(file, articleId, 'images');
            if (url) imageUrls.push(url);
        } catch (error) {
            console.error('Ошибка загрузки изображения:', error);
        }
    }

    // Загружаем видео
    for (let file of videoFiles) {
        try {
            const url = await uploadFileToStorage(file, articleId, 'videos');
            if (url) videoUrls.push(url);
        } catch (error) {
            console.error('Ошибка загрузки видео:', error);
        }
    }

    return { images: imageUrls, videos: videoUrls };
}

// Очистить превью и inputs медиа
function clearMediaInputs() {
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('videoPreview').innerHTML = '';
    document.getElementById('articleImages').value = '';
    document.getElementById('articleVideos').value = '';
    uploadedImages = [];
    uploadedVideos = [];
}
