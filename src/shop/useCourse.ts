import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { COURSE_ID, grantsCourse, type Course, type Enrollment, type Lesson, type LessonProgress, type OutlineEntry } from "@/lib/course";

/** Valeurs affichées tant que la base n'est pas joignable. */
const FALLBACK_COURSE: Course = { id: COURSE_ID, title: "Écrire un livre de A à Z", price_cents: 22500, on_sale: true };

export const useCourse = (id = COURSE_ID) => {
  const query = useQuery({
    queryKey: ["course", id],
    queryFn: async (): Promise<Course | null> => {
      if (!supabase) return FALLBACK_COURSE;
      const { data, error } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Course | null;
    },
  });
  return { ...query, course: query.data ?? (query.isError ? FALLBACK_COURSE : undefined) };
};

/** Programme public (titres, durées) : visible avant l'achat. */
export const useOutline = (id = COURSE_ID) =>
  useQuery({
    queryKey: ["course-outline", id],
    enabled: Boolean(supabase),
    queryFn: async (): Promise<OutlineEntry[]> => {
      const { data, error } = await supabase!.rpc("course_outline", { course: id });
      if (error) throw error;
      return data as OutlineEntry[];
    },
  });

export const useMyEnrollments = (userId: string | undefined) =>
  useQuery({
    queryKey: ["enrollments", userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<Enrollment[]> => {
      // Filtre explicite : l'administratrice peut tout lire, mais son espace ne montre que les siennes.
      const { data, error } = await supabase!.from("enrollments").select("*").eq("user_id", userId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Enrollment[];
    },
  });

/** Inscription qui donne accès à la formation, s'il y en a une. */
export const useMyAccess = (userId: string | undefined, courseId = COURSE_ID) => {
  const enrollments = useMyEnrollments(userId);
  const access = enrollments.data?.find((e) => e.course_id === courseId && grantsCourse(e));
  return { ...enrollments, access };
};

/** Leçons publiées (avec les vidéos) : seuls les inscrits les reçoivent, grâce aux règles RLS. */
export const useLessons = (courseId: string, enabled: boolean) =>
  useQuery({
    queryKey: ["lessons", courseId],
    enabled: Boolean(supabase && enabled),
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase!
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId)
        .eq("published", true)
        .order("position")
        .order("created_at");
      if (error) throw error;
      return data as Lesson[];
    },
  });

export const useMyProgress = (userId: string | undefined) =>
  useQuery({
    queryKey: ["progress", userId],
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<LessonProgress[]> => {
      const { data, error } = await supabase!.from("lesson_progress").select("*").eq("user_id", userId!);
      if (error) throw error;
      return data as LessonProgress[];
    },
  });
