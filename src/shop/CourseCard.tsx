import { Link } from "react-router-dom";
import { ExternalLink, GraduationCap, PlayCircle } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { formation } from "@/data/formation";
import { COURSE_ID, courseProgress } from "@/lib/course";
import { formatPrice } from "@/lib/shop";
import { useCourse, useLessons, useMyAccess, useMyProgress } from "./useCourse";
import { formatDate, ProgressBar } from "./ui";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mb-6">{children}</h2>
);

/** Formation dans l'espace client : avancement et reprise si inscrit, sinon une invitation à la découvrir. */
const CourseCard = ({ userId }: { userId: string | undefined }) => {
  const { course } = useCourse();
  const { access, isLoading } = useMyAccess(userId);
  const lessons = useLessons(COURSE_ID, Boolean(access));
  const progress = useMyProgress(userId);

  if (isLoading || !course) return null;

  if (!access) {
    if (!course.on_sale) return null;
    return (
      <FadeIn className="mb-16">
        <SectionTitle>Formation</SectionTitle>
        <article className="flex gap-5 p-5 bg-cream border border-bordeaux/20 rounded-sm">
          <GraduationCap className="w-8 h-8 text-bordeaux shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-2xl text-foreground leading-tight mb-2">{course.title}</p>
            <p className="font-body text-sm leading-relaxed text-muted-foreground mb-3">{formation.tagline}</p>
            <p className="font-body text-xs tracking-[0.1em] text-foreground mb-4">{formatPrice(course.price_cents)} · accès à vie</p>
            <Link
              to="/formation"
              className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 transition-colors"
            >
              Découvrir la formation
            </Link>
          </div>
        </article>
      </FadeIn>
    );
  }

  const list = lessons.data ?? [];
  const summary = courseProgress(list, progress.data ?? []);
  const resume = list.find((l) => l.id === summary.resumeLessonId);

  return (
    <FadeIn className="mb-16">
      <SectionTitle>Ma formation</SectionTitle>
      <article className="p-5 md:p-6 bg-card/60 border border-border rounded-sm">
        <div className="flex gap-5">
          <GraduationCap className="w-8 h-8 text-bordeaux shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="font-display text-2xl text-foreground leading-tight mb-3">{course.title}</p>
            {list.length > 0 ? (
              <>
                <div className="flex items-center gap-4 mb-2">
                  <ProgressBar percent={summary.percent} className="flex-1" />
                  <span className="font-body text-xs text-muted-foreground whitespace-nowrap">
                    {summary.done}/{summary.total} leçons
                  </span>
                </div>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  {summary.finished
                    ? "Formation terminée, bravo ! Vos leçons et vos notes restent accessibles."
                    : resume && summary.started
                      ? `Reprendre : ${list.indexOf(resume) + 1}. ${resume.title}`
                      : "Prête à commencer quand vous l'êtes."}
                </p>
              </>
            ) : (
              <p className="font-body text-sm text-muted-foreground mb-4">Les leçons arrivent très bientôt.</p>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/compte/formation"
                className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 transition-colors"
              >
                <PlayCircle className="w-4 h-4" /> {summary.started ? "Continuer" : "Commencer"}
              </Link>
              <span className="font-body text-xs text-muted-foreground">
                {access.source === "offert" ? "Accès offert" : `Achetée le ${formatDate(access.paid_at ?? access.created_at)}`}
              </span>
              {access.receipt_url && (
                <a
                  href={access.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground hover:text-foreground"
                >
                  Reçu <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </FadeIn>
  );
};

export default CourseCard;
