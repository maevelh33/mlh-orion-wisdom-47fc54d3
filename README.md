# MLH.ORION — site de Maëve Orion

Code source de [mlhorion.com](https://mlhorion.com) : présentation, livres (Chaton, Hybris), Mètis, formation, services et contact.

Fait avec Vite, React, TypeScript, Tailwind CSS et framer-motion.

## Travailler sur le site

Il faut [Node.js](https://nodejs.org) (version 22 ou plus).

```sh
npm install      # une seule fois, installe les dépendances
npm run dev      # aperçu en direct sur http://localhost:8080
npm run build    # construit le site final dans dist/
npm run preview  # affiche le site construit, comme en ligne
npm test         # tests (boutique, paiements, base de données)
npm run typecheck
```

## Mise en ligne

Le site est hébergé sur [Netlify](https://app.netlify.com), relié à ce dépôt GitHub.
Chaque push (ou pull request fusionnée) sur la branche `main` est construit et mis
en ligne automatiquement en 1 à 2 minutes. Le suivi des mises en ligne se trouve dans
l'onglet **Deploys** du site sur Netlify.

- Les réglages de construction sont dans `netlify.toml` (commande `npm run build`,
  dossier publié `dist`).
- Le nom de domaine mlhorion.com se gère dans Netlify (**Domain management**).
- Si une mise en ligne échoue, Netlify garde la version précédente en ligne : le site
  ne tombe pas en panne. Le message d'erreur est dans le détail du déploiement.

## Boutique et espace client

Précommandes (Stripe), comptes clients avec connexion par lien e-mail (Supabase), bibliothèque d'ebooks,
e-mails (Brevo) et administration (`/admin`). Mise en service et gestion au quotidien : **[docs/BOUTIQUE.md](docs/BOUTIQUE.md)**.

## Où modifier quoi

| Je veux changer…                         | Fichier                                           |
| ---------------------------------------- | ------------------------------------------------- |
| Les sections de l'accueil                | `src/components/*Section.tsx`, `*Banner.tsx`      |
| L'ordre des sections                     | `src/pages/Index.tsx`                             |
| Le menu                                  | `src/components/Navbar.tsx`                       |
| Les livres, synopsis, personnages        | `src/pages/BookDetail.tsx` et `src/pages/Livres.tsx` |
| Titres Google, descriptions, aperçus de partage | `src/seo/pages.json`                       |
| Prix, dates de sortie, fichiers d'ebook  | Page **Administration** du site (`/admin`)        |
| Textes légaux (CGV, mentions…)           | `src/pages/Legal.tsx`                             |
| Les images                               | `src/assets/` (pages) et `public/og/` (aperçus de partage) |

### Ajouter une page

1. Créer la page dans `src/pages/` et sa route dans `src/App.tsx`.
2. Ajouter son titre, sa description et son image de partage dans `src/seo/pages.json`.
   Au build, `scripts/seo-pages.mjs` génère alors sa vraie page HTML (pour Google et
   les aperçus Instagram/WhatsApp) et l'ajoute au `sitemap.xml`.

### Images

Les images sont stockées dans le dépôt, en WebP. Pour en convertir une :

```sh
cwebp -q 80 mon-image.png -o src/assets/mon-image.webp
```

Les images de partage (`public/og/`) restent en JPEG, le format que tous les réseaux acceptent.
