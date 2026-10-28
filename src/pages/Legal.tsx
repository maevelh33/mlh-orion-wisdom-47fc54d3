// Mentions légales, conditions générales de vente et politique de confidentialité.
// Les passages entre crochets [À COMPLÉTER : …] sont à remplir avant l'ouverture de la boutique.
import { useLocation } from "react-router-dom";
import { Eyebrow, PageShell, Title } from "@/shop/ui";

const ToFill = ({ children }: { children: React.ReactNode }) => (
  <mark className="bg-bordeaux/10 text-bordeaux px-1 rounded-sm">[À COMPLÉTER : {children}]</mark>
);

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-2xl text-foreground mt-12 mb-4">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="font-body text-base leading-[1.9] text-muted-foreground mb-4">{children}</p>;
const Ul = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc pl-6 mb-4 space-y-1 font-body text-base leading-[1.8] text-muted-foreground">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

const CONTACT = "maevemlh@gmail.com";

const Mentions = () => (
  <>
    <H>Éditrice du site</H>
    <P>
      Maëve Orion — <ToFill>nom légal, statut (ex. micro-entreprise), numéro SIRET</ToFill>
      <br />
      Adresse : <ToFill>adresse postale ou de domiciliation</ToFill>
      <br />
      Contact : {CONTACT}
      <br />
      Directrice de la publication : Maëve Orion
    </P>
    <H>Hébergement</H>
    <P>
      Site hébergé par Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis. Données de la boutique hébergées par
      Supabase, Inc. (serveurs en Union européenne).
    </P>
    <H>Propriété intellectuelle</H>
    <P>
      Les textes, images, couvertures et extraits présents sur ce site sont la propriété de Maëve Orion. Toute reproduction sans autorisation est
      interdite. Les ebooks vendus sont destinés à l'usage personnel de l'acheteur et ne peuvent être partagés ni revendus.
    </P>
  </>
);

const Cgv = () => (
  <>
    <P>
      Les présentes conditions s'appliquent aux ventes de livres (papier et numériques) réalisées sur mlhorion.com par Maëve Orion (voir les
      mentions légales), à des acheteurs consommateurs.
    </P>
    <H>1. Produits et précommandes</H>
    <P>
      Les livres sont proposés en livre papier et en ebook (PDF ou ePub). Un livre en précommande n'est pas encore paru : la date de sortie
      affichée est indicative. La précommande est payée au moment de la commande. L'ebook devient accessible dans l'espace client le jour de sa
      sortie ; le livre papier est expédié à partir de sa sortie.
    </P>
    <P>
      Si la sortie est repoussée de plus de 6 mois après la date annoncée lors de la commande, ou si le livre ne paraît pas, l'acheteur peut
      demander l'annulation et le remboursement intégral de sa précommande en écrivant à {CONTACT}. Le remboursement intervient dans les 14
      jours suivant la demande. Tout changement de date de sortie est indiqué sur la page du livre et dans l'espace client.
    </P>
    <H>2. Prix et paiement</H>
    <P>
      Les prix sont indiqués en euros, toutes taxes comprises <ToFill>ou « TVA non applicable, art. 293 B du CGI » si vous êtes en franchise de TVA</ToFill>.
      Les frais de port du livre papier sont indiqués avant le paiement et ajoutés au total. Le paiement s'effectue en ligne par l'intermédiaire de
      Stripe, de façon sécurisée ; aucune donnée bancaire n'est conservée par le site. La commande est confirmée par e-mail une fois le paiement
      accepté.
    </P>
    <H>3. Livraison du livre papier</H>
    <P>
      Le livre papier est expédié à l'adresse indiquée lors du paiement, en France ou dans l'Union européenne selon les zones ouvertes, au plus
      tard 30 jours après la sortie du livre (ou après la commande, si le livre est déjà paru). Délai indicatif d'acheminement après
      expédition : 3 à 7 jours ouvrés en France métropolitaine, 5 à 12 jours ouvrés vers les autres pays de l'Union européenne. Le statut
      « Expédié » apparaît alors dans l'espace client.
    </P>
    <H>4. Accès à l'ebook</H>
    <P>
      L'ebook est accessible dans l'espace client, en se connectant avec l'adresse e-mail utilisée lors de l'achat : lecture en ligne et/ou
      téléchargement. Il est réservé à un usage strictement personnel.
    </P>
    <H>5. Droit de rétractation</H>
    <Ul
      items={[
        "Livre papier : vous disposez de 14 jours à compter de la réception du livre pour vous rétracter, sans avoir à vous justifier. Le livre doit être retourné en bon état ; les frais de retour sont à votre charge. Le remboursement intervient dans les 14 jours suivant la réception du retour.",
        "Ebook (contenu numérique) : vous pouvez annuler votre précommande à tout moment avant la sortie. En commandant, vous demandez expressément à accéder à l'ebook dès sa sortie et reconnaissez perdre votre droit de rétractation à partir du moment où il est mis à votre disposition (article L221-28 du Code de la consommation).",
        `Pour exercer ce droit, écrivez à ${CONTACT} en indiquant votre commande.`,
      ]}
    />
    <H>6. Remboursements</H>
    <P>
      Les remboursements sont effectués sur le moyen de paiement utilisé, via Stripe. Un ebook remboursé n'est plus accessible dans l'espace
      client.
    </P>
    <H>7. Réclamations et médiation</H>
    <P>
      Pour toute question ou réclamation : {CONTACT}. En cas de litige non résolu, vous pouvez recourir gratuitement au médiateur de la
      consommation : <ToFill>nom et site du médiateur auquel vous adhérez (obligatoire pour vendre à des particuliers)</ToFill>. Vous pouvez
      aussi utiliser la plateforme européenne de règlement des litiges en ligne.
    </P>
    <H>8. Droit applicable</H>
    <P>Les présentes conditions sont soumises au droit français.</P>
  </>
);

