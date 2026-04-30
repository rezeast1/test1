// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd9wDDKNYFRpd07piB4rW6JVkPZGLl9ek",
  authDomain: "topglass-82657.firebaseapp.com",
  databaseURL: "https://topglass-82657-default-rtdb.firebaseio.com",
  projectId: "topglass-82657",
  storageBucket: "topglass-82657.firebasestorage.app",
  messagingSenderId: "618420629728",
  appId: "1:618420629728:web:2211bc7738d68459cde085",
  measurementId: "G-HE9ZV4G4D0"
};

// Инициализация Firebase
let database;

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        console.log('Firebase инициализирован');
        return true;
    } else {
        console.error('Firebase SDK не загружен');
        return false;
    }
}

// Получить все просмотры из Firebase
function getViewsFromFirebase(callback) {
    if (!database) {
        console.error('Firebase не инициализирован');
        return;
    }

    const viewsRef = database.ref('articleViews');
    viewsRef.once('value', (snapshot) => {
        const views = snapshot.val() || {};
        callback(views);
    });
}

// Увеличить просмотры статьи в Firebase
function incrementViewInFirebase(articleId) {
    if (!database) {
        console.error('Firebase не инициализирован');
        return;
    }

    const viewRef = database.ref('articleViews/' + articleId);
    viewRef.transaction((currentViews) => {
        return (currentViews || 0) + 1;
    });
}

// Сбросить все просмотры в Firebase
function resetViewsInFirebase(callback) {
    if (!database) {
        console.error('Firebase не инициализирован');
        return;
    }

    const viewsRef = database.ref('articleViews');
    const resetData = {};
    articles.forEach(article => {
        resetData[article.id] = 0;
    });

    viewsRef.set(resetData, (error) => {
        if (error) {
            console.error('Ошибка сброса просмотров:', error);
        } else {
            callback();
        }
    });
}

// Подписаться на изменения просмотров в реальном времени
function subscribeToViewsUpdates(callback) {
    if (!database) {
        console.error('Firebase не инициализирован');
        return;
    }

    const viewsRef = database.ref('articleViews');
    viewsRef.on('value', (snapshot) => {
        const views = snapshot.val() || {};
        callback(views);
    });
}
