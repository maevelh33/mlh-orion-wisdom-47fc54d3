import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Music, Youtube } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { booksData } from "@/data/books";
import BookNotice from "@/components/BookNotice";

const BookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const book = slug ? booksData[slug] : undefined;
  const [isFlipped, setIsFlipped] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pages = book?.insidePages ?? (book?.insidePage ? [book.insidePage] : []);
  const hasPages = pages.length > 0;

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
      <Navbar />


      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16 md:pt-36 md:pb-24">
        <Link
          to="/livres"
          className="inline-flex items-center gap-2 mb-10 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tous les livres
        </Link>

        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Roman
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-light text-foreground mb-2">
            {book.title}
          </h1>
          <div className={`w-12 h-px bg-bordeaux ${book.notice ? "mb-6" : "mb-12"}`} />
          {book.notice && <BookNotice className="mb-12">{book.notice}</BookNotice>}
        </FadeIn>

        {book.cover && (
          <FadeIn delay={0.1}>
            <div className="mb-16 flex flex-col items-center">
              <div
                className="relative w-full max-w-xs"
                style={{ perspective: "1800px", aspectRatio: "2 / 3" }}
                onClick={() => hasPages && setIsFlipped((f) => !f)}
                role={hasPages ? "button" : undefined}
                aria-label={hasPages ? (isFlipped ? "Refermer le livre" : "Feuilleter le livre") : undefined}
              >
                {hasPages && (
                  <div className="absolute inset-0 shadow-lg rounded overflow-hidden bg-[hsl(var(--cream))]">
                    <img
                      src={pages[pageIndex]}
                      alt={`Page ${pageIndex + 1} de ${book.title}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <img
                  src={book.cover}
                  alt={`Couverture de ${book.title}`}
                  className={`absolute inset-0 w-full h-full object-cover shadow-2xl rounded transition-transform duration-1000 ease-in-out ${hasPages ? "cursor-pointer" : ""}`}
                  style={{
                    transformOrigin: "left center",
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(-160deg)" : "rotateY(0deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                />
              </div>
              {hasPages && (
                <>
                  <button
                    onClick={() => {
                      setIsFlipped((f) => !f);
                      if (isFlipped) setPageIndex(0);
                    }}
                    className="mt-6 font-body text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-bordeaux transition-colors"
                  >
                    {isFlipped ? "← Refermer le livre" : "Feuilleter le livre →"}
                  </button>
                  {isFlipped && pages.length > 1 && (
                    <div className="mt-4 flex items-center gap-6">
                      <button
                        onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                        disabled={pageIndex === 0}
                        className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-bordeaux transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        ← Précédente
                      </button>
                      <span className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground">
                        {pageIndex + 1} / {pages.length}
                      </span>
                      <button
                        onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
                        disabled={pageIndex === pages.length - 1}
                        className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-bordeaux transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Suivante →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </FadeIn>
        )}

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
            {(book.links.length > 0 || book.preorder) && (
              <div className="mt-8">
                <div className="flex flex-wrap gap-3">
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
                  {book.preorder && (
                    <Link
                      to={`/livres/${book.slug}/precommander`}
                      className={`inline-flex items-center gap-2 font-body text-sm tracking-[0.15em] uppercase px-6 py-2.5 transition-colors ${
                        book.slug === "hybris"
                          ? "border border-[#c9a84c] bg-[#14100a] text-[#f0d78c] hover:bg-[#2a2114]"
                          : "bg-bordeaux text-primary-foreground hover:bg-bordeaux/90"
                      }`}
                    >
                      {book.slug === "hybris" ? "Précommander" : "Précommander l'ebook"}
                    </Link>
                  )}
                </div>
                {book.slug === "hybris" && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/15 border border-[#c9a84c]/40 rounded-sm mt-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a8853a] animate-pulse" />
                    <p className="font-body text-sm text-[#6f5722] font-medium tracking-wide">
                      Dédicace personnalisée offerte — limitée aux 100 premiers acheteurs
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </FadeIn>

        {book.titleNote && (
          <FadeIn delay={0.18}>
            <section className="mb-20">
              <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-6">
                {book.titleNote.heading}
              </h2>
              <div className="space-y-4">
                {book.titleNote.paragraphs.map((p, i) => (
                  <p key={i} className="font-body text-base leading-[1.9] text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          </FadeIn>
        )}

        {book.characters.length > 0 && (
          <FadeIn delay={0.2}>
            <section className="mb-20">
              <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-8">
                Les Personnages :
              </h2>
              <div className="grid gap-8 sm:grid-cols-2">
                {book.characters.map((char, i) => {
                  const hasPlaylists = Boolean(char.playlists?.spotify || char.playlists?.youtube);

                  return (
                    <motion.article
                      key={char.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                      className="group"
                    >
                      <div className="border border-border bg-card/60 p-4 md:p-5 rounded-sm h-full flex flex-col">
                        {char.image ? (
                          <div className="aspect-[4/5] bg-cream border border-border rounded-sm overflow-hidden mb-3 flex items-center justify-center p-2">
                            <img
                              src={char.image}
                              alt={char.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/5] bg-muted rounded-sm mb-3 flex items-center justify-center">
                            <span className="font-display text-4xl text-muted-foreground/30">{char.name[0]}</span>
                          </div>
                        )}

                        {hasPlaylists && (
                          <div className="mb-3">
                            <p className="font-body text-[10px] text-muted-foreground/50 italic mb-2 text-center leading-relaxed">
                              (Chaque playlist représente l'état mental et l'énergie d'un personnage. Laisse la musique révéler son tempérament, ou tends l'oreille aux paroles.)
                            </p>
                            <div className="flex flex-col gap-2">
                              {char.playlists?.spotify && (
                                <a
                                  href={char.playlists.spotify}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 font-body text-xs tracking-wider uppercase px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded"
                                >
                                  <Music className="w-4 h-4" /> Lien vers la playlist spotify
                                </a>
                              )}
                              {char.playlists?.youtube && (
                                <a
                                  href={char.playlists.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 font-body text-xs tracking-wider uppercase px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded"
                                >
                                  <Youtube className="w-4 h-4" /> Écouter la playlist YouTube
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        <h3 className="font-display text-xl md:text-2xl leading-tight text-foreground text-center mb-2">
                          {char.name}
                        </h3>

                        {char.description && (
                          <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4 text-center">
                            {char.description}
                          </p>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>
          </FadeIn>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BookDetail;
