import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import YouTubeSection from "@/components/YouTubeSection";
import FormationSection from "@/components/FormationSection";
import ServicesSection from "@/components/ServicesSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <ServicesSection />
      <FormationSection />
      <HeroSection />
      <AboutSection />
      <YouTubeSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
