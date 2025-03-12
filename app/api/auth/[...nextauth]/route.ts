import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { NextRequest } from 'next/server';

const handler = async (req: NextRequest, context: any) => {
  return await NextAuth(req, context, authOptions(req.clone()));
};

export { handler as GET, handler as POST };