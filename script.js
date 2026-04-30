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

// Проверка авторизации админа при загрузке
function checkAdminAuth() {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
        isAdmin = true;
        showAdminControls();
    }
}

// Показать элементы управления для админа
function showAdminControls() {
    document.getElementById('addArticleBtn').classList.remove('hidden');
    document.getElementById('adminLoginBtn').textContent = 'Выйти';
    displayAllArticles(); // Обновляем список статей с кнопками
}

// Скрыть элементы управления админа
function hideAdminControls() {
    document.getElementById('addArticleBtn').classList.add('hidden');
    document.getElementById('adminLoginBtn').textContent = 'Вход для админа';
    displayAllArticles(); // Обновляем список статей без кнопок
}

// Система подсчета просмотров с поддержкой Firebase
function loadViews() {
    // Пытаемся инициализировать Firebase
    useFirebase = initFirebase();

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
function loadArticlesFromFirebase(callback) {
    if (!database) {
        console.error('Firebase не инициализирован');
        displayAllArticles();
        return;
    }

    const articlesRef = database.ref('articles');

    // Сначала показываем статьи из data.js
    displayAllArticles();

    articlesRef.once('value', (snapshot) => {
        const firebaseArticles = snapshot.val();

        if (firebaseArticles) {
            // Обновляем существующие статьи из Firebase
            Object.keys(firebaseArticles).forEach(id => {
                const articleId = parseInt(id);
                const existingArticle = articles.find(a => a.id === articleId);

                if (existingArticle) {
                    // Обновляем существующую статью
                    Object.assign(existingArticle, firebaseArticles[id]);
                } else {
                    // Добавляем новую статью из Firebase
                    articles.push({
                        id: articleId,
                        ...firebaseArticles[id]
                    });
                }
            });

            displayAllArticles();
        }

        callback();
    });

    // Подписываемся на изменения ПОСЛЕ первой загрузки
    articlesRef.on('child_changed', (snapshot) => {
        const articleId = parseInt(snapshot.key);
        const article = articles.find(a => a.id === articleId);

        if (article) {
            Object.assign(article, snapshot.val());
            displayAllArticles();
        }
    });

    articlesRef.on('child_added', (snapshot) => {
        const articleId = parseInt(snapshot.key);

        // Проверяем, что статья еще не существует
        if (!articles.find(a => a.id === articleId)) {
            articles.push({
                id: articleId,
                ...snapshot.val()
            });
            displayAllArticles();
        }
    });

    articlesRef.on('child_removed', (snapshot) => {
        const articleId = parseInt(snapshot.key);
        const index = articles.findIndex(a => a.id === articleId);

        if (index > -1) {
            articles.splice(index, 1);
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

        if (useFirebase) {
            // Сохраняем обновленные просмотры в Firebase
            const articleRef = database.ref('articles/' + articleId + '/views');
            articleRef.set(article.views);
        } else {
            saveViews();
        }
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

// Отправить отзыв в Telegram
async function sendFeedbackToTelegram(articleTitle, feedback) {
    const date = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    const data = {
        title: `Отзыв о статье: ${articleTitle}`,
        keywords: '',
        content: feedback,
        email: '',
        date: date
    };

    try {
        await fetch(BOT_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
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

function normalizeText(text) {
    return text.toLowerCase().trim();
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function searchArticles(query) {
    if (!query) {
        resultsContainer.innerHTML = '<div class="no-results">Введите запрос для поиска</div>';
        resultsContainer.classList.remove('empty');
        return;
    }

    const normalizedQuery = normalizeText(query);
    const keywordMatches = [];
    const contentMatches = [];

    articles.forEach(article => {
        let matchedInKeywords = false;

        article.keywords.forEach(keyword => {
            if (normalizeText(keyword).includes(normalizedQuery)) {
                matchedInKeywords = true;
            }
        });

        if (matchedInKeywords) {
            keywordMatches.push(article);
        } else if (normalizeText(article.title).includes(normalizedQuery) ||
                   normalizeText(article.content).includes(normalizedQuery)) {
            contentMatches.push(article);
        }
    });

    displayResults(keywordMatches, contentMatches, query);
}

function displayResults(keywordMatches, contentMatches, query) {
    if (keywordMatches.length === 0 && contentMatches.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Ничего не найдено. Попробуйте другой запрос.</div>';
        resultsContainer.classList.remove('empty');
        return;
    }

    let html = '';

    if (keywordMatches.length > 0) {
        html += '<div class="results-section">';
        html += '<h3>📌 Совпадения по ключевым словам</h3>';
        keywordMatches.forEach(article => {
            const matchedKeywords = article.keywords.filter(k =>
                normalizeText(k).includes(normalizeText(query))
            );
            const snippet = article.content.substring(0, 150) + '...';

            html += `
                <div class="result-item" data-id="${article.id}">
                    <div class="result-title">${highlightText(article.title, query)}</div>
                    <div class="result-keywords">
                        <strong>Ключевые слова:</strong> ${matchedKeywords.map(k => highlightText(k, query)).join(', ')}
                    </div>
                    <div class="result-snippet">${snippet}</div>
                </div>
            `;
        });
        html += '</div>';
    }

    if (contentMatches.length > 0) {
        html += '<div class="results-section">';
        html += '<h3>📄 Совпадения в тексте</h3>';
        contentMatches.forEach(article => {
            const normalizedContent = normalizeText(article.content);
            const normalizedQuery = normalizeText(query);
            const index = normalizedContent.indexOf(normalizedQuery);

            let snippet = '';
            if (index !== -1) {
                const start = Math.max(0, index - 50);
                const end = Math.min(article.content.length, index + 100);
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
                        <strong>Ключевые слова:</strong> ${article.keywords.join(', ')}
                    </div>
                    <div class="result-snippet">${highlightText(snippet, query)}</div>
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

    const contentHtml = article.content.split('\n').map(p =>
        p.trim() ? `<p>${p.trim()}</p>` : ''
    ).join('');

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
    resultsContainer.classList.remove('empty');
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

searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    searchArticles(query);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        searchArticles(query);
    }
});

searchInput.addEventListener('input', () => {
    if (searchInput.value === '') {
        resultsContainer.innerHTML = '';
        resultsContainer.classList.add('empty');
    }
});

backBtn.addEventListener('click', hideArticle);

// Авторизация админа
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const closeAdminLogin = document.getElementById('closeAdminLogin');
const cancelAdminLogin = document.getElementById('cancelAdminLogin');
const adminLoginForm = document.getElementById('adminLoginForm');

// Открыть/закрыть модальное окно входа
adminLoginBtn.addEventListener('click', () => {
    if (isAdmin) {
        // Выход
        if (confirm('Выйти из режима администратора?')) {
            isAdmin = false;
            localStorage.removeItem('adminAuth');
            hideAdminControls();
            alert('Вы вышли из режима администратора');
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

// Обработка входа админа
adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    // Простая проверка (в продакшене используйте Firebase Auth или backend)
    if (username === 'admin' && password === 'admin123') {
        isAdmin = true;
        localStorage.setItem('adminAuth', 'true');
        showAdminControls();
        adminLoginModal.classList.add('hidden');
        adminLoginForm.reset();
        alert('✅ Вы вошли как администратор');
    } else {
        alert('❌ Неверный логин или пароль');
    }
});

// Модальное окно добавления темы
const addArticleModal = document.getElementById('addArticleModal');
const addArticleBtn = document.getElementById('addArticleBtn');
const closeAddArticle = document.getElementById('closeAddArticle');
const cancelAddArticle = document.getElementById('cancelAddArticle');
const addArticleForm = document.getElementById('addArticleForm');

// Открыть модальное окно добавления темы
addArticleBtn.addEventListener('click', () => {
    addArticleModal.classList.remove('hidden');
});

closeAddArticle.addEventListener('click', () => {
    addArticleModal.classList.add('hidden');
    addArticleForm.reset();
    clearMediaInputs();
    editingArticleId = null;
    // Восстанавливаем заголовок и кнопку
    document.querySelector('#addArticleModal h2').textContent = 'Добавить новую тему';
    document.querySelector('#addArticleModal .submit-btn').textContent = 'Добавить тему';
});

cancelAddArticle.addEventListener('click', () => {
    addArticleModal.classList.add('hidden');
    addArticleForm.reset();
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

    // Заполняем форму данными статьи
    document.getElementById('articleTitle').value = article.title;
    document.getElementById('articleKeywords').value = article.keywords.join(', ');
    document.getElementById('articleContentInput').value = article.content;

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

        // Сохраняем в Firebase (опционально)
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

// Проверяем авторизацию админа при загрузке
checkAdminAuth();

// Загружаем просмотры при старте
loadViews();

// Добавляем глобальную функцию для сброса просмотров (можно вызвать из консоли)
window.resetViews = resetAllViews;

// ===== РАБОТА С МЕДИА ФАЙЛАМИ =====

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
