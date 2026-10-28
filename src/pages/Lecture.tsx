import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { displayStatus, grantsEbook } from "@/lib/shop";
import { useMyOrders, useProduct } from "@/shop/useShop";
import { Notice, PageShell } from "@/shop/ui";

/** Durée de validité des liens vers le fichier : une heure, puis il faut recharger la page. */
const LINK_SECONDS = 60 * 60;

const Lecture = () => {
  const { slug = "" } = useParams();
  const { session } = useAuth();
  const { product, isLoading: productLoading } = useProduct(slug);
  const orders = useMyOrders(session?.user.id);
  const [urls, setUrls] = useState<{ read: string; download: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const owned = orders.data?.find((o) => o.product_id === slug && grantsEbook(o));
  const available = product?.ebook_status === "available";
  const path = product?.ebook_file_path;
  const isPdf = path?.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!supabase || !owned || !available || !path) return;
    const bucket = supabase.storage.from("ebooks");
    const fileName = `${product!.title}${path.slice(path.lastIndexOf("."))}`;
    Promise.all([bucket.createSignedUrl(path, LINK_SECONDS), bucket.createSignedUrl(path, LINK_SECONDS, { download: fileName })]).then(
      ([read, download]) => {
        if (read.error || download.error) setError("Le fichier est momentanément inaccessible. Réessayez dans un instant.");
        else setUrls({ read: read.data.signedUrl, download: download.data.signedUrl });
      },
    );
  }, [owned, available, path, product]);

  const back = (
    <Link to="/compte" className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft className="w-4 h-4" /> Ma bibliothèque
    </Link>
  );

  if (productLoading || orders.isLoading) {
    return (
      <PageShell>
        <p className="font-body text-sm text-muted-foreground">Chargement…</p>
      </PageShell>
    );
  }

  if (!product || !owned || !available || !path) {
    const message = !owned
      ? "Ce livre ne fait pas partie de votre bibliothèque."
      : !available
        ? `${product?.title} sera disponible ${product?.release_label?.toLowerCase() || "bientôt"}. Un e-mail vous préviendra le jour de sa sortie.`
        : "Le fichier sera en ligne d'ici quelques instants. Merci de votre patience.";
    return (
      <PageShell>
        <div className="mb-10">{back}</div>
        <Notice>{message}</Notice>
        {owned && (
          <p className="mt-4 font-body text-sm text-muted-foreground">
            Statut de votre achat : {displayStatus(owned, product).label.toLowerCase()}.
          </p>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        {back}
        {urls && (
          <a
            href={urls.download}
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase px-5 py-2.5 border border-bordeaux text-bordeaux hover:bg-bordeaux hover:text-primary-foreground transition-colors"
          >
            <Download className="w-4 h-4" /> Télécharger
          </a>
        )}
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8">{product.title}</h1>

      {error && <Notice tone="danger">{error}</Notice>}
      {!urls && !error && <p className="font-body text-sm text-muted-foreground">Ouverture du livre…</p>}
      {urls &&
        (isPdf ? (
          <iframe
            src={urls.read}
            title={`Lire ${product.title}`}
            className="w-full h-[80vh] min-h-[520px] bg-cream border border-border rounded-sm shadow-lg"
          />
        ) : (
          <Notice>
            Ce livre est au format ePub : téléchargez-le, puis ouvrez-le avec Livres (iPhone, iPad, Mac), Google Play Livres ou votre
            liseuse.
          </Notice>
        ))}
      <p className="mt-4 font-body text-xs text-muted-foreground">
        Ce livre vous est personnellement destiné. Merci de ne pas le partager : c'est ce qui me permet de continuer à écrire.
      </p>
    </PageShell>
  );
};

export default Lecture;
