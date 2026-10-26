import { Mail } from "lucide-react";
import FadeIn from "@/components/FadeIn";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 md:py-32 bg-cream">
      <div className="max-w-xl mx-auto px-6 text-center">
        <FadeIn>
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">
            Contact
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">
            Écrivez-moi
          </h2>
          <div className="w-12 h-px bg-vert-antique mx-auto mb-8" />
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="font-body text-sm text-muted-foreground mb-10 leading-relaxed">
            Je lis chaque message personnellement.<br />
            Délai de réponse : sous 5 jours ouvrés.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <a
            href="https://tally.so/r/aQBG9b"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 font-body text-sm tracking-[0.2em] uppercase px-10 py-3.5 bg-[hsl(var(--bordeaux))] text-primary-foreground hover:bg-[hsl(var(--bordeaux-light))] transition-colors"
          >
            <Mail className="w-4 h-4" />
            M'écrire
          </a>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="font-body text-xs text-muted-foreground/70 mt-10">
            Préférez-vous écrire directement ?{" "}
            <a
              href="mailto:maevemlh@gmail.com"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              maevemlh@gmail.com
            </a>
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default ContactSection;
