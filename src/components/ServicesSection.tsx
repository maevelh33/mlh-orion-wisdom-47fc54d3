import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Youtube, Instagram, BookOpen, Calendar, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
};

const externalLinks = [
  { icon: Youtube, label: "YouTube", desc: "Philosophie, psychologie, patrimoine", href: "https://www.youtube.com/@mlhorion", external: true },
  { icon: Instagram, label: "Instagram", desc: "Réflexions & coulisses", href: "https://www.instagram.com/mlh.orion", external: true },
  { icon: Heart, label: "Ko-fi", desc: "Me soutenir par un don", href: "https://ko-fi.com/mlhorion", external: true },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 md:py-32 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Retrouvez-moi
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">
            Liens & Services
          </h2>
          <div className="w-12 h-px bg-bordeaux mb-12" />
        </FadeIn>

        {/* PRIMARY OFFER — Réserver un appel */}
        <FadeIn delay={0.1}>
          <div className="relative p-8 md:p-14 bg-cream rounded border-2 border-bordeaux/30 shadow-[0_20px_60px_-30px_hsl(var(--bordeaux)/0.4)] text-center mb-16 overflow-hidden">
            <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 font-body text-[10px] tracking-[0.25em] uppercase text-bordeaux">
              <Sparkles className="w-3 h-3" /> Recommandé
            </div>

            <Calendar className="w-7 h-7 text-bordeaux mx-auto mb-5" />
            <h3 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
              Réservez un appel personnalisé
            </h3>
            <p className="font-body text-base md:text-lg text-muted-foreground mb-2 max-w-xl mx-auto leading-relaxed">
              Vous souhaitez échanger, obtenir des conseils sur un sujet qui vous tient à cœur,
              poser les questions qui vous préoccupent, ou simplement discuter&nbsp;?
            </p>
            <p className="font-body text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
              Je vous propose des appels sur rendez-vous, dans un cadre confidentiel et bienveillant.
            </p>

            <a
              href="https://tally.so/r/9qdl7p"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-body text-sm tracking-[0.2em] uppercase px-10 py-4 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 active:scale-[0.97] transition-all"
            >
              Prendre rendez-vous
            </a>

            <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground/80 mt-5">
              50&nbsp;€ / heure · paiement sécurisé
            </p>
          </div>
        </FadeIn>

        {/* Livres — featured card */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <FadeIn delay={0.15}>
            <Link
              to="/livres"
              className="block h-full p-7 bg-card border border-border rounded hover:border-bordeaux/40 transition-colors group"
            >
              <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-bordeaux transition-colors mb-4" />
              <h3 className="font-display text-xl font-medium text-foreground mb-1">Livres</h3>
              <p className="font-body text-sm text-muted-foreground">Découvrir mes ouvrages et essais</p>
            </Link>
          </FadeIn>
          <FadeIn delay={0.2}>
            <a
              href="#formation"
              className="block h-full p-7 bg-card border border-border rounded hover:border-bordeaux/40 transition-colors group"
            >
              <Sparkles className="w-5 h-5 text-muted-foreground group-hover:text-bordeaux transition-colors mb-4" />
              <h3 className="font-display text-xl font-medium text-foreground mb-1">Formation</h3>
              <p className="font-body text-sm text-muted-foreground">Écrire un livre de A à Z</p>
            </a>
          </FadeIn>
        </div>

        {/* Other links */}
        <div className="grid sm:grid-cols-3 gap-6">
          {externalLinks.map((link, i) => (
            <FadeIn key={link.label} delay={0.25 + i * 0.08}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full p-6 bg-card border border-border rounded hover:border-bordeaux/40 transition-colors group"
              >
                <link.icon className="w-5 h-5 text-muted-foreground group-hover:text-bordeaux transition-colors mb-4" />
                <h3 className="font-display text-lg font-medium text-foreground mb-1">{link.label}</h3>
                <p className="font-body text-sm text-muted-foreground">{link.desc}</p>
              </a>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
