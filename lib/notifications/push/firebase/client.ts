import { initializeApp, getApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = (() => {
    try {
      return getApp();
    } catch (error) {
      return initializeApp(firebaseConfig)
    }
  })();

export const requestPermission = async () => {
    let currentToken = '', permissionStatus = '';
    try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {

            // Retrieve the notification permission status
            permissionStatus = await Notification.requestPermission();

            // Check if permission is granted before retrieving the token
            if (permissionStatus === 'granted') {
                const messaging = await getMessaging(app);
                currentToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID,
                });
                if (!currentToken) {
                    console.error('No registration token available. Request permission to generate one.');
                }
            }
        }
    } catch (error) {
        console.error('An error occurred while retrieving token:', error);
    }

    return { token: currentToken, permissionStatus };
}