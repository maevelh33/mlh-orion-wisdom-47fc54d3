import FadeIn from "@/components/FadeIn";

const AboutSection = () => {
  return (
    <section id="presentation" className="py-24 md:py-32 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Présentation
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">
            Qui suis-je&nbsp;?
          </h2>
          <div className="w-12 h-px bg-bordeaux mb-10" />
        </FadeIn>

        <FadeIn delay={0.15}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Je m'appelle Maëve Orion.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Mon univers repose sur quatre piliers&nbsp;: philosophie, psychologie, littérature et science.
            J'explore les mécanismes humains, leurs contradictions et leurs conflits intérieurs,
            pour écrire avec profondeur et agir avec lucidité. La philosophie me guide vers le sens,
            la science m'impose la rigueur, et la lecture nourrit mon vocabulaire et encourage une pensée structurée.
            Mon cœur se nourrit d'idéaux&nbsp;: persévérance, courage, loyauté, dépassement de soi.
            Les mangas, notamment les shōnens, m'inspirent par leur foi en l'effort, en la solidarité
            et en la quête d'un idéal plus grand que soi. Je crois que la beauté sauvera le monde.
          </p>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Formée aux Cours Florent, je relie écriture, jeu et image. Je pense mes récits comme des scènes
            cinématographiques, prêtes à vivre au-delà du papier.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Enfin, je considère le corps comme un pilier d'excellence. L'équitation m'a appris la résilience,
            comme les sports de combat, et la danse et la musculation, la discipline et la maîtrise.
            Soigner son apparence et sa santé relève, pour moi, du bon sens.
          </p>
        </FadeIn>

        <FadeIn delay={0.35}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Esprit, cœur et corps s'entrelacent dans une même exigence&nbsp;: devenir une humaine complète,
            et refuser la médiocrité au profit de l'excellence.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Je ne dépends d'aucune institution, d'aucun parti, et je n'ai aucune idole.
            Je refuse d'être influencée par le ressentiment&nbsp;; je préfère la lucidité.
          </p>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Derrière chaque vidéo, chaque publication, il y a des années de recherche, de lectures,
            d'essais, d'apprentissage combinées. Rien n'a été improvisé, ni délégué. J'ai moi-même appris,
            au fil du temps, à manier les outils nécessaires pour tout construire de mes mains.
          </p>
        </FadeIn>

        <FadeIn delay={0.35}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">
            Pour accéder à des sources plus riches, plus variées, j'ai appris l'anglais jusqu'à un niveau avancé,
            afin d'explorer des contenus souvent absents ou mal traduits en France.
          </p>
        </FadeIn>

        <FadeIn delay={0.45}>
          <blockquote className="border-l-2 border-bordeaux pl-6 my-10">
            <p className="font-display text-xl md:text-2xl italic text-foreground leading-relaxed">
              «&nbsp;La connaissance, la pensée bienveillante et les valeurs sont sources de beauté
              et de liberté dans ce monde.&nbsp;»
            </p>
          </blockquote>
        </FadeIn>

        <FadeIn delay={0.55}>
          <p className="font-body text-base leading-[1.9] text-muted-foreground">
            J'écris mes livres, je poursuis mes apprentissages, et je continue d'élargir ma compréhension du monde.
            Ce sont des disciplines exigeantes, qui demandent du temps, et de l'endurance.
            Il me tient à cœur que chaque détail reflète ce que je défends&nbsp;: la rigueur, la beauté, et la sagesse.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default AboutSection;
