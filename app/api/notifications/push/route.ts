import { NextRequest, NextResponse } from "next/server";
import { sendMessageToUser } from "@/lib/notifications/push/admin";
import { getUser } from "@/lib/db/queries";


export async function GET(req: NextRequest) {
    const user = await getUser();
    const subscriptions = await sendMessageToUser({
        message: {
            title: "Push Notification Title",
            body: "Push Notification Body"
        },
        userId: user.id
    });
    if(subscriptions) {
        return NextResponse.json({ response: "message delivered successfully"})
    }
    return NextResponse.json({ response: "message delivery failed"})
}