import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next"
import { getServerSession as localGetServerSession } from "next-auth/next"
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"
import { db } from "@/lib/db/drizzle"
import type { SessionStrategy } from 'next-auth';
import EmailProvider from "next-auth/providers/email";
import { addInvitedUserToTeam, createTeam, updateUser } from "../db/queries";

export const authOptions = (req?: Request) => ({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST,
                port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD
                }
            },
            from: process.env.EMAIL_FROM
        }),
    ],
    session: {
        strategy: "jwt" as SessionStrategy,
    },
    callbacks: {
        async jwt({ token, account, user, trigger, session }: any) {
            if (account) {
                token.id = user?.id;
                token.role = user?.role;
                token.provider = account?.provider;
                token.type = account?.type;
            }
            if (trigger === "update" && session?.user) {
                token.name = session.user.name;
                token.email = session.user.email;
            }
            if (trigger === "signUp") {
                await handleSignup({ user, req });
            }
            return token
        },
        async session({ session, token }: { session: any, token: any }) {
            session.user.id = token?.id;
            session.user.role = token?.role;
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    }
})

export const getServerSession = async (...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) => {
    return await localGetServerSession(...args, authOptions());
};

const handleSignup = async ({ user, req }: { user: any, req?: Request }) => {
    if (!req) return;
    let inviteId, redirectUrl;
    try {
        const signinUrl = (new URL(req.url)).searchParams.get('callbackUrl'); // Returns callbackURL for the signup page
        redirectUrl = (new URL(signinUrl || '')).searchParams.get('callbackUrl'); // Returns callbackURL for the redirect page
        inviteId = (new URL(redirectUrl || '')).searchParams.get('inviteId'); // Returns teamInviteId
    } catch (error) {
        console.error("Error Signup redirectUrl: ", error)
    }
    if (inviteId) {
        await addInvitedUserToTeam({ inviteId: parseInt(inviteId), userId: user.id })
    } else {
        try {
            await updateUser(user.id, {
                role: 'owner'
            });
            await createTeam({
                teamName: `${user.name} Team's`,
                ownerId: user.id
            })
        } catch (error) {
            console.error("Error signup not invited: ", error)
        }
    }
}
