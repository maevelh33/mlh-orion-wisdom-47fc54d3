import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Music, Youtube } from "lucide-react";
import alineBoard from "@/assets/aline-board.jpg";
import sergueiBoard from "@/assets/serguei-board.jpg";
import mehranBoard from "@/assets/mehran-board.jpg";
import chatonCover from "@/assets/chaton-cover.jpg";
import hybrisCoverAsset from "@/assets/hybris-cover.png.asset.json";
import hybrisEsmeWarrold from "@/assets/hybris-esme-warrold.png.asset.json";
import hybrisWolfgangWarrold from "@/assets/hybris-wolfgang-warrold.png.asset.json";
import hybrisJerichoCaelim from "@/assets/hybris-jericho-caelim.png.asset.json";
import hybrisHenryHills from "@/assets/hybris-henry-hills.png.asset.json";
import hybrisJohnHills from "@/assets/hybris-john-hills.png.asset.json";
import hybrisChristopheRetinguer from "@/assets/hybris-christophe-retinguer.png.asset.json";
import hybrisAdrielVarek from "@/assets/hybris-adriel-varek.png.asset.json";
import hybrisRaphaelVarek from "@/assets/hybris-raphael-varek.png.asset.json";
import hybrisGeorgeGassner from "@/assets/hybris-george-gassner.png.asset.json";
import hybrisLolaGassner from "@/assets/hybris-lola-gassner.png.asset.json";
import hybrisAvnerOrim from "@/assets/hybris-avner-orim.png.asset.json";
import hybrisZoharOrim from "@/assets/hybris-zohar-orim.png.asset.json";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay, ease: "easeOut" }} className={className}>
    {children}
  </motion.div>
);

interface Character {
  name: string;
  description?: string;
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
  titleNote?: { heading: string; paragraphs: string[] };
}

