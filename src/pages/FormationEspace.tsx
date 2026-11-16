import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Download, PartyPopper, PlayCircle } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { COURSE_ID, courseProgress, formatDuration, youtubeEmbedUrl, type Lesson, type LessonProgress } from "@/lib/course";
import { useCourse, useLessons, useMyAccess, useMyProgress } from "@/shop/useCourse";
import { Notice, PageShell, PrimaryButton, ProgressBar, SecondaryButton } from "@/shop/ui";

/** Durée de validité des liens vers les PDF : une heure, puis il faut recharger la page. */
const LINK_SECONDS = 60 * 60;

/** Notes personnelles d'une leçon, enregistrées automatiquement. */
const Notes = ({ progress, save }: { progress?: LessonProgress; save: (notes: string) => Promise<void> }) => {
  const [text, setText] = useState(progress?.notes ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<number>();
  const pending = useRef<string | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  // En changeant de leçon avant la fin du délai, les notes en attente sont enregistrées quand même.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (pending.current !== null) saveRef.current(pending.current);
    },
    [],
  );

  const change = (value: string) => {
    setText(value);
    setState("saving");
    pending.current = value;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      pending.current = null;
      await saveRef.current(value);
      setState("saved");
    }, 800);
  };

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux">Mes notes</h2>
        <span className="font-body text-xs text-muted-foreground" aria-live="polite">
          {state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré" : ""}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => change(e.target.value)}
        rows={5}
        placeholder="Vos idées, vos exercices, ce que vous voulez retenir de cette leçon…"
        className="w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-sm leading-relaxed focus:outline-none focus:border-bordeaux"
      />
      <p className="mt-1 font-body text-xs text-muted-foreground">Visibles par vous seul.</p>
    </section>
  );
};

