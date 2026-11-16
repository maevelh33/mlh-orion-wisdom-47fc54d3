import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, FileText, GraduationCap, Lock, PlayCircle } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import Trailer from "@/components/Trailer";
import { useAuth } from "@/auth/AuthProvider";
import { callApi } from "@/lib/api";
import { formatDuration } from "@/lib/course";
import { formatPrice } from "@/lib/shop";
import { formation } from "@/data/formation";
import { useCourse, useMyAccess, useOutline } from "@/shop/useCourse";
import { Eyebrow, Notice, PageShell, PrimaryButton, Title } from "@/shop/ui";

/** Page de vente de la formation : programme, prix, paiement. */
const Formation = () => {
  const [params] = useSearchParams();
  const { session } = useAuth();
  const { course, isLoading } = useCourse();
  const outline = useOutline();
  const { access } = useMyAccess(session?.user.id);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lessons = outline.data ?? [];
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0);

  const checkout = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { url } = await callApi<{ url: string }>("checkout", { courseId: course!.id });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  return (
    <PageShell wide>
      {params.get("annule") && (
        <div className="mb-10">
          <Notice>Paiement annulé : rien n'a été débité. Vous pouvez reprendre quand vous voulez.</Notice>
        </div>
      )}

      <div className="grid gap-14 lg:grid-cols-[1fr_24rem] lg:items-start">
        <FadeIn>
          <Eyebrow>Formation</Eyebrow>
          <Title>{formation.title}</Title>
          <p className="font-body text-lg leading-relaxed text-muted-foreground mb-10 max-w-2xl">{formation.tagline}</p>

          <div className="max-w-2xl mb-12">
            <Trailer youtubeId={formation.trailerYoutubeId} title={`Bande-annonce — ${formation.title}`} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-14 max-w-2xl">
            {formation.benefits.map((b) => (
              <div key={b.text} className="flex items-start gap-3 p-4 bg-card/60 border border-border rounded-sm">
                <b.icon className="w-5 h-5 text-bordeaux mt-0.5 shrink-0" />
                <p className="font-body text-sm text-foreground leading-snug">{b.text}</p>
              </div>
            ))}
          </div>

          {lessons.length > 0 && (
            <section className="max-w-2xl mb-14">
              <div className="flex items-baseline justify-between gap-4 mb-5">
                <h2 className="font-display text-2xl md:text-3xl font-light text-foreground">Le programme</h2>
                <p className="font-body text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
                  {totalMinutes > 0 && ` · ${formatDuration(totalMinutes)}`}
                </p>
              </div>
              <ol className="divide-y divide-border border-y border-border">
                {lessons.map((l, i) => (
                  <li key={`${l.lesson_position}-${l.title}`} className="flex items-center gap-4 py-3.5">
                    <span className="w-7 shrink-0 font-display text-lg text-bordeaux/70 text-right">{i + 1}</span>
                    <span className="flex-1 font-body text-sm text-foreground">{l.title}</span>
                    {l.has_attachment && <FileText className="w-4 h-4 text-muted-foreground shrink-0" aria-label="Avec un PDF" />}
                    {l.duration_minutes && <span className="font-body text-xs text-muted-foreground shrink-0">{formatDuration(l.duration_minutes)}</span>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="max-w-2xl">
            <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-5">Votre espace de formation</h2>
            <p className="font-body text-base leading-relaxed text-muted-foreground mb-5">
              Dès votre paiement, la formation s'ouvre dans votre espace sur ce site. Vous y retrouvez :
            </p>
            <ul className="space-y-3">
              {formation.space.map((s) => (
                <li key={s.text} className="flex items-center gap-3 font-body text-sm text-foreground">
                  <s.icon className="w-4 h-4 text-bordeaux shrink-0" />
                  {s.text}
                </li>
              ))}
            </ul>
          </section>
        </FadeIn>

        <FadeIn className="lg:sticky lg:top-28">
          <div className="p-7 md:p-8 bg-cream border border-bordeaux/20 rounded-sm">
            <GraduationCap className="w-6 h-6 text-bordeaux mb-4" />
            {access ? (
              <>
                <p className="font-display text-2xl text-foreground mb-2">Vous suivez déjà cette formation</p>
                <p className="font-body text-sm text-muted-foreground mb-6">Reprenez là où vous vous êtes arrêté.</p>
                <Link
                  to="/compte/formation"
                  className="w-full inline-flex items-center justify-center gap-2 font-body text-sm tracking-[0.2em] uppercase px-8 py-4 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 transition-colors"
                >
                  <PlayCircle className="w-4 h-4" /> Continuer la formation
                </Link>
              </>
            ) : (
              <>
                <p className="font-display text-4xl font-light text-foreground mb-1">{course ? formatPrice(course.price_cents) : isLoading ? "…" : "—"}</p>
                <p className="font-body text-sm text-muted-foreground mb-6">Paiement unique — accès à vie</p>

                {course && !course.on_sale ? (
                  <Notice>Les inscriptions sont fermées pour le moment. Revenez bientôt !</Notice>
                ) : (
                  <>
                    <label className="flex items-start gap-3 mb-6 cursor-pointer font-body text-sm leading-relaxed text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                        className="mt-1 accent-[hsl(var(--bordeaux))]"
                      />
                      <span>
                        J'accepte les{" "}
                        <Link to="/cgv" target="_blank" className="underline underline-offset-2 hover:text-foreground">
                          conditions générales de vente
                        </Link>
                        . Je demande l'accès immédiat à la formation et reconnais perdre ainsi mon droit de rétractation.
                      </span>
                    </label>

                    {error && (
                      <div className="mb-4">
                        <Notice tone="danger">{error}</Notice>
                      </div>
                    )}

                    <PrimaryButton onClick={checkout} disabled={!course || !accepted || submitting} className="w-full py-4">
                      {submitting ? "Redirection vers le paiement…" : "Accéder à la formation"}
                    </PrimaryButton>
                  </>
                )}

                <p className="mt-4 flex items-center justify-center gap-2 font-body text-xs text-muted-foreground">
                  <Lock className="w-3.5 h-3.5" /> Paiement sécurisé par Stripe
                </p>
                <p className="mt-4 flex items-start gap-2 font-body text-xs leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-vert-antique shrink-0" />
                  {session
                    ? `Accès immédiat dans votre espace (${session.user.email}).`
                    : "Accès immédiat : votre espace est créé avec l'e-mail saisi au paiement. Connectez-vous ensuite avec cette adresse."}
                </p>
              </>
            )}
          </div>
        </FadeIn>
      </div>
    </PageShell>
  );
};

export default Formation;
