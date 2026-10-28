import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { PageShell } from "@/shop/ui";

/** Réserve une page aux clients connectés (et, avec `admin`, à l'administratrice). */
const RequireAuth = ({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading || (session && admin && !profile)) {
    return (
      <PageShell>
        <p className="font-body text-sm text-muted-foreground">Chargement…</p>
      </PageShell>
    );
  }
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?suite=${next}`} replace />;
  }
  if (admin && !profile?.is_admin) return <Navigate to="/compte" replace />;
  return <>{children}</>;
};

export default RequireAuth;
