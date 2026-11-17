/* Firebase Cloud Messaging service worker. This file must be served from the
   site root so browsers can receive push while the dashboard is closed. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyCleXo6CQ5IP9tg0V8VgfLmH_-VRgb7wlA",
    authDomain: "onepro-e4bda.firebaseapp.com",
    projectId: "onepro-e4bda",
    storageBucket: "onepro-e4bda.firebasestorage.app",
    messagingSenderId: "403456072690",
    appId: "1:403456072690:web:84790ed1ee00fe6a72296b",
    measurementId: "G-775G1WFB0T"
});

firebase.messaging();
