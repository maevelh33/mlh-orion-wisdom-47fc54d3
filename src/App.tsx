import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import ScrollManager from "@/components/ScrollManager";
import RouteSeo from "@/seo/RouteSeo";
import { AuthProvider } from "@/auth/AuthProvider";
import RequireAuth from "@/auth/RequireAuth";
import Index from "./pages/Index";
import Livres from "./pages/Livres";
import BookDetail from "./pages/BookDetail";
import NotFound from "./pages/NotFound";

// Pages boutique chargées à la demande : l'accueil reste aussi léger qu'avant.
const Precommande = lazy(() => import("./pages/Precommande"));
const Connexion = lazy(() => import("./pages/Connexion"));
const Compte = lazy(() => import("./pages/Compte"));
const Lecture = lazy(() => import("./pages/Lecture"));
const Admin = lazy(() => import("./pages/Admin"));
const Legal = lazy(() => import("./pages/Legal"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Respecte le réglage « réduire les animations » du téléphone ou de l'ordinateur */}
      <MotionConfig reducedMotion="user">
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ScrollManager />
            <RouteSeo />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/livres" element={<Livres />} />
                <Route path="/livres/:slug" element={<BookDetail />} />
                <Route path="/livres/:slug/precommander" element={<Precommande />} />
                <Route path="/connexion" element={<Connexion />} />
                <Route
                  path="/compte"
                  element={
                    <RequireAuth>
                      <Compte />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/compte/lire/:slug"
                  element={
                    <RequireAuth>
                      <Lecture />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth admin>
                      <Admin />
                    </RequireAuth>
                  }
                />
                <Route path="/mentions-legales" element={<Legal />} />
                <Route path="/cgv" element={<Legal />} />
                <Route path="/confidentialite" element={<Legal />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </MotionConfig>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
