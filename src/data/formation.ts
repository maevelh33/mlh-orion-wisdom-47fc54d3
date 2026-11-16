import { BookText, FileText, GraduationCap, LineChart, Video } from "lucide-react";

/** Textes de présentation de la formation (accueil et page /formation). */
export const formation = {
  title: "Écrire un livre de A à Z",
  tagline: "De l'idée initiale au manuscrit prêt à être publié.",
  /** Bande-annonce sur YouTube (https://youtu.be/erdaMI8-zkg). */
  trailerYoutubeId: "erdaMI8-zkg",
  benefits: [
    { icon: Video, text: "18 modules vidéo pour maîtriser chaque étape" },
    { icon: BookText, text: "Résumés & conseils pratiques à chaque chapitre" },
    { icon: FileText, text: "PDF sur la structure et l'apparence de votre manuscrit" },
    { icon: GraduationCap, text: "Accès à vie — avancez à votre rythme" },
  ],
  /** Ce que l'espace de la formation apporte, une fois inscrit. */
  space: [
    { icon: LineChart, text: "Votre avancement, leçon après leçon" },
    { icon: Video, text: "La reprise là où vous vous êtes arrêté" },
    { icon: BookText, text: "Vos notes personnelles pour chaque leçon" },
  ],
};
