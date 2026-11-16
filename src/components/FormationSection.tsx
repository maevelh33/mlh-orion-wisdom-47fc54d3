import { Link } from "react-router-dom";
import { GraduationCap, CheckCircle2 } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { formation } from "@/data/formation";
import { formatPrice } from "@/lib/shop";
import { useCourse } from "@/shop/useCourse";

const FormationSection = () => {
  const { course } = useCourse();
  return (
    <section id="formation" className="py-24 md:py-32 bg-cream">
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn>
          <div className="p-8 md:p-12 bg-background rounded border border-border text-center">
            <GraduationCap className="w-6 h-6 text-bordeaux mx-auto mb-4" />
            <h3 className="font-display text-2xl md:text-3xl font-light text-foreground mb-3">{formation.title}</h3>
            <p className="font-body text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">{formation.tagline}</p>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-3 mb-10 text-left max-w-lg mx-auto">
              {formation.benefits.map((b) => (
                <div key={b.text} className="flex items-start gap-2.5 p-3">
                  <b.icon className="w-4 h-4 text-bordeaux mt-0.5 shrink-0" />
                  <p className="font-body text-sm text-foreground leading-snug">{b.text}</p>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <p className="font-display text-2xl md:text-3xl font-light text-foreground mb-1">{formatPrice(course?.price_cents ?? 22500)}</p>
            <p className="font-body text-sm text-muted-foreground mb-6">Paiement unique — accès à vie</p>

            <Link
              to="/formation"
              className="inline-flex items-center justify-center gap-2 font-body text-sm tracking-[0.2em] uppercase px-10 py-3.5 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 active:scale-[0.97] transition-all"
            >
              Découvrir la formation
            </Link>

            <p className="font-body text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-vert-antique" />
              Accès immédiat dans votre espace, avec le suivi de votre avancement
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FormationSection;
