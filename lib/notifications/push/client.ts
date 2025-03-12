"use client"

import { requestPermission as firebaseRequestPermission } from './firebase/client';
import { requestPermission as onesignalRequestPermission } from './onesignal/client';
import { subscribeToPushNotifications } from '@/lib/db/queries/push-subscriptions';

type RequestPermissionType = { token: string; permissionStatus: string; }
export const requestPermission = async (): Promise<RequestPermissionType> => {
    let response: RequestPermissionType = { token: '', permissionStatus: '' };

    const provider = process.env.NEXT_PUBLIC_PUSH_NOTIFICATIONS_CHANNEL;
    if(!provider) return response
    
    if (provider === 'firebase') {
        response = await firebaseRequestPermission();
    }

    if (provider === 'onesignal') {
        response = await onesignalRequestPermission();
    }

    if (response.permissionStatus === 'granted') {
        await subscribeToPushNotifications(response.token, provider);
    }
    return response
};