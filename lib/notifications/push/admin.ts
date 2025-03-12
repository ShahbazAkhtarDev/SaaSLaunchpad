import { z } from "zod"
import { sendMessage as firebaseSendMessage } from "./firebase/admin";
import { sendMessage as onesignalSendMessage } from "./onesignal/admin";
import { getUserPushSubscriptions, removeDeviceToken } from "../../db/queries";

const sendMessageToUserSchema = z.object({
    message: z.object({
        title: z.string().min(3),
        body: z.string().min(3)
    }),
    userId: z.string()
})

export const sendMessageToUser = async ({ message, userId }: z.infer<typeof sendMessageToUserSchema>) => {
    const provider = process.env.NEXT_PUBLIC_PUSH_NOTIFICATIONS_CHANNEL
    if(!provider) return false
    
    const pushSubscriptions = await getUserPushSubscriptions(userId, provider);
    if(!pushSubscriptions.length) return false

    let failedTokens: string[] = [];
    const content = {
        tokens: pushSubscriptions.map(item => item.token),
        notification: {
            title: message.title,
            body: message.body
        }
    }
    if (provider === 'firebase') {
        ({failedTokens: failedTokens} = await firebaseSendMessage(content));
    }
    if (provider === 'onesignal') {
        await onesignalSendMessage(content);
    }
    if(failedTokens.length) {
        failedTokens.forEach(async token => await removeDeviceToken(token))
    }
    return true
}