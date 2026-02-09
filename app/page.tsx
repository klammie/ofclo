import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSession } from "./lib/auth";
import { redirect } from "next/navigation";


const LandingPage = async () => {
  const session = await getSession();

  if (session) redirect("/home")
  return <div>This is the landing page
    <Link href="/login"><Button>Login</Button></Link>
  </div>;
};

export default LandingPage;
