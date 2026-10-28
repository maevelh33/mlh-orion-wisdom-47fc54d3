// Variables d'environnement des fonctions, à définir dans Netlify :
// Site configuration > Environment variables (voir docs/BOUTIQUE.md).

/** Erreur de réglage du serveur : son message ne contient que des noms, jamais de clé. */
export class ConfigError extends Error {}

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new ConfigError(`variable ${name} manquante dans Netlify`);
  return value;
};

/**
 * Explique une panne due aux réglages (variable absente, clé refusée), pour qu'elle
 * se corrige sans fouiller les journaux. Renvoie null pour les autres erreurs.
 */
export const describeConfigError = (error: unknown): string | null => {
  if (error instanceof ConfigError) return error.message;
  const e = error as { type?: string; message?: string } | null;
  if (e?.type === "StripeAuthenticationError") return "clé Stripe refusée (STRIPE_SECRET_KEY)";
  if (e?.type === "StripePermissionError") return "clé Stripe sans les droits nécessaires (STRIPE_SECRET_KEY)";
  // Refus de Stripe lié au compte ou à la demande (ex. nom d'entreprise manquant) : message sans secret.
  if (e?.type === "StripeInvalidRequestError") return `Stripe refuse la demande : ${e.message}`;
  // Erreur générique (souvent à la création des clients : adresse ou clé mal formée).
  // Leurs messages sont des phrases fixes, sans la valeur des clés.
  if (error instanceof Error && error.name === "Error" && error.message) return error.message.slice(0, 200);
  return null;
};

export const siteUrl = () => (process.env.SITE_URL || process.env.URL || "https://mlhorion.com").replace(/\/+$/, "");
