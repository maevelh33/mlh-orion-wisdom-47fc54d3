# Boutique et espace client — mise en service

La boutique repose sur quatre services. Le code est prêt ; il reste à créer les comptes et à les relier.

| Service      | Rôle                                                                 | Coût de départ |
| ------------ | -------------------------------------------------------------------- | -------------- |
| **Supabase** | Comptes clients (connexion par lien e-mail), commandes, fichiers des ebooks | Gratuit        |
| **Stripe**   | Paiement                                                             | Commission par vente |
| **Brevo**    | E-mails (confirmation, sortie du livre, connexion)                   | Gratuit jusqu'à 300 e-mails/jour |
| **Netlify**  | Site et petites fonctions serveur (`netlify/functions`)              | Gratuit        |

Comptez environ une heure. Faites les étapes dans l'ordre et **notez chaque clé dans un endroit sûr** (gestionnaire de mots de passe) : ne les envoyez jamais par e-mail ou message.

---

## 1. Supabase (base de données et comptes)

1. Créez un compte sur [supabase.com](https://supabase.com), puis **New project**.
   - Nom : `mlhorion` · Région : **Europe (Paris ou Frankfurt)**, pour le RGPD.
   - Notez le mot de passe de la base (il ne vous resservira presque jamais).
2. **Créer les tables** : menu **SQL Editor** → **New query** → collez tout le contenu de
   `supabase/migrations/20261028000000_boutique.sql` → **Run**. Le message doit être « Success ».
3. **Récupérer les clés** : **Project Settings** → **API** (ou **API Keys**). Notez :
   - **Project URL** (ex. `https://abcd.supabase.co`)
   - la clé **anon / public**
   - la clé **service_role / secret** — très sensible : elle donne accès à tout.
4. **Adresses du site** : **Authentication** → **URL Configuration**
   - Site URL : `https://mlhorion.com`
   - Redirect URLs : ajoutez `https://mlhorion.com/**` et `https://*--mlhorion.netlify.app/**`
     (la seconde sert aux aperçus Netlify ; remplacez `mlhorion` par le nom de votre site Netlify).
5. **E-mail de connexion en français** : **Authentication** → **Emails** → **Templates**
   - « Magic Link » : sujet `Votre lien de connexion`, puis collez le contenu de `supabase/templates/magic-link.html`.
   - « Confirm signup » : même sujet, même contenu (c'est ce que reçoit un tout nouveau client).
6. L'étape SMTP se fait à la fin de l'étape 2 (Brevo).

## 2. Brevo (envoi des e-mails)

1. Créez un compte sur [brevo.com](https://www.brevo.com).
2. **Authentifier votre domaine** : **Paramètres** → **Expéditeurs, domaines et IP** → **Domaines** → ajoutez `mlhorion.com`.
   Brevo affiche 3 ou 4 enregistrements DNS à ajouter là où se gère votre nom de domaine (chez votre registraire,
   ou dans Netlify : **Domains** → `mlhorion.com` → **DNS settings**). Sans cette étape, vos e-mails risquent d'arriver en spam.
3. **Expéditeur** : ajoutez par exemple `contact@mlhorion.com`, nom « Maëve Orion ».
4. **Clé API** : **Paramètres** → **SMTP et API** → onglet **Clés API** → **Générer**. Notez-la.
5. **Clé SMTP** : même page, onglet **SMTP** → notez le serveur (`smtp-relay.brevo.com`, port `587`), l'identifiant, et générez une clé SMTP.
6. Retour dans **Supabase** → **Authentication** → **Emails** → **SMTP Settings** → activez **Custom SMTP** :
   - Sender email : `contact@mlhorion.com` · Sender name : `Maëve Orion`
   - Host : `smtp-relay.brevo.com` · Port : `587` · Username et Password : ceux de l'étape 5
   Sans cela, Supabase n'envoie que quelques e-mails de connexion par heure.
7. Toujours dans Supabase : **Authentication** → **Rate Limits** → montez « emails sent per hour » à 100 environ.

## 3. Stripe (paiement)

Commencez en **mode test** (interrupteur « Mode test » en haut du tableau de bord) : aucun vrai paiement.

1. **Clé secrète** : **Développeurs** → **Clés API** → notez la **clé secrète** (`sk_test_…`).
2. **Webhook** : **Développeurs** → **Webhooks** → **Ajouter une destination**
   - Adresse : `https://mlhorion.com/api/stripe-webhook` (pour tester sur un aperçu Netlify, utilisez l'adresse de l'aperçu)
   - Événements à cocher :
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `charge.refunded`
   - Notez le **secret de signature** (`whsec_…`).
3. **Apparence** : **Paramètres** → **Image de marque** : logo, couleur `#6f2934` (le bordeaux du site).
4. **Reçus** : **Paramètres** → **E-mails clients** → activez « Paiements réussis » et « Remboursements » si vous voulez que Stripe envoie aussi ses reçus.

Plus tard, pour encaisser réellement : refaites les étapes 1 et 2 en **mode production** (clé `sk_live_…`, nouveau webhook, nouveau `whsec_…`).

## 4. Netlify (relier le tout)

**Site configuration** → **Environment variables** → **Add a variable**, une par ligne :

| Nom                          | Valeur                                   | Secret ? |
| ---------------------------- | ---------------------------------------- | -------- |
| `VITE_SUPABASE_URL`          | Project URL de Supabase                  | non      |
| `VITE_SUPABASE_ANON_KEY`     | clé anon / public de Supabase            | non      |
| `SUPABASE_URL`               | Project URL de Supabase (la même)        | non      |
| `SUPABASE_SERVICE_ROLE_KEY`  | clé service_role de Supabase             | **oui**  |
| `STRIPE_SECRET_KEY`          | `sk_test_…` (puis `sk_live_…`)           | **oui**  |
| `STRIPE_WEBHOOK_SECRET`      | `whsec_…`                                | **oui**  |
| `BREVO_API_KEY`              | clé API Brevo                            | **oui**  |
| `MAIL_FROM_EMAIL`            | `contact@mlhorion.com`                   | non      |
| `MAIL_FROM_NAME`             | `Maëve Orion`                            | non      |
| `MAIL_REPLY_TO`              | l'adresse où vous voulez recevoir les réponses | non |
| `SITE_URL`                   | `https://mlhorion.com`                   | non      |

Astuce : Netlify permet des valeurs différentes selon le contexte (« Production » / « Deploy Previews »).
Mettez les clés Stripe **de test** pour les aperçus et les clés **de production** pour « Production » :
vous pourrez tester sans risque sur chaque aperçu.

Après avoir ajouté les variables : **Deploys** → **Trigger deploy** → **Clear cache and deploy site**
(les variables `VITE_…` ne sont prises en compte qu'au moment de la construction).

## 5. Devenir administratrice

1. Sur le site, cliquez sur **Espace** et connectez-vous avec votre adresse e-mail.
2. Dans Supabase → **SQL Editor**, exécutez (avec votre adresse) :
   ```sql
   update public.profiles set is_admin = true where email = 'votre@adresse.fr';
   ```
3. Rechargez le site : un bouton **Administration** apparaît dans **Mon espace** (adresse directe : `/admin`).

## 6. Premiers réglages dans l'administration

- Onglet **Livres** : vérifiez les prix, saisissez les **frais de port** France et Europe (vide = zone fermée), enregistrez.
- Onglet **Outils** → **Tester les e-mails** : vous devez recevoir un e-mail d'essai.

## 7. Tester une commande (mode test Stripe)

1. Sur `/livres/hybris/precommander`, précommandez l'ebook avec une adresse e-mail à vous.
2. Carte de test : `4242 4242 4242 4242`, date future, n'importe quel code.
3. Vérifiez : retour sur « Mon espace » avec la commande, e-mail de confirmation reçu, commande visible dans **Administration**.
4. Testez un échec avec la carte `4000 0000 0000 0002`, et un remboursement depuis Stripe (**Paiements** → le paiement → **Rembourser**) :
   le statut passe à « Remboursé » et un e-mail part.
5. Supprimez ensuite les commandes de test : SQL Editor → `delete from public.orders where stripe_session_id like 'cs_test_%';`

## 8. Ouvrir la boutique

1. Complétez les passages **[À COMPLÉTER]** des pages légales (`src/pages/Legal.tsx`) : statut, SIRET, adresse, TVA,
   délais de livraison et **médiateur de la consommation** (obligatoire pour vendre à des particuliers).
2. Passez Stripe en production (étape 3) et mettez à jour `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` dans Netlify.
3. **Importez les anciennes précommandes** : Administration → **Outils** → **Importer** (le lien `buy.stripe.com/…` actuel est déjà rempli).
   Vérifiez le format de chaque commande importée dans l'onglet **Commandes**.
4. Désactivez l'ancien lien de paiement dans Stripe (**Liens de paiement** → … → **Désactiver**), pour que tout passe par la boutique.

---

## Au quotidien

- **Expédier un livre papier** : Administration → **Commandes** → filtre « À expédier » → bouton **CSV** pour les étiquettes →
  ouvrez chaque commande → **Marquer expédié** (le client voit « Expédié »).
- **Rembourser** : depuis Stripe uniquement. La boutique met le statut à jour et prévient le client toute seule.
- **Sortie de l'ebook** : Administration → **Livres** → déposez le fichier (PDF pour la lecture en ligne, ou ePub) →
  passez l'ebook en **Disponible** → **Enregistrer** → **Envoyer l'e-mail de disponibilité**.
  Chaque acheteur reçoit un e-mail et une notification dans son espace, une seule fois.
- **Changer la date de sortie** : Administration → **Livres** → « Sortie (texte affiché) ». Elle se met à jour partout.

## Comment ça marche (pour une personne qui reprendrait le code)

- `src/lib/shop.ts` : types et règles partagés (statuts affichés, prix, zones de livraison).
- `netlify/functions/checkout.ts` : crée la session Stripe Checkout (prix lus en base, jamais envoyés par le navigateur).
- `netlify/functions/stripe-webhook.ts` + `netlify/lib/orders.ts` : enregistre paiements, échecs et remboursements ; idempotent.
- `netlify/functions/admin.ts` + `netlify/lib/admin.ts` : e-mail de disponibilité par lots, import Stripe, e-mail d'essai.
- `supabase/migrations/` : tables et règles d'accès (RLS) ; un client ne voit que ses commandes et ne peut ouvrir
  le fichier d'un ebook que s'il l'a payé et qu'il est disponible.
- Tests : `npm test` (base de données simulée avec PGlite, webhooks Stripe signés, e-mails).
