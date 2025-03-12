import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/auth-options";

export async function GET(req: NextRequest) {
    const session = await getServerSession();
    if(!session?.user) {
        const loginURL = new URL(process.env.NEXT_PUBLIC_LOGIN_URL || '')
        loginURL.searchParams.append('callbackUrl', req?.url.toString());
        return NextResponse.redirect(loginURL.toString());
    }
    // Perform any actions needed after user joining
    return NextResponse.redirect(process.env.BASE_URL || '');
}