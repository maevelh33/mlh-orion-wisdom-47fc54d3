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
    window.open(STRIPE_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <section id="formation" className="py-24 md:py-32 bg-cream">
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn>
          <div className="p-8 md:p-12 bg-background rounded border border-border text-center">
            <GraduationCap className="w-6 h-6 text-bordeaux mx-auto mb-4" />
            <h3 className="font-display text-2xl md:text-3xl font-light text-foreground mb-3">
              Écrire un livre de A à Z
            </h3>
            <p className="font-body text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              De l'idée initiale au manuscrit prêt à être publié.
            </p>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-3 mb-10 text-left max-w-lg mx-auto">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3">
                  <b.icon className="w-4 h-4 text-bordeaux mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-foreground leading-snug">{b.text}</p>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
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
