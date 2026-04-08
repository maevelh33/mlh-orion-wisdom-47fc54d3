import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Music, Youtube } from "lucide-react";
import alineBoard from "@/assets/aline-board.jpg";
import sergueiBoard from "@/assets/serguei-board.jpg";
import mehranBoard from "@/assets/mehran-board.jpg";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: "easeOut" }} className={className}>
    {children}
  </motion.div>
);

interface Character {
  name: string;
  description: string;
  image?: string;
  playlists?: { youtube?: string; spotify?: string };
}

interface BookData {
  title: string;
  slug: string;
  cover?: string;
  synopsis: string[];
  characters: Character[];
  aesthetic: { image?: string; caption: string }[];
  links: { label: string; url: string }[];
}

const booksData: Record<string, BookData> = {
  chaton: {
    title: "Chaton",
    slug: "chaton",
    synopsis: [
      "Aline, une adolescente de dix-sept ans, refuse le sort que sa misère veut lui imposer. Orpheline, elle a été placée dans une famille d'accueil où elle est maltraitée. Plutôt que de subir ce traitement, elle prend la fuite, quitte à se retrouver seule dans les rues. Par hasard, elle croise Sergueï, un homme lié à la mafia russe ; la Bratva. Pour survivre, elle tente de gagner sa confiance… Mais peut-elle vraiment compter sur lui ? Est-il digne de confiance, ou va-t-il, comme tant d'autres, la décevoir ?",
      "Cependant, le destin se montre cruel : l'ami le plus proche de Sergueï n'est autre que Mehran. Aline, qui croyait l'avoir relégué à son passé, n'est pas heureuse de le revoir. Leur confrontation ravive d'anciennes blessures et met à nu tous les enjeux psychologiques qui sous-tendent leurs relations.",
      "Vous suivrez leur aventure à tous les trois, et verrez comment leurs destins s'entrelacent. Leur histoire commune révélera ce qu'il y a de plus beau… mais aussi de plus vil, dans l'âme humaine, à travers un triangle où se mêlent victime, bourreau et sauveur. C'est également l'histoire du passé d'Aline, qui sera la protagoniste de mon prochain Roman : HYBRIS",
    ],
    characters: [
      {
        name: "Aline",
        description: "Dix-sept ans, orpheline et survivante. Derrière sa fragilité apparente se cache une détermination farouche. Elle refuse de se laisser briser par un système qui l'a abandonnée.",
        playlists: {
          youtube: "",
          spotify: "",
        },
      },
      {
        name: "Sergueï",
        description: "Lié à la Bratva, Sergueï est un homme aux multiples facettes. Protecteur ou manipulateur ? La frontière est mince, et Aline devra apprendre à la discerner.",
        playlists: {
          youtube: "",
          spotify: "",
        },
      },
      {
        name: "Mehran",
        description: "L'ami le plus proche de Sergueï, et un fantôme du passé d'Aline. Son retour bouleverse l'équilibre fragile qu'elle tentait de construire.",
        playlists: {
          youtube: "",
          spotify: "",
        },
      },
    ],
    aesthetic: [],
    links: [
      { label: "Lire sur Amazon", url: "https://www.amazon.fr/CHATON-Ma%C3%ABve-Orion-ebook/dp/B0FY32HL79/ref=sr_1_1?crid=1G8BY6093UYNP&dib=eyJ2IjoiMSJ9.KUzbZmnlzmBdrK32UZe-LA.UvV9BZ1_XGJ61v5yKoMlF0mc6FDC71JTNzpFLVOUsXg&dib_tag=se&keywords=chaton+mlh+orion&qid=1772190463&sprefix=chaton+mlh%2Caps%2C245&sr=8-1" },
      { label: "Lire gratuitement sur Wattpad", url: "https://www.wattpad.com/user/mlhorion" },
    ],
  },
};

const BookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const book = slug ? booksData[slug] : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl text-foreground mb-4">Livre introuvable</p>
          <Link to="/livres" className="font-body text-sm text-bordeaux hover:underline">
            ← Retour aux livres
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-8 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/livres"
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux livres
          </Link>
          <Link to="/" className="font-display text-lg tracking-wide text-foreground">
            MLH.<span className="text-bordeaux">ORION</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* Title & Cover */}
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Roman
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-light text-foreground mb-2">
            {book.title}
          </h1>
          <div className="w-12 h-px bg-bordeaux mb-12" />
        </FadeIn>

        {/* Cover placeholder */}
        {book.cover && (
          <FadeIn delay={0.1}>
            <div className="mb-16 flex justify-center">
              <img src={book.cover} alt={`Couverture de ${book.title}`} className="max-w-xs w-full shadow-lg rounded" />
            </div>
          </FadeIn>
        )}

        {/* Synopsis */}
        <FadeIn delay={0.15}>
          <section className="mb-20">
            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-6">
              Synopsis
            </h2>
            <div className="space-y-4">
              {book.synopsis.map((p, i) => (
                <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground">
                  {p}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
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
            </div>
          </section>
        </FadeIn>

        {/* Characters */}
        <FadeIn delay={0.2}>
          <section className="mb-20">
            <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
              Les protagonistes
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-8">
              Personnages
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {book.characters.map((char, i) => (
                <motion.div
                  key={char.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                  className="p-6 bg-card border border-border rounded"
                >
                  {/* Character image placeholder */}
                  {char.image ? (
                    <img src={char.image} alt={char.name} className="w-full aspect-[3/4] object-cover rounded mb-4" />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-muted rounded mb-4 flex items-center justify-center">
                      <span className="font-display text-4xl text-muted-foreground/30">{char.name[0]}</span>
                    </div>
                  )}
                  <h3 className="font-display text-xl font-medium text-foreground mb-2">{char.name}</h3>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">{char.description}</p>
                  
                  {/* Playlist links */}
                  {char.playlists && (char.playlists.youtube || char.playlists.spotify) && (
                    <div className="flex flex-wrap gap-2">
                      {char.playlists.youtube && (
                        <a
                          href={char.playlists.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-body text-xs tracking-wider uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded"
                        >
                          <Youtube className="w-3.5 h-3.5" /> Playlist
                        </a>
                      )}
                      {char.playlists.spotify && (
                        <a
                          href={char.playlists.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-body text-xs tracking-wider uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded"
                        >
                          <Music className="w-3.5 h-3.5" /> Spotify
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* Aesthetic / Mood Board */}
        <FadeIn delay={0.25}>
          <section className="mb-20">
            <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
              Univers visuel
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-8">
              Esthétique & Atmosphère
            </h2>
            {book.aesthetic.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {book.aesthetic.map((item, i) => (
                  <div key={i} className="relative group">
                    {item.image && (
                      <img src={item.image} alt={item.caption} className="w-full aspect-square object-cover rounded" />
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors rounded flex items-end p-3">
                      <span className="font-body text-xs text-background opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.caption}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 bg-card border border-border rounded text-center">
                <p className="font-body text-sm text-muted-foreground italic">
                  Le mood board visuel sera bientôt disponible. Restez connecté(e).
                </p>
              </div>
            )}
          </section>
        </FadeIn>
      </main>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} MLH.ORION — Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BookDetail;
