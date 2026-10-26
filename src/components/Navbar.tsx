import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hors de l'accueil, il n'y a pas d'image de fond : la barre reste opaque.
  const solid = scrolled || open || !isHome;

  const isActive = (to: string) => to === "/livres" && pathname.startsWith("/livres");

  return (
    <nav
      aria-label="Navigation principale"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid ? "bg-background/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl font-semibold tracking-wide text-foreground">
          MLH.<span className="text-bordeaux">ORION</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive(link.to) ? "page" : undefined}
              className={`font-body text-sm tracking-widest uppercase transition-colors hover:text-foreground ${
                isActive(link.to) ? "text-bordeaux" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground"
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
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
