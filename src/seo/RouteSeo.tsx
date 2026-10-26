import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import seo from "./pages.json";

type PageSeo = { title: string; description: string };
const pages: Record<string, PageSeo> = seo.pages;

const setMeta = (selector: string, attr: string, value: string) => {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

/**
 * Met à jour le titre, la description et l'URL canonique lors de la
 * navigation dans le site. Le HTML initial de chaque page est déjà généré
 * au build par scripts/seo-pages.mjs ; ceci garde les deux synchronisés.
 */
const RouteSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
    const page = pages[path];
    if (!page) {
      document.title = `Page introuvable | ${seo.site.name}`;
      return;
    }
    document.title = page.title;
    setMeta('meta[name="description"]', "content", page.description);
    setMeta('link[rel="canonical"]', "href", `${seo.site.url}${path}${path.endsWith("/") ? "" : "/"}`);
  }, [pathname]);

  return null;
};

export default RouteSeo;
