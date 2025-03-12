import * as OneSignal from 'onesignal-node';


type MessageType = {
    tokens: string[];
    notification: {
        title: string,
        body: string,
        imageUrl?: string,
    }
}
export const sendMessage = async (message: MessageType) => {

    let failedTokens: string[] = [];

    const client = new OneSignal.Client(
        process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '', 
        process.env.ONESIGNAL_REST_API_KEY || ''
    );

    try {
        const notification = {
            contents: { en: message.notification.body },
            headings: { en: message.notification.title },
            include_subscription_ids: message.tokens,
            chrome_web_icon: message.notification.imageUrl,
        }
        const response = await client.createNotification(notification);
      } catch (e) {
        if (e instanceof OneSignal.HTTPError) {
          // When status code of HTTP response is not 2xx, HTTPError is thrown.
          console.error('onesignal error code', e.statusCode);
          console.error('onesignal error body', e.body);
        }
      }

    return {
        failedTokens,
    };
}