/** Espace de la formation : vidéo, résumé, PDF, suivi et notes. */
const FormationEspace = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { course } = useCourse();
  const { access, isLoading: accessLoading } = useMyAccess(userId);
  const lessons = useLessons(COURSE_ID, Boolean(access));
  const progress = useMyProgress(userId);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const justPaid = params.get("inscription");
  const list = lessons.data ?? [];
  const mine = useMemo(() => progress.data ?? [], [progress.data]);
  const summary = courseProgress(list, mine);
  const current = list.find((l) => l.id === params.get("lecon")) ?? list.find((l) => l.id === summary.resumeLessonId);
  const index = current ? list.indexOf(current) : -1;
  const currentProgress = mine.find((p) => p.lesson_id === current?.id);

  // Retour de Stripe : l'inscription arrive par le webhook, parfois quelques secondes après.
  useEffect(() => {
    if (!justPaid || access) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      queryClient.invalidateQueries({ queryKey: ["enrollments", userId] });
      if (tries >= 15) window.clearInterval(timer);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [justPaid, access, queryClient, userId]);

  const upsert = async (lessonId: string, patch: Partial<LessonProgress>) => {
    await supabase!.from("lesson_progress").upsert({ user_id: userId, lesson_id: lessonId, ...patch }, { onConflict: "user_id,lesson_id" });
    queryClient.invalidateQueries({ queryKey: ["progress", userId] });
  };

  // Mémorise la leçon ouverte, pour reprendre ici la prochaine fois.
  useEffect(() => {
    if (current && userId && access) upsert(current.id, { last_seen_at: new Date().toISOString() });
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPdfUrl(null);
    if (!supabase || !current?.attachment_path) return;
    const name = `${current.title}.pdf`;
    supabase.storage
      .from("formation")
      .createSignedUrl(current.attachment_path, LINK_SECONDS, { download: name })
      .then(({ data }) => setPdfUrl(data?.signedUrl ?? null));
  }, [current?.id, current?.attachment_path, current?.title]);

  const open = (lesson: Lesson) => {
    setParams({ lecon: lesson.id }, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleDone = async () => {
    if (!current) return;
    const done = Boolean(currentProgress?.completed_at);
    await upsert(current.id, { completed_at: done ? null : new Date().toISOString() });
    if (!done && list[index + 1]) open(list[index + 1]);
  };

  if (accessLoading || (access && lessons.isLoading)) {
    return (
      <PageShell>
        <p className="font-body text-sm text-muted-foreground">Chargement…</p>
      </PageShell>
    );
  }

  const back = (
    <Link to="/compte" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft className="w-4 h-4" /> Mon espace
    </Link>
  );

  if (!access) {
    return (
      <PageShell>
        <div className="mb-10">{back}</div>
        {justPaid ? (
          <Notice tone="success">
            <strong className="font-medium">Merci pour votre inscription !</strong> Votre paiement est en cours d'enregistrement : la formation
            s'ouvre ici dans quelques instants.
          </Notice>
        ) : (
          <>
            <Notice>
              La formation ne fait pas encore partie de votre espace. Vous l'avez achetée avec une autre adresse e-mail ? Connectez-vous avec
              celle-ci pour la retrouver.
            </Notice>
            <Link to="/formation" className="inline-block mt-6 font-body text-sm text-bordeaux underline underline-offset-4">
              Découvrir la formation
            </Link>
          </>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">{back}</div>

      {justPaid && (
        <div className="mb-8">
          <Notice tone="success">
            <strong className="font-medium">Bienvenue dans la formation !</strong> Votre paiement est confirmé et un e-mail vous a été envoyé.
            <button onClick={() => setParams({}, { replace: true })} className="ml-2 underline underline-offset-2">
              Fermer
            </button>
          </Notice>
        </div>
      )}

      <header className="mb-8">
        <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3">Ma formation</p>
        <h1 className="font-display text-3xl md:text-5xl font-light text-foreground mb-5">{course?.title ?? "Formation"}</h1>
        <div className="flex items-center gap-4 max-w-xl">
          <ProgressBar percent={summary.percent} className="flex-1" />
          <span className="font-body text-xs text-muted-foreground whitespace-nowrap">
            {summary.done}/{summary.total} · {summary.percent} %
          </span>
        </div>
      </header>

      {summary.finished && (
        <div className="mb-8">
          <Notice tone="success">
            <span className="inline-flex items-center gap-2">
              <PartyPopper className="w-4 h-4" /> Bravo, vous avez terminé toute la formation ! Vos notes restent ici, à votre disposition.
            </span>
          </Notice>
        </div>
      )}

      {list.length === 0 ? (
        <Notice>Les leçons arrivent très bientôt. Vous serez prévenu dans votre espace.</Notice>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
          {current && (
            <article>
              {current.youtube_id ? (
                <div className="relative aspect-video bg-foreground/5 border border-border rounded-sm overflow-hidden shadow-lg">
                  <iframe
                    key={current.id}
                    src={youtubeEmbedUrl(current.youtube_id)}
                    title={current.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              ) : (
                <Notice>La vidéo de cette leçon arrive bientôt.</Notice>
              )}

              <p className="mt-8 font-body text-xs tracking-[0.25em] uppercase text-muted-foreground">
                Leçon {index + 1} sur {list.length}
                {current.duration_minutes ? ` · ${formatDuration(current.duration_minutes)}` : ""}
              </p>
              <h2 className="mt-2 font-display text-2xl md:text-4xl font-light text-foreground">{current.title}</h2>

              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton onClick={toggleDone} className={currentProgress?.completed_at ? "!bg-vert-antique hover:!bg-vert-antique/90" : ""}>
                  {currentProgress?.completed_at ? (
                    <>
                      <Check className="w-4 h-4" /> Leçon terminée
                    </>
                  ) : (
                    "Marquer comme terminée"
                  )}
                </PrimaryButton>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-primary-foreground transition-colors"
                  >
                    <Download className="w-4 h-4" /> Télécharger le PDF
                  </a>
                )}
              </div>

              {current.summary && (
                <section className="mt-10">
                  <h2 className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mb-3">Résumé & conseils</h2>
                  <div className="space-y-4">
                    {current.summary.split(/\n{2,}/).map((para, i) => (
                      <p key={i} className="font-body text-base leading-[1.85] text-muted-foreground whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              <Notes key={current.id} progress={currentProgress} save={(notes) => upsert(current.id, { notes })} />

              <nav className="mt-12 flex justify-between gap-4 border-t border-border pt-6">
                {list[index - 1] ? (
                  <SecondaryButton onClick={() => open(list[index - 1])}>
                    <ArrowLeft className="w-4 h-4" /> Précédente
                  </SecondaryButton>
                ) : (
                  <span />
                )}
                {list[index + 1] && (
                  <SecondaryButton onClick={() => open(list[index + 1])}>
                    Suivante <ArrowRight className="w-4 h-4" />
                  </SecondaryButton>
                )}
              </nav>
            </article>
          )}

          <aside className="lg:sticky lg:top-28">
            <h2 className="font-body text-xs tracking-[0.3em] uppercase text-bordeaux mb-4">Programme</h2>
            <ol className="border border-border rounded-sm divide-y divide-border bg-card/40 lg:max-h-[70vh] lg:overflow-y-auto">
              {list.map((l, i) => {
                const done = mine.some((p) => p.lesson_id === l.id && p.completed_at);
                const active = l.id === current?.id;
                return (
                  <li key={l.id}>
                    <button
                      onClick={() => open(l)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-cream" : "hover:bg-cream/60"}`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-vert-antique shrink-0" aria-label="Terminée" />
                      ) : active ? (
                        <PlayCircle className="w-4 h-4 mt-0.5 text-bordeaux shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 mt-0.5 text-muted-foreground/50 shrink-0" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className={`block font-body text-sm leading-snug ${active ? "text-bordeaux" : "text-foreground"}`}>
                          {i + 1}. {l.title}
                        </span>
                        {l.duration_minutes && <span className="block font-body text-xs text-muted-foreground mt-0.5">{formatDuration(l.duration_minutes)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}
    </PageShell>
  );
};

export default FormationEspace;
