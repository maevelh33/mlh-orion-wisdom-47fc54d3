import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-body text-xs tracking-[0.4em] uppercase text-primary-foreground/70 mb-6"
        >
          Philosophie · Psychologie · Littérature
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-primary-foreground mb-4 tracking-wide"
        >
          Maëve Orion
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="w-16 h-px bg-primary-foreground/40 mx-auto mb-6"
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="font-display text-lg md:text-xl text-primary-foreground/80 italic leading-relaxed"
        >
          Autrice · Actrice · Créatrice de Contenu · Philosophe
          <br />
          <span className="text-base not-italic text-primary-foreground/60">
            Indépendante, sans école, et sans maître.
          </span>
        </motion.p>

        <motion.a
          href="#presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="inline-block mt-12 font-body text-xs tracking-[0.3em] uppercase text-primary-foreground/60 hover:text-primary-foreground transition-colors border-b border-primary-foreground/30 pb-1"
        >
          Découvrir
        </motion.a>
      </div>
    </section>
  );
};

export default HeroSection;
