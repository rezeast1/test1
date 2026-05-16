// ===== СИСТЕМА АВТОРИЗАЦИИ И РЕГИСТРАЦИИ =====

let currentUser = null;
let isUserAuthenticated = false;

// Инициализация: показываем форму входа по умолчанию
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOMContentLoaded - проверка Firebase');
    console.log('auth:', typeof auth !== 'undefined' ? 'определен' : 'НЕ определен');
    console.log('database:', typeof database !== 'undefined' ? 'определен' : 'НЕ определен');
    console.log('firebase:', typeof firebase !== 'undefined' ? 'определен' : 'НЕ определен');

    // Скрываем контент до проверки авторизации
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'none';
    }

    // Показываем модальное окно авторизации
    const modal = document.getElementById('userAuthModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('auth-modal-fullscreen');
    }
});

// Проверка авторизации пользователя
function checkUserAuth() {
    console.log('🔍 checkUserAuth() вызвана');

    if (!auth) {
        console.error('Firebase Auth не инициализирован');
        showAuthModal();
        return;
    }

    console.log('👂 Подписываемся на onAuthStateChanged');

    auth.onAuthStateChanged(async (user) => {
        console.log('🔔 onAuthStateChanged сработал, user:', user);

        if (user) {
            // Пользователь авторизован
            currentUser = user;
            isUserAuthenticated = true;

            console.log('✅ Пользователь авторизован:', user.email);
            console.log('🔑 UID пользователя:', user.uid);

            // Проверяем роль пользователя
            const isAdminUser = await checkIfAdmin(user.uid);

            console.log('👤 Является администратором:', isAdminUser);

            if (isAdminUser) {
                isAdmin = true;
                showAdminControls();
                showGlassAdminControls(); // Показываем кнопку управления стёклами для админа
                console.log('✅ Показаны элементы управления администратора');
            } else {
                isAdmin = false;
                hideAdminControls();
                hideGlassAdminControls(); // Скрываем кнопку управления стёклами
                console.log('ℹ️ Пользователь вошел как обычный пользователь');
            }

            // Показываем контент
            console.log('📺 Вызываем showMainContent()');
            showMainContent();
            updateUserInfo(user);

            // Загружаем статьи после авторизации
            if (typeof loadViews === 'function') {
                console.log('📚 Загружаем статьи');
                loadViews();
            }

        } else {
            // Пользователь не авторизован
            currentUser = null;
            isUserAuthenticated = false;
            isAdmin = false;

            // Показываем форму входа/регистрации
            showAuthModal();

            console.log('⚠️ Пользователь не авторизован');
        }
    });
}

// Проверить, является ли пользователь администратором
async function checkIfAdmin(uid) {
    if (!database) {
        console.log('❌ Database не инициализирован');
        return false;
    }

    try {
        console.log('🔍 Проверка прав администратора для UID:', uid);
        const adminRef = database.ref('admins/' + uid);
        const snapshot = await adminRef.once('value');
        const isAdmin = snapshot.exists();

        console.log('📊 Результат проверки администратора:', isAdmin);
        console.log('📊 Данные из Firebase:', snapshot.val());

        return isAdmin;
    } catch (error) {
        console.error('❌ Ошибка проверки прав администратора:', error);
        return false;
    }
}

// Показать модальное окно авторизации
function showAuthModal() {
    const modal = document.getElementById('userAuthModal');
    modal.classList.remove('hidden');
    modal.classList.add('auth-modal-fullscreen');

    // Скрываем основной контент
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'none';
    }
}

