import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import YouTubeSection from "@/components/YouTubeSection";
import FormationSection from "@/components/FormationSection";
import ServicesSection from "@/components/ServicesSection";
import ContactSection from "@/components/ContactSection";
import HybrisBanner from "@/components/HybrisBanner";
import BooksSection from "@/components/BooksSection";
import MetisBanner from "@/components/MetisBanner";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HybrisBanner />
      <BooksSection />
      <MetisBanner />
      <ServicesSection />
      <AboutSection />
      <YouTubeSection />
      <FormationSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
