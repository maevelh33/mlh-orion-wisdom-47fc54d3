import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, User, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { shopConfigured } from "@/lib/supabase";

// Les ancres passent par "/" pour fonctionner aussi depuis les pages Livres.
const navLinks = [
  { label: "Accueil", to: "/#accueil" },
  { label: "Présentation", to: "/#presentation" },
  { label: "Livres", to: "/livres" },
  { label: "YouTube", to: "/#youtube" },
  { label: "Formation", to: "/#formation" },
  { label: "Services", to: "/#services" },
  { label: "Contact", to: "/#contact" },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const accountActive = pathname.startsWith("/compte") || pathname === "/connexion" || pathname === "/admin";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hors de l'accueil, il n'y a pas d'image de fond : la barre reste opaque.
  const solid = scrolled || open || !isHome;

  const isActive = (to: string) => to === "/livres" && pathname.startsWith("/livres");

  // Sur la photo sombre de l'accueil, le texte passe en clair pour rester lisible.
  const linkColor = (to: string) =>
    isActive(to)
      ? "text-bordeaux"
      : solid
        ? "text-muted-foreground hover:text-foreground"
        : "text-primary-foreground/85 hover:text-primary-foreground";

  return (
    <nav
      aria-label="Navigation principale"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid ? "bg-background/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className={`font-display text-2xl font-semibold tracking-wide transition-colors ${
            solid ? "text-foreground" : "text-primary-foreground"
          }`}
        >
          MLH.<span className={solid ? "text-bordeaux" : "text-primary-foreground/70"}>ORION</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive(link.to) ? "page" : undefined}
              className={`font-body text-sm tracking-widest uppercase transition-colors ${linkColor(link.to)}`}
            >
              {link.label}
            </Link>
          ))}
          {shopConfigured && (
            <Link
              to="/compte"
              aria-label={session ? "Mon espace" : "Se connecter à mon espace"}
              aria-current={accountActive ? "page" : undefined}
              className={`inline-flex items-center gap-2 font-body text-sm tracking-widest uppercase transition-colors ${
                accountActive ? "text-bordeaux" : linkColor("/compte")
              }`}
            >
              <User size={16} />
              Espace
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden transition-colors ${solid ? "text-foreground" : "text-primary-foreground"}`}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          id="menu-mobile"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background/98 backdrop-blur-sm border-t border-border px-6 py-6 space-y-4"
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              aria-current={isActive(link.to) ? "page" : undefined}
              className={`block font-body text-sm tracking-widest uppercase hover:text-foreground ${
                isActive(link.to) ? "text-bordeaux" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {shopConfigured && (
            <Link
              to="/compte"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 pt-4 border-t border-border font-body text-sm tracking-widest uppercase hover:text-foreground ${
                accountActive ? "text-bordeaux" : "text-muted-foreground"
              }`}
            >
              <User size={16} />
              {session ? "Mon espace" : "Se connecter"}
            </Link>
          )}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
