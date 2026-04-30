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
}

// Скрыть элементы управления админа
function hideAdminControls() {
    document.getElementById('addArticleBtn').classList.add('hidden');
    document.getElementById('adminLoginBtn').textContent = 'Вход для админа';
}

// Система подсчета просмотров с поддержкой Firebase
function loadViews() {
    // Пытаемся инициализировать Firebase
    useFirebase = initFirebase();

    if (useFirebase) {
        // Загружаем просмотры из Firebase
        getViewsFromFirebase((views) => {
            articles.forEach(article => {
                if (views[article.id] !== undefined) {
                    article.views = views[article.id];
                }
            });
            displayAllArticles();

            // Подписываемся на обновления в реальном времени
            subscribeToViewsUpdates((views) => {
                articles.forEach(article => {
                    if (views[article.id] !== undefined) {
                        article.views = views[article.id];
                    }
                });
                displayAllArticles();
            });
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
            incrementViewInFirebase(articleId);
        } else {
            saveViews();
        }
    }
}

function resetAllViews() {
    if (confirm('Вы уверены, что хотите сбросить все просмотры?')) {
        if (useFirebase) {
            resetViewsInFirebase(() => {
                articles.forEach(article => {
                    article.views = 0;
                });
                displayAllArticles();
                alert('Все просмотры сброшены!');
            });
        } else {
            articles.forEach(article => {
                article.views = 0;
            });
            saveViews();
            displayAllArticles();
            alert('Все просмотры сброшены!');
        }
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
    `;

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
            <a href="#" class="article-link" data-id="${article.id}">
                <span class="article-title">${article.title}</span>
                <span class="article-views">👁 ${article.views}</span>
            </a>
        `;
    });
    articlesList.innerHTML = html;

    document.querySelectorAll('.article-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const articleId = parseInt(link.dataset.id);
            showArticle(articleId);
        });
    });
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
});

cancelAddArticle.addEventListener('click', () => {
    addArticleModal.classList.add('hidden');
    addArticleForm.reset();
});

// Обработка добавления новой темы
addArticleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('articleTitle').value.trim();
    const keywordsStr = document.getElementById('articleKeywords').value.trim();
    const content = document.getElementById('articleContent').value.trim();

    if (!title || !keywordsStr || !content) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }

    // Преобразуем ключевые слова в массив
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);

    // Генерируем новый ID
    const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;

    // Создаем новую статью
    const newArticle = {
        id: newId,
        title: title,
        keywords: keywords,
        content: content,
        views: 0
    };

    // Добавляем в массив
    articles.push(newArticle);

    // Сохраняем в Firebase
    if (useFirebase) {
        try {
            await saveArticleToFirebase(newArticle);
        } catch (error) {
            console.error('Ошибка сохранения в Firebase:', error);
        }
    }

    // Обновляем отображение
    displayAllArticles();

    // Закрываем модальное окно
    addArticleModal.classList.add('hidden');
    addArticleForm.reset();

    alert('✅ Тема успешно добавлена!');
});

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
        views: article.views
    });
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
