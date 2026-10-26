import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24">
        <div className="text-center">
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">Erreur 404</p>
          <h1 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">Page introuvable</h1>
          <div className="w-12 h-px bg-bordeaux mx-auto mb-8" />
          <p className="font-body text-base text-muted-foreground mb-10">
            Cette page n'existe pas, ou plus.
          </p>
          <Link
            to="/"
            className="inline-block font-body text-sm tracking-[0.2em] uppercase px-8 py-3 border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-background transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
