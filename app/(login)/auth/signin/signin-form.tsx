"use client"

import { BuiltInProviderType } from "@auth/core/providers";
import { signIn, LiteralUnion, ClientSafeProvider } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function SigninForm(
    { providers }:
        {
            providers: Record<LiteralUnion<BuiltInProviderType, string>, ClientSafeProvider> | null
        }
) {

    const handleEmailSignin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string
        signIn("email", { email })
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Signin</CardTitle>
                    <CardDescription>
                        Enter your email below to signin to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        {providers?.email && (
                            <form className="grid gap-6" onSubmit={handleEmailSignin}>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Signin with Email
                                </Button>
                            </form>
                        )}
                        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                            <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                Or
                            </span>
                        </div>

                        {providers && Object.values(providers)
                            .filter(provider => provider.name.toLowerCase() !== 'email')
                            .map((provider) => (
                                <div key={provider.name}>
                                    <Button className="w-full" variant="outline" onClick={() => signIn(provider.id)}>
                                        Sign in with {provider.name}
                                    </Button>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}