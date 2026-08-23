// app/page.tsx
import { getFeaturedCreators } from "@/lib/queries/featured-creators";
import LandingPage from "@/components/landing/LandingPageShell";

// Revalidate every 10 minutes so creators rotate without full rebuilds
export const revalidate = 600;

export default async function HomePage() {
  const featuredCreators = await getFeaturedCreators();

  return <LandingPage featuredCreators={featuredCreators} />;
}