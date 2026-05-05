import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import SupportedAssets from "@/components/landing/SupportedAssets";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  const isLoggedIn = !!session;

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} />
      <main>
        <Hero isLoggedIn={isLoggedIn} />
        <SupportedAssets />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA isLoggedIn={isLoggedIn} />
      </main>
      <Footer />
    </>
  );
}
