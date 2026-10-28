import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import FadeIn from "@/components/FadeIn";
import BookNotice from "@/components/BookNotice";
import { booksData } from "@/data/books";

/** Livres présentés, dans l'ordre d'affichage. */
const SLUGS = ["chaton", "hybris"];

/** Cartes des livres (couverture, avancement, liens), sur la page Livres et sur l'accueil. */
const BookCards = ({ titleAs: TitleTag = "h2" }: { titleAs?: "h2" | "h3" }) => (
  <div className="grid gap-10 sm:grid-cols-2">
    {SLUGS.map((slug, i) => {
      const book = booksData[slug];
      return (
        <FadeIn key={slug} delay={i * 0.1}>
          <div className="h-full p-6 bg-card border border-border rounded flex flex-col items-center text-center">
            <Link to={`/livres/${slug}`} className="block w-full mb-6 overflow-hidden rounded">
              <img
                src={book.cover}
                alt={`Couverture de ${book.title}`}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-500 hover:scale-105"
              />
            </Link>
            <TitleTag className="font-display text-2xl font-medium text-foreground mb-4">{book.title}</TitleTag>
            {book.notice && <BookNotice className="mb-4">{book.notice}</BookNotice>}
            <div className="mt-auto flex flex-col items-center gap-3">
              <Link
                to={`/livres/${slug}`}
                className="inline-flex items-center gap-2 font-body text-sm tracking-[0.15em] uppercase px-6 py-2.5 border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-background transition-colors"
              >
                Plus d'infos <Info className="w-3.5 h-3.5" />
              </Link>
              {book.preorder && (
                <Link
                  to={`/livres/${slug}/precommander`}
                  className="font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-bordeaux transition-colors underline underline-offset-4"
                >
                  {slug === "hybris" ? "Précommander" : "Précommander l'ebook"}
                </Link>
              )}
            </div>
          </div>
        </FadeIn>
      );
    })}
  </div>
);

export default BookCards;
