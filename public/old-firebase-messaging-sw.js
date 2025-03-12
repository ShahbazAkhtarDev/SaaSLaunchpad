
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

const firebaseConfig = {"apiKey":"AIzaSyDTzqixHTz8BTL6WqCizgk239RhxB1lU84","authDomain":"next-saas-boilerplat.firebaseapp.com","projectId":"next-saas-boilerplat","storageBucket":"next-saas-boilerplat.firebasestorage.app","messagingSenderId":"56508023175","appId":"1:56508023175:web:52d010f8d5909497f29322","measurementId":"G-JWXZ4YTZN7"};
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
