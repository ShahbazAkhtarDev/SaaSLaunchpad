import admin from "firebase-admin";

export const app = (() => {
    try {
        return admin.app();
    } catch (error) {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
            }),
        });
    }
})();

export const getMessaging = app.messaging;

export const sendMessage = async (message: admin.messaging.MulticastMessage) => {
    const response = await getMessaging().sendEachForMulticast(message);
    const failedTokens: string[] = [];
    if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(message.tokens[idx]);
            }
        });
    }
    return {
        failedTokens,
    };
}