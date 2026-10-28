import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Notice, SecondaryButton } from "@/shop/ui";

export const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  "w-full px-4 py-2.5 bg-background border border-border rounded-sm font-body text-sm focus:outline-none focus:border-bordeaux";

/** Messages clairs pour les refus de Supabase (codes d'erreur de l'API Auth). */
const explain = (code: string | undefined, message: string) => {
  switch (code) {
    case "same_password":
      return "C'est déjà votre mot de passe actuel.";
    case "weak_password":
      return "Ce mot de passe est trop simple : mélangez lettres, chiffres et signes.";
    case "reauthentication_needed":
    case "reauthentication_not_valid":
      return "Par sécurité, reconnectez-vous avec un lien e-mail, puis recommencez.";
    default:
      return `Le mot de passe n'a pas pu être enregistré (${message}).`;
  }
};

/**
 * Mot de passe facultatif : le client peut en créer un (ou le changer) pour se
 * connecter sans attendre d'e-mail. Le lien par e-mail reste toujours possible.
 */
const PasswordForm = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (password.length < MIN_PASSWORD_LENGTH)
      return setResult({ tone: "danger", text: `Choisissez au moins ${MIN_PASSWORD_LENGTH} caractères.` });
    if (password !== confirm) return setResult({ tone: "danger", text: "Les deux mots de passe ne sont pas identiques." });
    setBusy(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (error) return setResult({ tone: "danger", text: explain(error.code, error.message) });
    setPassword("");
    setConfirm("");
    setResult({ tone: "success", text: "Mot de passe enregistré. Vous pourrez l'utiliser à votre prochaine connexion." });
  };

  return (
    <form onSubmit={save} className="max-w-xl mb-8">
      <p className="flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
        <KeyRound className="w-4 h-4" /> Mot de passe (facultatif)
      </p>
      <p className="font-body text-sm text-muted-foreground mb-4">
        Pour vous connecter directement, sans attendre d'e-mail. Le lien par e-mail reste toujours disponible, même si vous oubliez votre mot de
        passe.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <label className="block relative">
          <span className="sr-only">Nouveau mot de passe</span>
          <input
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </label>
        <label className="block">
          <span className="sr-only">Confirmer le mot de passe</span>
          <input
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirmer"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-4">Au moins {MIN_PASSWORD_LENGTH} caractères.</p>
      {result && (
        <div className="mb-4">
          <Notice tone={result.tone}>{result.text}</Notice>
        </div>
      )}
      <SecondaryButton type="submit" disabled={busy || !password}>
        {busy ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </SecondaryButton>
    </form>
  );
};

export default PasswordForm;