const Confidentialite = () => (
  <>
    <P>Cette page explique quelles données sont collectées lors d'un achat ou de la création d'un espace client, et pourquoi.</P>
    <H>Données collectées</H>
    <Ul
      items={[
        "Adresse e-mail : pour vous connecter à votre espace, vous envoyer la confirmation de commande et vous prévenir de la sortie de vos livres.",
        "Nom et adresse postale (livre papier) : pour l'expédition et la facturation.",
        "Prénom pour la dédicace, si vous en indiquez un.",
        "Historique de commandes : pour afficher vos achats et leur statut.",
      ]}
    />
    <P>Vos données bancaires sont saisies directement chez Stripe et ne transitent jamais par ce site.</P>
    <H>Prestataires</H>
    <Ul
      items={[
        "Stripe (paiement)",
        "Supabase (comptes clients et commandes, serveurs dans l'Union européenne)",
        "Brevo (envoi des e-mails, France)",
        "Netlify (hébergement du site)",
      ]}
    />
    <H>Durée de conservation</H>
    <P>
      Les données de commande sont conservées 10 ans, durée imposée pour les pièces comptables. Le compte client est conservé tant qu'il est
      utilisé, et supprimé sur simple demande.
    </P>
    <H>Vos droits</H>
    <P>
      Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à {CONTACT}. Vous pouvez aussi saisir la CNIL
      (cnil.fr). Le site n'utilise pas de cookies publicitaires ; seul un stockage technique garde votre connexion à l'espace client.
    </P>
  </>
);

const pages: Record<string, { title: string; Body: () => JSX.Element }> = {
  "/mentions-legales": { title: "Mentions légales", Body: Mentions },
  "/cgv": { title: "Conditions générales de vente", Body: Cgv },
  "/confidentialite": { title: "Politique de confidentialité", Body: Confidentialite },
};

const Legal = () => {
  const { pathname } = useLocation();
  const page = pages[pathname.replace(/\/+$/, "")] ?? pages["/mentions-legales"];
  return (
    <PageShell>
      <div className="max-w-3xl">
        <Eyebrow>Informations</Eyebrow>
        <Title>{page.title}</Title>
        <page.Body />
      </div>
    </PageShell>
  );
};

export default Legal;
