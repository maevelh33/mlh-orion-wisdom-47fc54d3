// Après `vite build` : crée une vraie page HTML par route (titre, description,
// aperçu de partage et données structurées propres à chaque page) et le sitemap.
// Sans ça, l'hébergeur renvoie une erreur 404 sur /livres et /livres/hybris,
// et les aperçus Instagram/WhatsApp affichent tous ceux de l'accueil.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const { site, pages } = JSON.parse(readFileSync(join(root, "src/seo/pages.json"), "utf8"));
const template = readFileSync(join(dist, "index.html"), "utf8");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Netlify sert /livres/index.html à l'adresse /livres/ (avec la barre finale).
const pageUrl = (path) => `${site.url}${path}${path.endsWith("/") ? "" : "/"}`;

const person = {
  "@type": "Person",
  "@id": `${site.url}/#maeve-orion`,
  name: site.author,
  alternateName: site.name,
  url: `${site.url}/`,
  jobTitle: "Autrice, philosophe et créatrice de contenu",
  sameAs: site.sameAs,
};

const structuredData = (path, page) => {
  const url = pageUrl(path);
  if (page.book) {
    return {
      "@context": "https://schema.org",
      "@type": "Book",
      name: page.book.name,
      url,
      image: `${site.url}${page.image}`,
      description: page.description,
      inLanguage: "fr",
      author: person,
      ...(page.book.url ? { offers: { "@type": "Offer", url: page.book.url } } : {}),
    };
  }
  if (path === "/") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        person,
        { "@type": "WebSite", name: site.name, url: `${site.url}/`, inLanguage: "fr", publisher: { "@id": person["@id"] } },
      ],
    };
  }
  return { "@context": "https://schema.org", "@type": "CollectionPage", name: page.title, url, inLanguage: "fr", author: person };
};

const head = (path, page) => {
  const url = pageUrl(path);
  const image = `${site.url}${page.image}`;
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${page.book ? "book" : "website"}" />`,
    `<meta property="og:site_name" content="${site.name}" />`,
    `<meta property="og:locale" content="${site.locale}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:alt" content="${esc(page.imageAlt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify(structuredData(path, page))}</script>`,
  ].join("\n    ");
};

const SEO_BLOCK = /<!-- seo -->[\s\S]*?<!-- \/seo -->/;
if (!SEO_BLOCK.test(template)) throw new Error("Bloc <!-- seo --> introuvable dans dist/index.html");

for (const [path, page] of Object.entries(pages)) {
  const html = template.replace(SEO_BLOCK, `<!-- seo -->\n    ${head(path, page)}\n    <!-- /seo -->`);
  const dir = join(dist, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(pages)
  .map((path) => `  <url><loc>${pageUrl(path)}</loc><lastmod>${today}</lastmod></url>`)
  .join("\n")}
</urlset>
`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);

console.log(`SEO : ${Object.keys(pages).length} pages et sitemap.xml générés.`);
