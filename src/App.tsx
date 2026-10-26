import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import ScrollManager from "@/components/ScrollManager";
import RouteSeo from "@/seo/RouteSeo";
import Index from "./pages/Index";
import Livres from "./pages/Livres";
import BookDetail from "./pages/BookDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Respecte le réglage « réduire les animations » du téléphone ou de l'ordinateur */}
      <MotionConfig reducedMotion="user">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollManager />
          <RouteSeo />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/livres" element={<Livres />} />
            <Route path="/livres/:slug" element={<BookDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </MotionConfig>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
