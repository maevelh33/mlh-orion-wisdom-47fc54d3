import { useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, ArrowLeft, Info } from "lucide-react";
import { Link } from "react-router-dom";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: "easeOut" }} className={className}>
    {children}
  </motion.div>
);

const books = [
  {
    title: "Chaton",
    slug: "chaton",
    description: [
      "Aline, une adolescente de dix-sept ans, refuse le sort que sa misère veut lui imposer. Orpheline, elle a été placée dans une famille d'accueil où elle est maltraitée. Plutôt que de subir ce traitement, elle prend la fuite, quitte à se retrouver seule dans les rues. Par hasard, elle croise Sergueï, un homme lié à la mafia russe ; la Bratva. Pour survivre, elle tente de gagner sa confiance… Mais peut-elle vraiment compter sur lui ? Est-il digne de confiance, ou va-t-il, comme tant d'autres, la décevoir ?",
      "Cependant, le destin se montre cruel : l'ami le plus proche de Sergueï n'est autre que Mehran. Aline, qui croyait l'avoir relégué à son passé, n'est pas heureuse de le revoir. Leur confrontation ravive d'anciennes blessures et met à nu tous les enjeux psychologiques qui sous-tendent leurs relations.",
      "Vous suivrez leur aventure à tous les trois, et verrez comment leurs destins s'entrelacent. Leur histoire commune révélera ce qu'il y a de plus beau… mais aussi de plus vil, dans l'âme humaine, à travers un triangle où se mêlent victime, bourreau et sauveur. C'est également l'histoire du passé d'Aline, qui sera la protagoniste de mon prochain Roman : HYBRIS",
    ],
    links: [
      { label: "Lire sur Amazon", url: "https://www.amazon.fr/CHATON-Ma%C3%ABve-Orion-ebook/dp/B0FY32HL79/ref=sr_1_1?crid=1G8BY6093UYNP&dib=eyJ2IjoiMSJ9.KUzbZmnlzmBdrK32UZe-LA.UvV9BZ1_XGJ61v5yKoMlF0mc6FDC71JTNzpFLVOUsXg&dib_tag=se&keywords=chaton+mlh+orion&qid=1772190463&sprefix=chaton+mlh%2Caps%2C245&sr=8-1" },
      { label: "Lire gratuitement sur Wattpad", url: "https://www.wattpad.com/user/mlhorion" },
    ],
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
        <div className="space-y-10 mb-20">
          {books.map((book, i) => (
            <FadeIn key={book.title} delay={i * 0.1}>
              <div className="p-8 bg-card border border-border rounded">
                <div className="flex items-start gap-4 mb-4">
                  <BookOpen className="w-5 h-5 text-bordeaux mt-1 shrink-0" />
                  <h2 className="font-display text-xl md:text-2xl font-medium text-foreground">
                    {book.title}
                  </h2>
                </div>
                <div className="ml-9 space-y-4 mb-6">
                  {book.description.map((paragraph, j) => (
                    <p key={j} className="font-body text-base leading-[1.9] text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 ml-9">
                  {book.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-body text-sm tracking-[0.15em] uppercase px-6 py-2.5 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                      {link.label} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                  <Link
                    to={`/livres/${book.slug}`}
                    className="inline-flex items-center gap-2 font-body text-sm tracking-[0.15em] uppercase px-6 py-2.5 border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-background transition-colors"
                  >
                    Plus d'infos <Info className="w-3.5 h-3.5" />
                  </Link>
                </div>
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
