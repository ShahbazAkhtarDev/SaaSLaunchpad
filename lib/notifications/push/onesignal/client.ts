"use client"

import OneSignal from 'react-onesignal';

export const requestPermission = async () => {
    let permissionStatus = '';

    try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            await OneSignal.init({
                appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
                notifyButton: {
                    enable: true,
                },
                allowLocalhostAsSecureOrigin: true
            });

            permissionStatus = await Notification.requestPermission();
            
        }
    } catch (error) {
        console.error('An error occurred while retrieving token:', error);
    }

    return { token: (OneSignal.User.PushSubscription.id || ''), permissionStatus };
}