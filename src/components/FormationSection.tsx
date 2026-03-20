import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { GraduationCap, BookText, Video, FileText, CheckCircle2, Loader2 } from "lucide-react";

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20, filter: "blur(4px)" }} animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}} transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
};

const benefits = [
  { icon: Video, text: "18 modules vidéo pour maîtriser chaque étape" },
  { icon: BookText, text: "Résumés & conseils pratiques à chaque chapitre" },
  { icon: FileText, text: "PDF sur la structure et l'apparence de votre manuscrit" },
  { icon: GraduationCap, text: "Accès à vie — avancez à votre rythme" },
];

const STRIPE_LINK = "https://buy.stripe.com/bJe6oI3Ne9FG26UdcOfw401";

const FormationSection = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    window.location.href = STRIPE_LINK;
  };

  return (
    <section id="formation" className="py-24 md:py-32 bg-cream">
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Formation
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2 text-wrap-balance" style={{ lineHeight: 1.1 }}>
            Écrire un livre de A à Z
          </h2>
          <div className="w-12 h-px bg-bordeaux mb-8" />
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="font-body text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
            Une formation complète pour apprendre à écrire, structurer et finaliser votre livre.
            De l'idée initiale au manuscrit prêt à être publié — 18 modules, plusieurs heures
            de contenu vidéo, des résumés pratiques et des PDF pour vous guider pas à pas.
          </p>
        </FadeIn>

        {/* Benefits */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {benefits.map((b, i) => (
            <FadeIn key={i} delay={0.15 + i * 0.08}>
              <div className="flex items-start gap-3 p-4 bg-background rounded border border-border">
                <b.icon className="w-5 h-5 text-bordeaux mt-0.5 shrink-0" />
                <p className="font-body text-sm text-foreground leading-snug">{b.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Price + CTA */}
        <FadeIn delay={0.4}>
          <div className="text-center">
            <p className="font-display text-2xl md:text-3xl font-light text-foreground mb-1">
              225&nbsp;€
            </p>
            <p className="font-body text-sm text-muted-foreground mb-6">
              Paiement unique — accès à vie
            </p>

            <button
              onClick={handleClick}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 font-body text-sm tracking-[0.2em] uppercase px-10 py-3.5 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 active:scale-[0.97] transition-all disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirection…
                </>
              ) : (
                "Accéder à la formation"
              )}
            </button>

            <p className="font-body text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-vert-antique" />
              Paiement sécurisé via Stripe — Accès immédiat après validation
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FormationSection;
