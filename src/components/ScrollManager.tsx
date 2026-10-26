import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Remonte en haut à chaque changement de page, ou descend jusqu'à la section
 * visée quand l'adresse contient une ancre (ex. /#contact depuis la page Livres).
 */
const ScrollManager = () => {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    // La page vient peut-être d'être affichée : on attend qu'elle soit dans le DOM.
    const id = window.setTimeout(() => {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [pathname, hash, key]);

  return null;
};

export default ScrollManager;