// Показать основной контент
function showMainContent() {
    console.log('🔄 showMainContent() вызвана');

    // Создаем отладочный элемент на экране
    let debugDiv = document.getElementById('debug-info');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'debug-info';
        debugDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: rgba(0,0,0,0.9); color: #0f0; padding: 10px; font-size: 12px; z-index: 99999; max-height: 200px; overflow-y: auto;';
        document.body.appendChild(debugDiv);
    }

    const addDebug = (msg) => {
        console.log(msg);
        debugDiv.innerHTML += msg + '<br>';
        debugDiv.scrollTop = debugDiv.scrollHeight;
    };

    addDebug('🔄 showMainContent() вызвана');

    const modal = document.getElementById('userAuthModal');
    addDebug('📋 modal: ' + (modal ? 'найден' : 'НЕ найден'));

    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('auth-modal-fullscreen');
        addDebug('✅ Модальное окно скрыто');
    }

    const container = document.querySelector('.container');
    addDebug('📋 container: ' + (container ? 'найден' : 'НЕ найден'));

    if (container) {
        container.style.display = 'block';
        addDebug('✅ Контейнер показан');
    }

    // Проверяем, открыто ли приложение в Telegram
    const isTelegramWebApp = typeof Telegram !== 'undefined' && Telegram.WebApp;
    addDebug('📱 Открыто в Telegram: ' + isTelegramWebApp);

    // Показываем главное меню (с проверкой что функция существует)
    const showMenuWithRetry = (attempts = 0) => {
        if (typeof showMainMenu === 'function') {
            showMainMenu();
            addDebug('✅ Главное меню показано через showMainMenu()');

            // Прокручиваем страницу наверх
            window.scrollTo(0, 0);

            // Если в Telegram, расширяем окно
            if (isTelegramWebApp) {
                try {
                    Telegram.WebApp.expand();
                    addDebug('✅ Telegram WebApp расширен');
                } catch (e) {
                    addDebug('⚠️ Не удалось расширить Telegram WebApp: ' + e.message);
                }
            }

            // Удаляем отладочную информацию через 3 секунды
            setTimeout(() => {
                if (debugDiv && debugDiv.parentNode) {
                    debugDiv.parentNode.removeChild(debugDiv);
                }
            }, 3000);
        } else if (attempts < 10) {
            addDebug(`⚠️ showMainMenu не определена, попытка ${attempts + 1}/10`);
            setTimeout(() => showMenuWithRetry(attempts + 1), 100);
        } else {
            addDebug('⚠️ showMainMenu не определена после 10 попыток, показываем меню вручную');
            // Показываем главное меню вручную
            const mainMenu = document.getElementById('mainMenu');
            if (mainMenu) {
                mainMenu.classList.remove('hidden');
                addDebug('✅ Главное меню показано вручную');
            } else {
                addDebug('❌ Элемент mainMenu не найден!');
                alert('Ошибка: главное меню не найдено. Перезагрузите страницу.');
            }

            // Прокручиваем страницу наверх
            window.scrollTo(0, 0);

            // Удаляем отладочную информацию через 5 секунд
            setTimeout(() => {
                if (debugDiv && debugDiv.parentNode) {
                    debugDiv.parentNode.removeChild(debugDiv);
                }
            }, 5000);
        }
    };

    setTimeout(() => showMenuWithRetry(), 200);
}

// Обновить информацию о пользователе в шапке
function updateUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
        // Показываем username вместо email
        if (user.displayName) {
            userInfo.textContent = user.displayName;
        } else {
            userInfo.textContent = user.email.split('@')[0]; // Показываем username из email
        }

        userInfo.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
    } else {
        userInfo.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
}

// Переключение между вкладками входа и регистрации
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authModalTitle = document.getElementById('authModalTitle');

// Удалены обработчики вкладок - теперь только форма входа

