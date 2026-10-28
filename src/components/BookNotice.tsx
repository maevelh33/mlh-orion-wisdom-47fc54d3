import { Loader2 } from "lucide-react";

/** Mention d'avancement d'un livre (ex. « Réédition en cours »), avec un petit indicateur animé. */
const BookNotice = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p
    role="status"
    className={`inline-flex items-center gap-2.5 px-4 py-2 border border-bordeaux/30 bg-bordeaux/5 rounded-sm font-body text-xs tracking-[0.2em] uppercase text-bordeaux ${className}`}
  >
    {/* Ne tourne pas si l'appareil demande de réduire les animations */}
    <Loader2 className="w-4 h-4 motion-safe:animate-spin" aria-hidden />
    {children}
  </p>
);

export default BookNotice;
