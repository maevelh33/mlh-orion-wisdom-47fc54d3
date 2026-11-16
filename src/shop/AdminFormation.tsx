// Onglet « Formation » de l'administration : réglages, leçons, élèves, import et invitations.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff, Mail, Plus, Trash2, Upload } from "lucide-react";
import { callApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { COURSE_ID, formatDuration, grantsCourse, parseDuration, youtubeId, type Enrollment, type Lesson } from "@/lib/course";
import { displayStatus, formatPrice } from "@/lib/shop";
import { useCourse } from "./useCourse";
import { formatDate, Notice, PrimaryButton, SecondaryButton, StatusBadge } from "./ui";

type Message = { tone: "success" | "danger" | "neutral"; text: string } | null;

const inputClass =
  "w-full px-3 py-2 bg-background border border-border rounded-sm font-body text-sm text-foreground focus:outline-none focus:border-bordeaux";

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block font-body text-[11px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5">{label}</span>
    {children}
    {hint && <span className="block font-body text-xs text-muted-foreground/80 mt-1">{hint}</span>}
  </label>
);

const Card = ({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) => (
  <section className="p-6 md:p-8 bg-card/50 border border-border rounded-sm">
    <h3 className="font-display text-2xl text-foreground mb-2">{title}</h3>
    {intro && <p className="font-body text-sm text-muted-foreground mb-6">{intro}</p>}
    {children}
  </section>
);

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

const useAllLessons = () =>
  useQuery({
    queryKey: ["admin", "lessons"],
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase!.from("course_lessons").select("*").eq("course_id", COURSE_ID).order("position").order("created_at");
      if (error) throw error;
      return data as Lesson[];
    },
  });

// ---------------------------------------------------------------------------
// Prix et ouverture des inscriptions
// ---------------------------------------------------------------------------
const Settings = () => {
  const queryClient = useQueryClient();
  const { course } = useCourse();
  const [price, setPrice] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  if (!course) return null;
  const shown = price ?? (course.price_cents / 100).toFixed(2).replace(".", ",");

  const save = async (patch: Record<string, unknown>) => {
    const { error } = await supabase!.from("courses").update(patch).eq("id", course.id);
    setMessage(error ? { tone: "danger", text: error.message } : { tone: "success", text: "Enregistré." });
    queryClient.invalidateQueries({ queryKey: ["course", course.id] });
  };

  return (
    <Card title={course.title}>
      <div className="grid gap-5 md:grid-cols-[12rem_auto_1fr] md:items-end">
        <Field label="Prix (€)">
          <input inputMode="decimal" value={shown} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </Field>
        <PrimaryButton
          onClick={() => {
            const cents = Math.round(Number(shown.replace(",", ".")) * 100);
            if (!cents || cents <= 0) return setMessage({ tone: "danger", text: "Prix invalide." });
            save({ price_cents: cents });
          }}
        >
          Enregistrer
        </PrimaryButton>
        <label className="flex items-center gap-3 font-body text-sm text-foreground md:justify-self-end cursor-pointer">
          <input type="checkbox" checked={course.on_sale} onChange={(e) => save({ on_sale: e.target.checked })} className="accent-[hsl(var(--bordeaux))]" />
          Inscriptions ouvertes
        </label>
      </div>
      {message && (
        <div className="mt-5">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Leçons
// ---------------------------------------------------------------------------
const LessonEditor = ({ lesson, index, count, move }: { lesson: Lesson; index: number; count: number; move: (dir: -1 | 1) => void }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(!lesson.youtube_id);
  const saved = {
    title: lesson.title,
    video: lesson.youtube_id ? `https://youtu.be/${lesson.youtube_id}` : "",
    duration: lesson.duration_minutes ? String(lesson.duration_minutes) : "",
    summary: lesson.summary,
  };
  const [form, setForm] = useState(saved);
  // Modifications saisies mais pas encore enregistrées : signalées pour ne pas les perdre.
  const dirty = (Object.keys(saved) as (keyof typeof saved)[]).some((k) => form[k] !== saved[k]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const id = form.video.trim() ? youtubeId(form.video) : null;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] });
  const update = async (patch: Partial<Lesson>, ok = "Leçon enregistrée.") => {
    setBusy(true);
    const { error } = await supabase!.from("course_lessons").update(patch).eq("id", lesson.id);
    setBusy(false);
    setMessage(error ? { tone: "danger", text: error.message } : { tone: "success", text: ok });
    refresh();
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setMessage({ tone: "danger", text: "Le titre est obligatoire." });
    if (form.video.trim() && !id) return setMessage({ tone: "danger", text: "Lien YouTube non reconnu. Copiez le lien de partage de la vidéo." });
    const minutes = form.duration.trim() ? parseDuration(form.duration) : null;
    if (form.duration.trim() && !minutes)
      return setMessage({ tone: "danger", text: "Durée non reconnue. Écrivez par exemple « 12 », « 12:34 » ou « 1h05 »." });
    update({ title: form.title.trim(), youtube_id: id, duration_minutes: minutes, summary: form.summary.trim() });
    // Le formulaire reprend la forme enregistrée (« 12:34 » devient « 13 »).
    setForm({ title: form.title.trim(), video: id ? `https://youtu.be/${id}` : "", duration: minutes ? String(minutes) : "", summary: form.summary.trim() });
  };

  const upload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) return setMessage({ tone: "danger", text: "Format accepté : PDF." });
    setBusy(true);
    setMessage({ tone: "neutral", text: "Envoi du PDF…" });
    const path = `${COURSE_ID}/${lesson.id}.pdf`;
    const { error } = await supabase!.storage.from("formation").upload(path, file, { upsert: true, contentType: "application/pdf" });
    setBusy(false);
    if (error) return setMessage({ tone: "danger", text: error.message });
    update({ attachment_path: path }, "PDF enregistré.");
  };

  const remove = async () => {
    if (!confirm(`Supprimer la leçon « ${lesson.title} » ? Le suivi des élèves pour cette leçon sera aussi supprimé.`)) return;
    if (lesson.attachment_path) await supabase!.storage.from("formation").remove([lesson.attachment_path]);
    const { error } = await supabase!.from("course_lessons").delete().eq("id", lesson.id);
    if (error) setMessage({ tone: "danger", text: error.message });
    refresh();
  };

  return (
    <li className="border border-border rounded-sm bg-background">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="w-6 font-display text-lg text-bordeaux/70 text-right shrink-0">{index + 1}</span>
        <button onClick={() => setOpen((o) => !o)} className="flex-1 min-w-0 text-left">
          <span className="block font-body text-sm text-foreground truncate">{lesson.title}</span>
          <span className="block font-body text-xs text-muted-foreground">
            {[
              lesson.youtube_id ? "Vidéo ✓" : "Sans vidéo",
              lesson.duration_minutes ? formatDuration(lesson.duration_minutes) : null,
              lesson.attachment_path ? "PDF ✓" : null,
              lesson.published ? null : "Masquée",
              dirty ? "Modifications non enregistrées" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </button>
        <button onClick={() => move(-1)} disabled={index === 0} aria-label="Monter" className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ArrowUp className="w-4 h-4" />
        </button>
        <button onClick={() => move(1)} disabled={index === count - 1} aria-label="Descendre" className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => update({ published: !lesson.published }, lesson.published ? "Leçon masquée aux élèves." : "Leçon visible par les élèves.")}
          aria-label={lesson.published ? "Masquer aux élèves" : "Montrer aux élèves"}
          title={lesson.published ? "Visible par les élèves" : "Masquée aux élèves"}
          className="p-1.5 text-muted-foreground hover:text-foreground"
        >
          {lesson.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <form onSubmit={save} className="grid gap-4 px-4 pb-5 pt-2 border-t border-border md:grid-cols-[1fr_9rem]">
          <Field label="Titre">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Durée" hint="12, 12:34 ou 1h05">
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={inputClass} />
          </Field>
          <div className="md:col-span-2 grid gap-4 md:grid-cols-[1fr_10rem] md:items-start">
            <Field label="Lien de la vidéo YouTube" hint="Vidéo « non répertoriée » : seuls les inscrits verront le lecteur sur le site.">
              <input
                value={form.video}
                onChange={(e) => setForm({ ...form, video: e.target.value })}
                placeholder="https://youtu.be/…"
                className={inputClass}
              />
            </Field>
            {id && <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="Aperçu de la vidéo" className="w-40 aspect-video object-cover rounded-sm border border-border" />}
          </div>
          <div className="md:col-span-2">
            <Field label="Résumé & conseils" hint="Affiché sous la vidéo. Laissez une ligne vide entre deux paragraphes.">
              <textarea rows={5} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" disabled={busy}>
              Enregistrer
            </PrimaryButton>
            {dirty && <span className="font-body text-xs text-bordeaux">Non enregistré</span>}
            <label className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-border hover:border-bordeaux hover:text-bordeaux cursor-pointer transition-colors">
              <Upload className="w-4 h-4" /> {lesson.attachment_path ? "Remplacer le PDF" : "Ajouter un PDF"}
              <input type="file" accept=".pdf" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            <button type="button" onClick={remove} className="ml-auto inline-flex items-center gap-1.5 font-body text-xs text-muted-foreground hover:text-bordeaux">
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
          {message && (
            <div className="md:col-span-2">
              <Notice tone={message.tone}>{message.text}</Notice>
            </div>
          )}
        </form>
      )}
    </li>
  );
};

const Lessons = () => {
  const queryClient = useQueryClient();
  const { data: lessons = [], isLoading } = useAllLessons();
  const [message, setMessage] = useState<Message>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] });

  const add = async () => {
    const position = (lessons.at(-1)?.position ?? 0) + 1;
    const { error } = await supabase!.from("course_lessons").insert({ course_id: COURSE_ID, position, title: `Leçon ${lessons.length + 1}` });
    if (error) setMessage({ tone: "danger", text: error.message });
    refresh();
  };

  // Échange la place de deux leçons (positions renumérotées 1, 2, 3… pour rester propres).
  const move = async (index: number, dir: -1 | 1) => {
    const order = [...lessons];
    [order[index], order[index + dir]] = [order[index + dir], order[index]];
    const results = await Promise.all(order.map((l, i) => supabase!.from("course_lessons").update({ position: i + 1 }).eq("id", l.id)));
    const failed = results.find((r) => r.error);
    if (failed) setMessage({ tone: "danger", text: failed.error!.message });
    refresh();
  };

  return (
    <Card
      title="Leçons"
      intro="Pour chaque leçon : collez le lien de la vidéo YouTube (non répertoriée), ajoutez la durée, le résumé et, si besoin, un PDF. Les élèves voient les leçons dans cet ordre."
    >
      {isLoading ? (
        <p className="font-body text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <ol className="grid gap-3 mb-5">
          {lessons.map((l, i) => (
            <LessonEditor key={`${l.id}-${l.updated_at ?? ""}`} lesson={l} index={i} count={lessons.length} move={(dir) => move(i, dir)} />
          ))}
        </ol>
      )}
      <SecondaryButton onClick={add}>
        <Plus className="w-4 h-4" /> Ajouter une leçon
      </SecondaryButton>
      {message && (
        <div className="mt-5">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Élèves
// ---------------------------------------------------------------------------
const Students = () => {
  const queryClient = useQueryClient();
  const { data: lessons = [] } = useAllLessons();
  const enrollments = useQuery({
    queryKey: ["admin", "enrollments"],
    queryFn: async (): Promise<Enrollment[]> => {
      const { data, error } = await supabase!.from("enrollments").select("*").eq("course_id", COURSE_ID).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Enrollment[];
    },
  });
  const progress = useQuery({
    queryKey: ["admin", "course-students"],
    queryFn: async () => {
      const { data, error } = await supabase!.rpc("course_students", { course: COURSE_ID });
      if (error) throw error;
      return data as { user_id: string; lessons_done: number; last_seen_at: string }[];
    },
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<Message>(null);

  const all = enrollments.data ?? [];
  const active = all.filter(grantsCourse);
  const revenue = all.reduce((sum, e) => sum + (grantsCourse(e) ? e.amount_total_cents - e.amount_refunded_cents : 0), 0);
  const published = lessons.filter((l) => l.published).length;
  const progressOf = (userId: string | null) => progress.data?.find((p) => p.user_id === userId);

  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const r = await callApi<{ granted: string }>("admin", { action: "course-grant", courseId: COURSE_ID, email, name });
      setMessage({ tone: "success", text: `Accès offert à ${r.granted}. Envoyez-lui l'invitation ci-dessous.` });
      setEmail("");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      setMessage({ tone: "danger", text: errorText(err) });
    }
  };

  return (
    <Card title="Élèves" intro={`${active.length} élève${active.length > 1 ? "s" : ""} avec accès · ${formatPrice(revenue)} encaissés.`}>
      {all.length > 0 && (
        <ul className="mb-8 divide-y divide-border border-y border-border font-body text-sm max-h-[28rem] overflow-y-auto">
          {all.map((e) => {
            const p = progressOf(e.user_id);
            return (
              <li key={e.id} className="py-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-foreground">
                    {e.customer_name ? `${e.customer_name} · ` : ""}
                    <span className="text-muted-foreground">{e.email}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.source === "offert" ? "Offert" : e.source === "import" ? "Ancien lien Stripe" : "Site"} · {formatDate(e.paid_at ?? e.created_at)}
                    {!e.user_id && " · pas encore connecté"}
                    {p && ` · ${p.lessons_done}/${published} leçons · vu le ${formatDate(p.last_seen_at)}`}
                  </p>
                </div>
                <StatusBadge status={displayStatus({ format: "ebook", status: e.status, shipped_at: null }, { ebook_status: "available" })} />
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={grant} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field label="Offrir l'accès · e-mail">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Nom (facultatif)">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <PrimaryButton type="submit">Offrir l'accès</PrimaryButton>
      </form>
      <p className="mt-2 font-body text-xs text-muted-foreground">Pour une personne qui a payé autrement (virement, ancien service…) ou un cadeau.</p>
      {message && (
        <div className="mt-5">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Import de l'ancien lien Stripe et invitations
// ---------------------------------------------------------------------------
const Import = () => {
  const queryClient = useQueryClient();
  const [link, setLink] = useState("https://buy.stripe.com/bJe6oI3Ne9FG26UdcOfw401");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const invites = useQuery({
    queryKey: ["admin", "course-invites"],
    queryFn: () => callApi<{ people: { email: string; name: string | null; source: string }[] }>("admin", { action: "course-invite-list" }),
  });
  const people = invites.data?.people ?? [];

  const run = async (action: () => Promise<string>) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage({ tone: "success", text: await action() });
    } catch (e) {
      setMessage({ tone: "danger", text: errorText(e) });
    }
    setBusy(false);
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  const importLink = () =>
    run(async () => {
      const r = await callApi<{ imported: number; skipped: number }>("admin", { action: "course-import", paymentLinkUrl: link, courseId: COURSE_ID });
      return `${r.imported} achat(s) importé(s), ${r.skipped} ignoré(s).`;
    });

  const preview = () =>
    run(async () => {
      const r = await callApi<{ sent: string }>("admin", { action: "course-invite-preview", courseId: COURSE_ID });
      return `Aperçu envoyé à ${r.sent}. Vérifiez votre boîte (et les indésirables).`;
    });

  const send = () => {
    if (!confirm(`Envoyer l'invitation « Votre formation vous attend » à ${people.length} personne${people.length > 1 ? "s" : ""} ?`)) return;
    run(async () => {
      let total = 0;
      const failures: string[] = [];
      // Par lots : on rappelle tant qu'il reste des personnes à inviter.
      for (;;) {
        const r = await callApi<{ sent: number; remaining: number; failures: string[] }>("admin", { action: "course-invite" });
        total += r.sent;
        failures.push(...r.failures);
        if (r.remaining === 0 || r.sent === 0) break;
      }
      if (failures.length) throw new Error(`${total} envoyées, ${failures.length} en échec : ${failures.join(" ; ")}`);
      return `${total} personne${total > 1 ? "s" : ""} invitée${total > 1 ? "s" : ""}.`;
    });
  };

  return (
    <Card
      title="Anciens élèves"
      intro="Importez les achats faits avec l'ancien lien de paiement Stripe : l'accès s'ouvre dès que la personne se connecte avec la même adresse. L'import n'envoie aucun e-mail et peut être relancé sans doublon. Ensuite, invitez-les à retrouver la formation dans leur espace."
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end mb-8">
        <Field label="Ancien lien de paiement de la formation">
          <input value={link} onChange={(e) => setLink(e.target.value)} className={inputClass} />
        </Field>
        <PrimaryButton onClick={importLink} disabled={busy || !link}>
          Importer
        </PrimaryButton>
      </div>

      <p className="font-body text-sm text-foreground mb-3">
        {invites.isLoading ? "Calcul…" : invites.isError ? "Liste indisponible." : `${people.length} personne${people.length > 1 ? "s" : ""} à inviter`}
      </p>
      {people.length > 0 && (
        <ul className="mb-6 max-h-60 overflow-y-auto divide-y divide-border border-y border-border font-body text-sm">
          {people.map((p) => (
            <li key={p.email} className="py-2 flex justify-between gap-4">
              <span className="min-w-0 truncate">
                {p.name ? `${p.name} · ` : ""}
                <span className="text-muted-foreground">{p.email}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{p.source === "offert" ? "Offert" : "Ancien lien"}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        <SecondaryButton onClick={preview} disabled={busy}>
          M'envoyer un aperçu
        </SecondaryButton>
        <PrimaryButton onClick={send} disabled={busy || people.length === 0}>
          <Mail className="w-4 h-4" /> Envoyer l'invitation
        </PrimaryButton>
      </div>
      {message && (
        <div className="mt-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </Card>
  );
};

const AdminFormation = () => (
  <div className="grid gap-8">
    <Settings />
    <Lessons />
    <Students />
    <Import />
  </div>
);

export default AdminFormation;