// Обработка формы входа
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    // Проверяем инициализацию Firebase
    if (typeof auth === 'undefined' || !auth) {
        console.error('❌ auth не определен');
        alert('❌ Firebase Authentication не инициализирован. Перезагрузите страницу.');
        return;
    }

    if (typeof database === 'undefined' || !database) {
        console.error('❌ database не определен');
        alert('❌ Firebase Database не инициализирован. Перезагрузите страницу.');
        return;
    }

    const submitBtn = loginForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Вход...';

    try {
        // Ищем пользователя по username в базе данных
        const usersRef = database.ref('users');
        const snapshot = await usersRef.orderByChild('username').equalTo(username).once('value');

        if (!snapshot.exists()) {
            alert('❌ Пользователь не найден');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        // Получаем email пользователя
        const userData = Object.values(snapshot.val())[0];
        const email = userData.email;

        console.log('📧 Email найден:', email);

        // Входим через Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);

        console.log('✅ Вход выполнен успешно');

        // Показываем индикатор загрузки
        submitBtn.textContent = 'Загрузка...';

        loginForm.reset();

        // НЕ показываем alert сразу - ждём пока сработает onAuthStateChanged
        // alert('✅ Вы успешно вошли в систему');

    } catch (error) {
        console.error('Ошибка входа:', error);

        let errorMessage = '❌ Ошибка входа';
        if (error.code === 'auth/wrong-password') {
            errorMessage = '❌ Неверный пароль';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = '❌ Слишком много попыток. Попробуйте позже';
        }

        alert(errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Обработка формы регистрации (УДАЛЕНА - теперь только админ может регистрировать)
// registerForm?.addEventListener('submit', async (e) => { ... });

// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (ТОЛЬКО ДЛЯ АДМИНА) =====

const manageUsersBtn = document.getElementById('manageUsersBtn');
const usersManagementModal = document.getElementById('usersManagementModal');
const closeUsersManagement = document.getElementById('closeUsersManagement');
const addUserBtn = document.getElementById('addUserBtn');
const addUserModal = document.getElementById('addUserModal');
const closeAddUser = document.getElementById('closeAddUser');
const cancelAddUser = document.getElementById('cancelAddUser');
const addUserForm = document.getElementById('addUserForm');

// Показать панель управления пользователями
manageUsersBtn?.addEventListener('click', () => {
    usersManagementModal.classList.remove('hidden');
    loadUsersList();
});

// Закрыть панель управления
closeUsersManagement?.addEventListener('click', () => {
    usersManagementModal.classList.add('hidden');
});

// Показать форму добавления пользователя
addUserBtn?.addEventListener('click', () => {
    addUserModal.classList.remove('hidden');
});

// Закрыть форму добавления пользователя
closeAddUser?.addEventListener('click', () => {
    addUserModal.classList.add('hidden');
    addUserForm.reset();
});

cancelAddUser?.addEventListener('click', () => {
    addUserModal.classList.add('hidden');
    addUserForm.reset();
});

// Обработка формы добавления пользователя
addUserForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('newUsername').value.trim();
    const name = document.getElementById('newUserName').value.trim();
    const password = document.getElementById('newUserPassword').value.trim();
    const role = document.getElementById('newUserRole').value;

    if (username.length < 3) {
        alert('❌ Имя пользователя должно содержать минимум 3 символа');
        return;
    }

    if (password.length < 6) {
        alert('❌ Пароль должен содержать минимум 6 символов');
        return;
    }

    if (!auth || !database) {
        alert('❌ Firebase не инициализирован');
        return;
    }

    const submitBtn = addUserForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Создание...';

    try {
        // Проверяем, не занят ли username
        const usersRef = database.ref('users');
        const snapshot = await usersRef.orderByChild('username').equalTo(username).once('value');

        if (snapshot.exists()) {
            alert('❌ Это имя пользователя уже занято');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        // Создаем email на основе username
        const email = `${username}@topglass.local`;

        // Создаём пользователя через REST API (не влияет на текущую сессию)
        const newUser = await createUserViaRestAPI(email, password, name);

        // Сохраняем данные пользователя в Realtime Database
        await database.ref('users/' + newUser.uid).set({
            username: username,
            name: name,
            email: email,
            createdAt: Date.now(),
            role: 'user'
        });

        // Если роль администратор - добавляем в admins
        if (role === 'admin') {
            await database.ref('admins/' + newUser.uid).set({
                role: 'admin',
                createdAt: Date.now()
            });
        }

        alert(`✅ Пользователь ${username} успешно создан!`);

        addUserModal.classList.add('hidden');
        addUserForm.reset();

        // Обновляем список пользователей
        loadUsersList();

    } catch (error) {
        console.error('Ошибка создания пользователя:', error);

        let errorMessage = '❌ Ошибка создания пользователя';
        if (error.message.includes('EMAIL_EXISTS')) {
            errorMessage = '❌ Это имя пользователя уже зарегистрировано';
        } else if (error.message.includes('WEAK_PASSWORD')) {
            errorMessage = '❌ Слишком слабый пароль (минимум 6 символов)';
        } else {
            errorMessage = '❌ Ошибка: ' + error.message;
        }

        alert(errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Загрузить список пользователей
async function loadUsersList() {
    if (!database) {
        console.error('Firebase не инициализирован');
        return;
    }

    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const usersRef = database.ref('users');
        const snapshot = await usersRef.once('value');
        const users = snapshot.val();

        if (!users || Object.keys(users).length === 0) {
            usersList.innerHTML = '<div class="no-users">Нет зарегистрированных пользователей</div>';
            return;
        }

        let html = '<table class="users-table">';
        html += '<thead><tr><th>Username</th><th>Имя</th><th>Дата регистрации</th><th>Роль</th><th>Действия</th></tr></thead>';
        html += '<tbody>';

        for (const uid in users) {
            const user = users[uid];
            const date = new Date(user.createdAt).toLocaleString('ru-RU');
            const isAdminUser = await checkIfAdmin(uid);
            const role = isAdminUser ? 'Администратор' : 'Пользователь';

            html += `
                <tr>
                    <td data-label="Username"><strong>${user.username || 'Не указано'}</strong></td>
                    <td data-label="Имя">${user.name || 'Не указано'}</td>
                    <td data-label="Дата">${date}</td>
                    <td data-label="Роль">${role}</td>
                    <td data-label="Действия">
                        ${!isAdminUser ? `<button class="delete-user-btn" data-uid="${uid}" data-username="${user.username}">Удалить</button>` : '<span class="admin-badge">Админ</span>'}
                    </td>
                </tr>
            `;
        }

        html += '</tbody></table>';
        usersList.innerHTML = html;

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const username = btn.dataset.username;
                deleteUser(uid, username);
            });
        });

    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        usersList.innerHTML = '<div class="error">Ошибка загрузки пользователей: ' + error.message + '</div>';
    }
}

// Удалить пользователя
async function deleteUser(uid, username) {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
        return;
    }

    try {
        // Удаляем данные пользователя из Realtime Database
        await database.ref('users/' + uid).remove();

        alert('✅ Пользователь удален из базы данных.');

        // Перезагружаем список
        loadUsersList();
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('❌ Ошибка при удалении пользователя: ' + error.message);
    }
}

