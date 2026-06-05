
import { getSession } from "./lib/auth";
import { redirect } from "next/navigation";
import LandingPageShell from "@/components/landing/LandingPageShell";
;

const LandingPage = async () => {
  const session = await getSession();

  if (session) redirect("/dashboard/user/feed")
  return <LandingPageShell />;
};

export default LandingPage;
