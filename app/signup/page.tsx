import { Button } from "@/components/ui/button";
import Link from "next/link";

const SignupPage = () => {
    return (
        <div>
           <h1>This is the signup page</h1> 
           <Link href="/login"> <Button>Login</Button></Link>
        </div>
    )
}
export default SignupPage;  