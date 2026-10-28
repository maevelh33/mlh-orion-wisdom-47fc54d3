import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import FadeIn from "@/components/FadeIn";
import BookCards from "@/components/BookCards";

/** Les livres, sur l'accueil (mêmes cartes que la page Livres). */
const BooksSection = () => (
  <section id="livres" className="py-24 md:py-32 bg-cream">
    <div className="max-w-3xl mx-auto px-6">
      <FadeIn>
        <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">Bibliographie</p>
        <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">Mes livres</h2>
        <div className="w-12 h-px bg-bordeaux mb-12" />
      </FadeIn>
      <BookCards titleAs="h3" />
      <FadeIn className="mt-12 text-center">
        <Link
          to="/livres"
          className="inline-flex items-center gap-2 font-body text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-bordeaux transition-colors"
        >
          Tous mes livres & écrits <ArrowRight className="w-4 h-4" />
        </Link>
      </FadeIn>
    </div>
  </section>
);

export default BooksSection;
