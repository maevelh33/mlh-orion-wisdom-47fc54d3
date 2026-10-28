// Variables d'environnement des fonctions, à définir dans Netlify :
// Site configuration > Environment variables (voir docs/BOUTIQUE.md).

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
};

export const siteUrl = () => (process.env.SITE_URL || process.env.URL || "https://mlhorion.com").replace(/\/+$/, "");
