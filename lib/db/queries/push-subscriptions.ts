"use server"

import { db } from '@/lib/db/drizzle';
import { pushSubscriptions } from '@/lib/db/schema';
import { getUser } from './user';
import { cache } from 'react';
import { and, eq } from 'drizzle-orm';

export async function subscribeToPushNotifications(token: string, provider: string = "firebase") {
    const user = await getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const existingToken = cache(async () => {
        return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.token, token)).limit(1)
    });
    if ((await existingToken()).length > 0) {
        console.warn('Token already exists in the database', token);
        return false;
    }
    // Save the token to the database
    await db.insert(pushSubscriptions).values({
        userId: user.id,
        token,
        provider
    });
    return true
}

export async function removeDeviceToken(token: string) {
    const user = await getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.token, token));
    return true
}

export async function getUserPushSubscriptions(userId: string, provider: string = "firebase") {
    const user = await getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }
    return await db.select().from(pushSubscriptions).where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.provider, provider)
    ));
}