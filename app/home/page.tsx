import { SignoutButton } from "@/components/auth/sign-out";
import { getSession } from "../lib/auth";
import { redirect } from "next/navigation";

const HomePage = async () => {
    const session = await getSession();
    if(!session) redirect("/login")
return (
    <div><h1>This is the home page</h1>
        <SignoutButton />
    </div>
    
)
}

export default HomePage;