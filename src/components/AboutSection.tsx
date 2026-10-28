import FadeIn from "@/components/FadeIn";

const pillars = ["Philosophie", "Psychologie", "Littérature", "Science"];

const Subheading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mt-16 mb-6">{children}</h3>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p className="font-body text-base leading-[1.9] text-muted-foreground mb-6">{children}</p>
);

const AboutSection = () => {
  return (
    <section id="presentation" className="py-24 md:py-32 bg-cream">
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

        <FadeIn delay={0.1}>
          <p className="font-display text-2xl md:text-3xl font-light text-foreground mb-8">
            Je m'appelle Maëve Orion.
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <ul className="grid grid-cols-2 sm:grid-cols-4 border-y border-border mb-10" aria-label="Mes quatre piliers">
            {pillars.map((pillar, i) => (
              <li
                key={pillar}
                className={`py-5 text-center ${i > 0 ? "sm:border-l" : ""} ${i % 2 === 1 ? "border-l" : ""} ${
                  i > 1 ? "border-t sm:border-t-0" : ""
                } border-border`}
              >
                <span className="block font-display text-sm text-bordeaux/60 mb-1">0{i + 1}</span>
                <span className="font-body text-xs tracking-[0.2em] uppercase text-foreground">{pillar}</span>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn>
          <Subheading>L'esprit</Subheading>
          <Paragraph>
            Mon univers repose sur quatre piliers&nbsp;: philosophie, psychologie, littérature et science.
            J'explore les mécanismes humains, leurs contradictions et leurs conflits intérieurs,
            pour écrire avec profondeur et agir avec lucidité. La philosophie me guide vers le sens,
            la science m'impose la rigueur, et la lecture nourrit mon vocabulaire et encourage une pensée structurée.
          </Paragraph>
          <Paragraph>
            Mon cœur se nourrit d'idéaux&nbsp;: persévérance, courage, loyauté, dépassement de soi.
            Les mangas, notamment les shōnens, m'inspirent par leur foi en l'effort, en la solidarité
            et en la quête d'un idéal plus grand que soi. Je crois que la beauté sauvera le monde.
          </Paragraph>
        </FadeIn>

        <FadeIn>
          <Subheading>Le jeu et le corps</Subheading>
          <Paragraph>
            Formée aux Cours Florent, je relie écriture, jeu et image. Je pense mes récits comme des scènes
            cinématographiques, prêtes à vivre au-delà du papier.
          </Paragraph>
          <Paragraph>
            Enfin, je considère le corps comme un pilier d'excellence. L'équitation m'a appris la résilience,
            comme les sports de combat, et la danse et la musculation, la discipline et la maîtrise.
            Soigner son apparence et sa santé relève, pour moi, du bon sens.
          </Paragraph>
        </FadeIn>

        <FadeIn>
          <p className="font-display text-xl md:text-2xl font-light text-foreground leading-relaxed text-center my-14 px-4">
            Esprit, cœur et corps s'entrelacent dans une même exigence&nbsp;: devenir une humaine complète,
            et refuser la médiocrité au profit de l'excellence.
          </p>
        </FadeIn>

        <FadeIn>
          <Subheading>L'indépendance</Subheading>
          <Paragraph>
            Je ne dépends d'aucune institution, d'aucun parti, et je n'ai aucune idole.
            Je refuse d'être influencée par le ressentiment&nbsp;; je préfère la lucidité.
          </Paragraph>
          <Paragraph>
            Derrière chaque vidéo, chaque publication, il y a des années de recherche, de lectures,
            d'essais, d'apprentissage combinées. Rien n'a été improvisé, ni délégué. J'ai moi-même appris,
            au fil du temps, à manier les outils nécessaires pour tout construire de mes mains.
          </Paragraph>
          <Paragraph>
            Pour accéder à des sources plus riches, plus variées, j'ai appris l'anglais jusqu'à un niveau avancé,
            afin d'explorer des contenus souvent absents ou mal traduits en France.
          </Paragraph>
        </FadeIn>

        <FadeIn>
          <blockquote className="border-l-2 border-bordeaux pl-6 my-12">
            <p className="font-display text-xl md:text-2xl italic text-foreground leading-relaxed">
              «&nbsp;La connaissance, la pensée bienveillante et les valeurs sont sources de beauté
              et de liberté dans ce monde.&nbsp;»
            </p>
          </blockquote>
        </FadeIn>

        <FadeIn>
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
