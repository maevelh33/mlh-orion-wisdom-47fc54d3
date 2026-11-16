import { describe, expect, it } from "vitest";
import { courseProgress, formatDuration, parseDuration, youtubeId } from "./course";

describe("youtubeId", () => {
  it.each([
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["  dQw4w9WgXcQ ", "dQw4w9WgXcQ"],
  ])("%s", (input, id) => expect(youtubeId(input)).toBe(id));

  it("refuse ce qui n'est pas une vidéo", () => {
    expect(youtubeId("https://www.youtube.com/@mlhorion")).toBeNull();
    expect(youtubeId("bonjour")).toBeNull();
  });
});

describe("courseProgress", () => {
  const lessons = [{ id: "l1" }, { id: "l2" }, { id: "l3" }];
  const seen = (lesson_id: string, at: string, done = false) => ({ lesson_id, last_seen_at: at, completed_at: done ? at : null });

  it("pas encore commencé : reprendre à la première leçon", () => {
    expect(courseProgress(lessons, [])).toMatchObject({ done: 0, total: 3, percent: 0, started: false, resumeLessonId: "l1" });
  });

  it("reprend à la leçon commencée et non terminée", () => {
    const p = courseProgress(lessons, [seen("l1", "2026-11-01", true), seen("l2", "2026-11-02")]);
    expect(p).toMatchObject({ done: 1, percent: 33, resumeLessonId: "l2", started: true });
  });

  it("après une leçon terminée, passe à la suivante non terminée", () => {
    const p = courseProgress(lessons, [seen("l2", "2026-11-03", true), seen("l1", "2026-11-01", true)]);
    expect(p.resumeLessonId).toBe("l3");
  });

  it("revient aux leçons sautées en fin de parcours", () => {
    const p = courseProgress(lessons, [seen("l3", "2026-11-03", true), seen("l2", "2026-11-02", true)]);
    expect(p.resumeLessonId).toBe("l1");
  });

  it("tout terminé", () => {
    const p = courseProgress(lessons, lessons.map((l) => seen(l.id, "2026-11-01", true)));
    expect(p).toMatchObject({ done: 3, percent: 100, finished: true });
  });
});

it("formatDuration", () => {
  expect(formatDuration(12)).toBe("12 min");
  expect(formatDuration(65)).toBe("1 h 05");
  expect(formatDuration(120)).toBe("2 h");
  expect(formatDuration(null)).toBe("");
});

describe("parseDuration", () => {
  it.each([
    ["12", 12],
    ["12 min", 12],
    ["12min", 12],
    ["12 mn", 12],
    ["12:00", 12],
    ["12:34", 13],
    ["0:45", 1],
    ["1:02:30", 63],
    ["1h05", 65],
    ["1 h 5 min", 65],
    ["1h", 60],
    ["8 min 20 s", 9],
    ["12,5", 13],
    [" 7 ", 7],
  ])("%s → %i min", (input, minutes) => expect(parseDuration(input)).toBe(minutes));

  it("refuse ce qui n'est pas une durée", () => {
    for (const bad of ["", "abc", "0", "12:99:99:1", "-5", "douze"]) expect(parseDuration(bad)).toBeNull();
  });
});
