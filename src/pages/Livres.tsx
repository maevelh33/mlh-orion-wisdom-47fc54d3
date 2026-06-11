import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";
import chatonCover from "@/assets/chaton-cover.jpg";
import hybrisCoverAsset from "@/assets/hybris-cover.png.asset.json";
import { getAssetUrl } from "@/lib/assets";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: "easeOut" }} className={className}>
    {children}
  </motion.div>
);

const books = [
  {
    title: "Chaton",
    slug: "chaton",
    cover: chatonCover,
  },
  {
    title: "Hybris",
    slug: "hybris",
    cover: getAssetUrl(hybrisCoverAsset),
  },
];

const Livres = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-8 px-6 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <span className="font-display text-lg tracking-wide text-foreground">MLH.<span className="text-bordeaux">ORION</span></span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20 md:py-28">
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Bibliographie
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">
            Mes Livres & Écrits
          </h1>
          <div className="w-12 h-px bg-bordeaux mb-12" />
        </FadeIn>

        {/* Books */}
        <div className="grid gap-10 sm:grid-cols-2 mb-20">
          {books.map((book, i) => (
            <FadeIn key={book.title} delay={i * 0.1}>
              <div className="p-6 bg-card border border-border rounded flex flex-col items-center text-center">
                <Link to={`/livres/${book.slug}`} className="block w-full mb-6 overflow-hidden rounded">
                  <img
                    src={book.cover}
                    alt={`Couverture de ${book.title}`}
                    className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
                  />
                </Link>
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  {book.title}
                </h2>
                <Link
                  to={`/livres/${book.slug}`}
                  className="inline-flex items-center gap-2 font-body text-sm tracking-[0.15em] uppercase px-6 py-2.5 border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-background transition-colors"
                >
                  Plus d'infos <Info className="w-3.5 h-3.5" />
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Substack */}
        <FadeIn delay={0.3}>
          <div className="p-8 md:p-12 bg-cream rounded border border-border">
            <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
              Newsletter
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-4">
              Substack
            </h2>
            <div className="space-y-4 mb-8">
              <p className="font-body text-base leading-[1.9] text-muted-foreground">
                Pensées, articles, essais, poèmes… Mon Substack est l'espace où je dépose tout ce qui ne prend pas la forme d'un livre. Des textes libres, sur des sujets variés, écrits avec la même exigence et la même sincérité.
              </p>
              <p className="font-body text-base leading-[1.9] text-muted-foreground">
                L'abonnement est <strong className="text-foreground">entièrement gratuit</strong>. Pour celles et ceux qui souhaitent me soutenir et accéder à mes articles les plus longs et approfondis, une option à <strong className="text-foreground">5 € / mois</strong> est disponible.
              </p>
            </div>
            <a
              href="https://substack.com/@mlhorion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body text-sm tracking-[0.2em] uppercase px-8 py-3 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Découvrir mon Substack
            </a>
          </div>
        </FadeIn>
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} MLH.ORION — Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Livres;
