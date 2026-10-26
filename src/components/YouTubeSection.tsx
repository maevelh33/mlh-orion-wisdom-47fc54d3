import { Youtube } from "lucide-react";
import FadeIn from "@/components/FadeIn";

const CHANNEL_URL = "https://www.youtube.com/@mlhorion";
// Playlist de toutes les vidéos mises en ligne (identifiant de chaîne avec « UU » au lieu de « UC »)
const UPLOADS_PLAYLIST = "UUyWM4YRwHwAxld74qQ-6wMA";

const YouTubeSection = () => {
  return (
    <section id="youtube" className="py-24 md:py-32 bg-cream">
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            YouTube
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">
            La Chaîne
          </h2>
          <div className="w-12 h-px bg-vert-antique mb-10" />
        </FadeIn>

        {/* Dernières vidéos : la playlist « uploads » de la chaîne se met à jour toute seule */}
        <FadeIn delay={0.1}>
          <div>
            <div className="relative aspect-video overflow-hidden rounded border border-border bg-foreground shadow-lg">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${UPLOADS_PLAYLIST}`}
                title="Dernières vidéos de la chaîne MLH.ORION"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="mt-6 text-center">
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 font-body text-sm tracking-[0.2em] uppercase px-8 py-3 border border-vert-antique text-vert-antique hover:bg-vert-antique hover:text-background transition-colors"
              >
                <Youtube className="w-4 h-4" />
                Voir la chaîne
              </a>
            </div>
          </div>
        </FadeIn>

        {/* Value proposition */}
        <FadeIn delay={0.45}>
          <div className="mt-12 p-8 bg-background rounded border border-border">
            <h3 className="font-display text-2xl font-medium text-foreground mb-4">
              La valeur de ma chaîne
            </h3>
            <p className="font-body text-base leading-[1.9] text-muted-foreground mb-4">
              Dans un monde saturé de faux experts et de discours vides, ma chaîne est un espace
              de partage, de transmission, et de clarification. Chaque vidéo naît d'un travail
              rigoureux&nbsp;: recherches longues, lectures croisées, synthèse des idées.
            </p>
            <p className="font-body text-base leading-[1.9] text-muted-foreground mb-4">
              J'essaie d'offrir ce que j'aurais voulu trouver moi-même&nbsp;: un contenu qui éclaire
              sans dicter, qui transmet sans abrutir, qui respecte l'intelligence de celles et ceux
              qui regardent.
            </p>
            <p className="font-body text-base leading-[1.9] text-muted-foreground mb-4">
              Dans un monde saturé d'idées, où l'on confond l'intensité avec la vérité et l'imitation avec la pensée, ma chaîne ne cherche pas à séduire par l'excès. Nous vivons dans une époque ivre d'images rapides, de contenu IA, de jugements hâtifs, et de polémiques stériles. Le sensationnel y règne sans profondeur. Les opinions se caricaturent, se radicalisent et ne se rencontrent plus. Beaucoup exploitent les émotions immédiates, simplifient à l'extrême des réalités complexes, car c'est plus consommable que la nuance. Là où d'autres divisent, j'unifie. Là où d'autres exploitent, je questionne. Là où d'autres assènent, j'invite à réfléchir.
            </p>
            <p className="font-body text-base leading-[1.9] text-muted-foreground">
              J'invite à la <em>phronesis</em>&nbsp;; une prudence active, une sagesse pratique qui ne se contente pas de savoir, mais qui cherche le juste discernement dans l'action. Une intelligence capable de tenir ensemble complexité et clarté, principe et humanité. Je m'efforce de réhabiliter la nuance, la profondeur, et la responsabilité intérieure. Car réfléchir véritablement, c'est accepter l'inconfort&nbsp;; c'est renoncer aux certitudes faciles pour approcher une compréhension plus exigeante.
            </p>
          </div>
        </FadeIn>

        {/* Process */}
        <FadeIn delay={0.55}>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Recherche", desc: "Semaines de lectures croisées, d'analyses et de synthèse." },
              { step: "02", title: "Création", desc: "Écriture du script, apprentissage, tournage et montage." },
              { step: "03", title: "Publication", desc: "Miniature, description et mise en ligne soignées." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <p className="font-display text-3xl text-vert-antique font-light mb-2">{item.step}</p>
                <h4 className="font-display text-lg font-medium text-foreground mb-2">{item.title}</h4>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default YouTubeSection;
