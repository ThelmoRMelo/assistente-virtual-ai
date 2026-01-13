import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import Index from "./pages/Index";
import Training from "./pages/Training";
import Products from "./pages/Products";
import Simulate from "./pages/Simulate";
import Business from "./pages/Business";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import Vitrine from "./pages/Vitrine";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            {/* Home principal do app (sem autenticação) */}
            <Route path="/" element={<Index />} />
            <Route path="/treinar" element={<Training />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/simular" element={<Simulate />} />
            <Route path="/negocio" element={<Business />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="/conversas" element={<Conversations />} />
            <Route path="/conversas/:id" element={<ConversationDetail />} />
            
            {/* Vitrine pública */}
            <Route path="/vitrine" element={<Vitrine />} />
            <Route path="/loja/:slug" element={<Vitrine />} />
            <Route path="/loja/:slug/chat" element={<Chat />} />
            <Route path="/loja/:slug/chat/:productId" element={<Chat />} />
            
            {/* Chat público */}
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:productId" element={<Chat />} />
            <Route path="/c/:productId" element={<Chat />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
