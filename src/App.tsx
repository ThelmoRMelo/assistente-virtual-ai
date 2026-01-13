import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Training from "./pages/Training";
import Products from "./pages/Products";
import Simulate from "./pages/Simulate";
import Business from "./pages/Business";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Conversations from "./pages/Conversations";
import ConversationDetail from "./pages/ConversationDetail";
import Auth from "./pages/Auth";
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
            {/* Rotas protegidas do painel admin */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/treinar" element={<ProtectedRoute><Training /></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/simular" element={<ProtectedRoute><Simulate /></ProtectedRoute>} />
            <Route path="/negocio" element={<ProtectedRoute><Business /></ProtectedRoute>} />
            <Route path="/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/conversas" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
            <Route path="/conversas/:id" element={<ProtectedRoute><ConversationDetail /></ProtectedRoute>} />
            
            {/* Autenticação */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Vitrine pública - sem autenticação */}
            <Route path="/vitrine" element={<Vitrine />} />
            <Route path="/loja/:slug" element={<Vitrine />} />
            <Route path="/loja/:slug/chat" element={<Chat />} />
            <Route path="/loja/:slug/chat/:productId" element={<Chat />} />
            
            {/* Chat público legado - sem autenticação */}
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