// Показать кнопку управления пользователями для админа
function showAdminControls() {
    document.getElementById('addArticleBtn').classList.remove('hidden');
    document.getElementById('resetViewsBtn').classList.remove('hidden');
    document.getElementById('manageUsersBtn').classList.remove('hidden');

    // Скрываем кнопку "Предложить тему" для администраторов
    const suggestBtn = document.getElementById('suggestBtn');
    if (suggestBtn) {
        suggestBtn.classList.add('hidden');
    }

    // Показываем кнопку сообщений
    if (typeof showMessagesButton === 'function') {
        showMessagesButton();
    }

    if (typeof displayAllArticles === 'function') {
        displayAllArticles();
    }
}

// Скрыть элементы управления админа
function hideAdminControls() {
    document.getElementById('addArticleBtn').classList.add('hidden');
    document.getElementById('resetViewsBtn').classList.add('hidden');
    document.getElementById('manageUsersBtn').classList.add('hidden');

    // Показываем кнопку "Предложить тему" для обычных пользователей
    const suggestBtn = document.getElementById('suggestBtn');
    if (suggestBtn) {
        suggestBtn.classList.remove('hidden');
    }

    // Скрываем кнопку сообщений
    if (typeof hideMessagesButton === 'function') {
        hideMessagesButton();
    }

    if (typeof displayAllArticles === 'function') {
        displayAllArticles();
    }
}

// Кнопка выхода
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
        try {
            await auth.signOut();
            alert('✅ Вы вышли из системы');
        } catch (error) {
            console.error('Ошибка выхода:', error);
            alert('❌ Ошибка при выходе');
        }
    }
});
