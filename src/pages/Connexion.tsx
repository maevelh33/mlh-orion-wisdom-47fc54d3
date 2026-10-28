import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Eyebrow, Notice, PageShell, PrimaryButton, Title } from "@/shop/ui";

// Seules les adresses internes au site sont acceptées comme destination après connexion.
const safeNext = (value: string | null) => (value && value.startsWith("/") && !value.startsWith("//") ? value : "/compte");

/** Adresse transmise par le lien de l'e-mail d'invitation (/connexion#email=…), jamais envoyée au serveur. */
const emailFromLink = () => {
  const match = window.location.hash.match(/(?:^#|&)email=([^&]+)/);
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
};

const inputClass =
  "w-full px-4 py-3 bg-background border border-border rounded-sm font-body text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-bordeaux transition-colors";

const Connexion = () => {
  const [params] = useSearchParams();
  const next = safeNext(params.get("suite"));
  const { session, loading } = useAuth();

  const [email, setEmail] = useState(emailFromLink);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "sent">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) return <Navigate to={next} replace />;

  if (!supabase) {
    return (
      <PageShell>
        <Eyebrow>Mon espace</Eyebrow>
        <Title>Connexion</Title>
        <Notice>L'espace client ouvre très bientôt.</Notice>
      </PageShell>
    );
  }

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    });
    setBusy(false);
    if (error) {
      setError(error.status === 429 ? "Trop de demandes : patientez une minute avant de réessayer." : "L'envoi a échoué. Vérifiez l'adresse et réessayez.");
      return;
    }
    setStep("sent");
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setError("Ce code est incorrect ou a expiré. Demandez-en un nouveau.");
    // En cas de succès, la session change et la redirection se fait d'elle-même.
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto">
        <Eyebrow>Mon espace</Eyebrow>
        <Title>Connexion</Title>

        {step === "email" ? (
          <form onSubmit={sendLink} className="space-y-6">
            <p className="font-body text-base leading-relaxed text-muted-foreground">
              Saisissez votre adresse e-mail : vous recevrez un lien de connexion, sans mot de passe. Si vous avez déjà commandé,
              utilisez l'adresse donnée au paiement pour retrouver vos achats.
            </p>
            <label className="block">
              <span className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Adresse e-mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className={inputClass}
              />
            </label>
            {error && <Notice tone="danger">{error}</Notice>}
            <PrimaryButton type="submit" disabled={busy} className="w-full">
              <Mail className="w-4 h-4" />
              {busy ? "Envoi…" : "Recevoir mon lien"}
            </PrimaryButton>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-6">
            <Notice tone="success">
              Un e-mail vient de partir vers <strong>{email}</strong>. Cliquez sur le lien qu'il contient pour vous connecter.
            </Notice>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              Vous lisez vos e-mails sur un autre appareil ? Saisissez ici le code à 6 chiffres indiqué dans l'e-mail.
            </p>
            <label className="block">
              <span className="block font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Code</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={`${inputClass} tracking-[0.5em] text-center font-display text-2xl`}
              />
            </label>
            {error && <Notice tone="danger">{error}</Notice>}
            <PrimaryButton type="submit" disabled={busy || code.length !== 6} className="w-full">
              {busy ? "Vérification…" : "Me connecter"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="block mx-auto font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-bordeaux"
            >
              Changer d'adresse ou renvoyer
            </button>
          </form>
        )}
      </div>
    </PageShell>
  );
};

export default Connexion;