const booksData: Record<string, BookData> = {
  chaton: {
    title: "Chaton",
    slug: "chaton",
    cover: chatonCover,
    synopsis: [
      "Aline, une adolescente de dix-sept ans, refuse le sort que sa misère veut lui imposer. Orpheline, elle a été placée dans une famille d'accueil où elle est maltraitée. Plutôt que de subir ce traitement, elle prend la fuite, quitte à se retrouver seule dans les rues. Par hasard, elle croise Sergueï, un homme lié à la mafia russe ; la Bratva. Pour survivre, elle tente de gagner sa confiance… Mais peut-elle vraiment compter sur lui ? Est-il digne de confiance, ou va-t-il, comme tant d'autres, la décevoir ?",
      "Cependant, le destin se montre cruel : l'ami le plus proche de Sergueï n'est autre que Mehran. Aline, qui croyait l'avoir relégué à son passé, n'est pas heureuse de le revoir. Leur confrontation ravive d'anciennes blessures et met à nu tous les enjeux psychologiques qui sous-tendent leurs relations.",
      "Vous suivrez leur aventure à tous les trois, et verrez comment leurs destins s'entrelacent. Leur histoire commune révélera ce qu'il y a de plus beau… mais aussi de plus vil, dans l'âme humaine, à travers un triangle où se mêlent victime, bourreau et sauveur. C'est également l'histoire du passé d'Aline, qui sera la protagoniste de mon prochain Roman : HYBRIS",
    ],
    characters: [
      {
        name: "Aline",
        description: "Dix-sept ans, orpheline et survivante. Derrière sa fragilité apparente se cache une détermination farouche. Elle refuse de se laisser briser par un système qui l'a abandonnée.",
        image: alineBoard,
        playlists: {
          spotify: "https://open.spotify.com/playlist/2HzMHOqamfWnn09oICbuGb?si=c05c211d48b740fe",
          youtube: "https://youtu.be/haSMlCQq-Ns?si=Ra0pR2HIBU8URwCP",
        },
      },
      {
        name: "Sergueï",
        description: "Lié à la Bratva, Sergueï est un homme aux multiples facettes. Protecteur ou manipulateur ? La frontière est mince, et Aline devra apprendre à la discerner.",
        image: sergueiBoard,
        playlists: {
          spotify: "https://open.spotify.com/playlist/5HbgWkhWwq43JBtq00dUIn?si=f9515048a74f4b37",
          youtube: "https://youtu.be/dlWi9a5i4-0?si=RPm_jx9VJFjHCOVG",
        },
      },
      {
        name: "Mehran",
        description: "L'ami le plus proche de Sergueï, et un fantôme du passé d'Aline. Son retour vient interrompre le déroulement des évènements en la faveur d'Aline.",
        image: mehranBoard,
        playlists: {
          spotify: "https://open.spotify.com/playlist/6KVhTXNzVZlYMIRI4NdzPK?si=59b63e65c1004c8e",
          youtube: "https://youtu.be/zZzXXM_9uW4?si=UMx0uaNwAuoxomS1",
        },
      },
    ],
    aesthetic: [],
    links: [
      { label: "Lire sur Amazon", url: "https://www.amazon.fr/CHATON-Ma%C3%ABve-Orion-ebook/dp/B0FY32HL79/ref=sr_1_1?crid=1G8BY6093UYNP&dib=eyJ2IjoiMSJ9.KUzbZmnlzmBdrK32UZe-LA.UvV9BZ1_XGJ61v5yKoMlF0mc6FDC71JTNzpFLVOUsXg&dib_tag=se&keywords=chaton+mlh+orion&qid=1772190463&sprefix=chaton+mlh%2Caps%2C245&sr=8-1" },
      { label: "Lire gratuitement sur Wattpad", url: "https://www.wattpad.com/user/mlhorion" },
    ],
  },
  hybris: {
    title: "Hybris",
    slug: "hybris",
    cover: hybrisCoverAsset.url,
    synopsis: [
      "Wolfgang est un multi-milliardaire dans l'industrie de l'armement, appartenant à un ordre secret : les Sybarites. En son sein, des familles extrêmement puissantes complotent pour l'instauration d'un Nouvel Ordre Mondial. La dernière étape de leur plan millénaire est la Troisième Guerre Mondiale. À la suite de cet événement, tous les peuples devraient aspirer à la prétendue Paix Universelle qu'ils s'apprêteront, alors, à leur proposer.",
      "Cependant, la table hexagonale de ce nouvel ordre ne compte que six places, et les familles sont au nombre de sept. Wolfgang aurait dû se retirer du jeu après son grand final, et marier sa fille à John Hills, pour faire perdurer son sang, mais pas son nom, en son sein. Seulement, espérer qu'un être semblable à Mars s'efface sans demander son reste était illusoire. Il ne tirera pas sa révérence si aisément ; aussi décide-t-il d'anéantir les familles supérieures de l'Ordre Sybarite.",
      "Pour les éliminer, il engage une jeune espionne et tireuse d'élite : Aline. Il la fera passer pour sa fille, et elle deviendra ainsi Esmé. Elle devra s'infiltrer dans les demeures de chacune des familles, en découvrir les secrets, et y déposer des explosifs sans être démasquée.",
    ],
    characters: [
      { name: "Wolfgang Warrold", image: hybrisWolfgangWarrold.url },
      { name: "Esmé Warrold (Aline)", image: hybrisEsmeWarrold.url },
      { name: "John Hills", image: hybrisJohnHills.url },
      { name: "Henry Hills", image: hybrisHenryHills.url },
      { name: "Adriel Varek", image: hybrisAdrielVarek.url },
      { name: "Raphaël Varek", image: hybrisRaphaelVarek.url },
      { name: "George Gassner", image: hybrisGeorgeGassner.url },
      { name: "Lola Gassner", image: hybrisLolaGassner.url },
      { name: "Avner Orim", image: hybrisAvnerOrim.url },
      { name: "Zohar Orim", image: hybrisZoharOrim.url },
      { name: "Christophe Retinguer", image: hybrisChristopheRetinguer.url },
      { name: "Jéricho Caëlim", image: hybrisJerichoCaelim.url },
    ],
    aesthetic: [],
    links: [],
    titleNote: {
      heading: "Pourquoi le titre Hybris ?",
      paragraphs: [
        "ὕβρις : démesure, outrage, péché d'orgueil.",
        "Ce livre est à l'image de la démesure de certains grands de ce monde, et il est né lui-même d'une ambition démesurée : la mienne.",
        "La protagoniste, bien qu'orpheline, s'élèvera également au rang le plus haut de la société ; si haut qu'elle pensera un instant faire partie des Dieux. Ainsi ce livre est nommé : Hybris, en honneur à ce péché.",
        "L'hybris est le mouvement fautif de dépassement de la limite. Du point de vue philosophique et moral, c'est la tentation de démesure ou de folie imprudente des humains, tentés de rivaliser avec les dieux.",
        "La démesure désigne le fait de désirer plus que ce que la juste mesure du destin nous a attribué. Ceci vaut en général, dans la mythologie grecque, de terribles punitions de leur part. Le châtiment de l'hybris, par les dieux, est la némésis, qui fait se rétracter l'individu à l'intérieur des limites qu'il a franchies. La mythologie regorge de récits mettant en scène un personnage puni pour son hybris envers les dieux.",
      ],
    },
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
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Roman
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-light text-foreground mb-2">
            {book.title}
          </h1>
          <div className="w-12 h-px bg-bordeaux mb-12" />
        </FadeIn>

        {book.cover && (
          <FadeIn delay={0.1}>
            <div className="mb-16 flex justify-center">
              <img src={book.cover} alt={`Couverture de ${book.title}`} className="max-w-xs w-full shadow-lg rounded" />
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
            {book.links.length > 0 && (
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
              <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
                Les protagonistes
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-8">
                Personnages
              </h2>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                      <div className="border border-border bg-card/60 p-4 md:p-5 rounded-sm h-full">
                        {char.image ? (
                          <div className="aspect-[4/5] bg-cream border border-border rounded-sm overflow-hidden mb-4 flex items-center justify-center p-2">
                            <img
                              src={char.image}
                              alt={char.name}
                              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/5] bg-muted rounded-sm mb-4 flex items-center justify-center">
                            <span className="font-display text-4xl text-muted-foreground/30">{char.name[0]}</span>
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

                        {hasPlaylists && (
                          <>
                            <p className="font-body text-xs text-muted-foreground/70 italic mb-3 text-center">
                              (Les sons qui incarnent sa vibe, décrivent une part de son caractère en paroles, et ceux écoutés en écrivant.)
                            </p>
                            <div className="flex flex-col gap-2">
                              {char.playlists?.spotify && (
                                <a
                                  href={char.playlists.spotify}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 font-body text-xs tracking-wider uppercase px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors rounded"
                                >
                                  <Music className="w-4 h-4" /> Écouter la playlist Spotify
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
                          </>
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
