
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "../lib/auth";
import { redirect } from "next/navigation";

const LoginPage = async () => {
    const session = await getSession();
    if(session) redirect("/home")

    return (
        <div className="flex items-center justify-center min-h-screen w-full">
            <Card className="w-87.5">
                <CardHeader>
                    <CardTitle>Sign into your account.</CardTitle>
                    <CardDescription>Using your preferred login method</CardDescription>
                </CardHeader>
                <CardContent className="items-center justify-center">
                    <LoginForm />
                </CardContent>
            </Card>
        </div>
    )
}
export default LoginPage;