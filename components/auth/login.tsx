"use client";

import { FcGoogle } from "react-icons/fc";
import { Button } from "../ui/button";
import  {authClient}  from "@/app/lib/auth-client";

export const LoginButton = () => {
    const signinWithGoogle = async () => await authClient.signIn.social({
        callbackURL: "/home",
        provider: "google"
    })
    return(
        <div className="flex items-center">
            <Button className="w-[45%]" variant="outline"
            onClick={signinWithGoogle}>
                <FcGoogle/>
                Google
            </Button>
        </div>
    )
}   