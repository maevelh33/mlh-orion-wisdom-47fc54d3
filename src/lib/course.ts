// Types et règles de la formation, partagés par le site et les fonctions serveur (netlify/).
import type { OrderStatus } from "./shop";

/** La formation en vente sur le site (une seule pour l'instant). */
export const COURSE_ID = "ecrire-un-livre";

export interface Course {
  id: string;
  title: string;
  price_cents: number;
  on_sale: boolean;
  updated_at?: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  position: number;
  title: string;
  summary: string;
  youtube_id: string | null;
  duration_minutes: number | null;
  attachment_path: string | null;
  published: boolean;
  updated_at?: string;
}

/** Programme public : titres et durées, sans les vidéos. */
export interface OutlineEntry {
  lesson_position: number;
  title: string;
  duration_minutes: number | null;
  has_attachment: boolean;
}

export interface Enrollment {
  id: string;
  user_id: string | null;
  email: string;
  customer_name: string | null;
  course_id: string;
  status: OrderStatus;
  amount_total_cents: number;
  amount_refunded_cents: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  receipt_url: string | null;
  source: "checkout" | "import" | "offert";
  welcome_sent_at: string | null;
  created_at: string;
  paid_at: string | null;
  refunded_at: string | null;
}

export interface LessonProgress {
  user_id: string;
  lesson_id: string;
  last_seen_at: string;
  completed_at: string | null;
  notes: string;
}

/** Une inscription donne accès à la formation tant qu'elle n'est pas entièrement remboursée. */
export const grantsCourse = (e: Pick<Enrollment, "status">) => e.status === "paid" || e.status === "partially_refunded";

/**
 * Identifiant d'une vidéo YouTube à partir d'un lien (youtu.be/…, watch?v=…, embed/…, shorts/…)
 * ou de l'identifiant seul. Renvoie null si le texte n'en contient pas.
 */
export const youtubeId = (input: string): string | null => {
  const text = input.trim();
  if (/^[\w-]{11}$/.test(text)) return text;
  const match = text.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live|v)\/)([\w-]{11})(?![\w-])/);
  return match ? match[1] : null;
};

/** Lecteur YouTube sans cookies publicitaires ni suggestions d'autres chaînes. */
export const youtubeEmbedUrl = (id: string, autoplay = false) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1${autoplay ? "&autoplay=1" : ""}`;

/** Avancement d'un élève : leçons terminées, pourcentage, leçon où reprendre. */
export const courseProgress = (lessons: Pick<Lesson, "id">[], progress: Pick<LessonProgress, "lesson_id" | "completed_at" | "last_seen_at">[]) => {
  const byLesson = new Map(progress.map((p) => [p.lesson_id, p]));
  const done = lessons.filter((l) => byLesson.get(l.id)?.completed_at).length;
  const total = lessons.length;
  // Reprendre : à partir de la dernière leçon vue, la première qui n'est pas terminée.
  const lastSeen = progress
    .filter((p) => lessons.some((l) => l.id === p.lesson_id))
    .sort((a, b) => b.last_seen_at.localeCompare(a.last_seen_at))[0];
  const start = Math.max(0, lastSeen ? lessons.findIndex((l) => l.id === lastSeen.lesson_id) : 0);
  const fromStart = [...lessons.slice(start), ...lessons.slice(0, start)];
  const resume = fromStart.find((l) => !byLesson.get(l.id)?.completed_at) ?? lessons[0];
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0,
    finished: total > 0 && done === total,
    resumeLessonId: resume?.id ?? null,
    started: Boolean(lastSeen),
  };
};

/**
 * Durée saisie dans l'administration, en minutes : « 12 », « 12 min », « 12:34 » (min:s),
 * « 1:02:30 » (h:min:s), « 1h05 », « 1 h 5 min ». Les secondes arrondissent à la minute
 * supérieure. Renvoie null si le texte n'est pas une durée.
 */
export const parseDuration = (input: string): number | null => {
  const text = input.trim().toLowerCase().replace(",", ".");
  let seconds: number | null = null;
  const clock = text.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const [a, b, c] = clock.slice(1).map((v) => (v === undefined ? undefined : Number(v)));
    seconds = c === undefined ? a! * 60 + b! : a! * 3600 + b! * 60 + c;
  } else {
    const parts = text.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*(?:min|mn|m)?)?\s*(?:(\d+)\s*s)?$/);
    if (parts && (parts[1] || parts[2] || parts[3])) seconds = Number(parts[1] ?? 0) * 3600 + Number(parts[2] ?? 0) * 60 + Number(parts[3] ?? 0);
  }
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.ceil(seconds / 60);
};

export const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}` : `${m} min`;
};
