"use client"

import { authClient } from "@/app/lib/auth-client";
import { useRouter } from "next/navigation"
import { Button } from "../ui/button";

export const SignoutButton = () => {
    const router  = useRouter();

    const signout = async () => await authClient.signOut({
        fetchOptions: {
            onSuccess: () => router.push("/login"),
        },
    });

    return (
        <Button onClick={signout} variant="outline">Sign Out</Button>
    )
}