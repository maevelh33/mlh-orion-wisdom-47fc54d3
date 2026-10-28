// Éléments visuels communs aux pages boutique, espace client et administration.
import type { DisplayStatus } from "@/lib/shop";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const toneClass: Record<DisplayStatus["tone"], string> = {
  neutral: "border-border text-muted-foreground bg-background",
  success: "border-vert-antique/40 text-vert-antique bg-vert-antique/5",
  warning: "border-[#c9a44c]/50 text-[#7a5f22] bg-[#c9a44c]/10",
  danger: "border-bordeaux/40 text-bordeaux bg-bordeaux/5",
};

export const StatusBadge = ({ status }: { status: DisplayStatus }) => (
  <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-body text-[10px] tracking-[0.2em] uppercase rounded-sm ${toneClass[status.tone]}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    {status.label}
  </span>
);

export const PageShell = ({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className={`flex-1 w-full mx-auto px-6 pt-28 pb-20 md:pt-36 md:pb-28 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>{children}</main>
    <Footer />
  </div>
);

export const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-4">{children}</p>
);

export const Title = ({ children, as: Tag = "h1" }: { children: React.ReactNode; as?: "h1" | "h2" }) => (
  <>
    <Tag className="font-display text-3xl md:text-5xl font-light text-foreground mb-2">{children}</Tag>
    <div className="w-12 h-px bg-bordeaux mb-10" />
  </>
);

export const PrimaryButton = ({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 font-body text-sm tracking-[0.2em] uppercase px-8 py-3.5 bg-bordeaux text-primary-foreground hover:bg-bordeaux/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
  />
);

export const SecondaryButton = ({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-border text-foreground hover:border-bordeaux hover:text-bordeaux transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  />
);

export const Notice = ({ tone = "neutral", children }: { tone?: DisplayStatus["tone"]; children: React.ReactNode }) => (
  <div className={`border px-5 py-4 rounded-sm font-body text-sm leading-relaxed ${toneClass[tone]}`}>{children}</div>
);

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
