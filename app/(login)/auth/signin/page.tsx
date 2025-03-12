import { getProviders } from "next-auth/react"
import { getServerSession } from "@/lib/auth/auth-options"
import SigninForm from "./signin-form"
import { redirect } from "next/navigation";

export default async function SignIn(req: any) {
  const session = await getServerSession()

  if (session) {
    const callbackUrl = (await req?.searchParams)?.callbackUrl;
    redirect(callbackUrl || process.env.BASE_URL || '/');
  }

  const providers = await getProviders();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {providers && <SigninForm providers={providers} />}
      </div>
    </div>
  )
}
