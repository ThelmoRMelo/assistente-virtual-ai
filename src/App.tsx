import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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
            {/* Rota pública - Landing page */}
            <Route path="/" element={<Landing />} />
            
            {/* Autenticação */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Rotas protegidas do painel admin (/app) */}
            <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/app/treinar" element={<ProtectedRoute><Training /></ProtectedRoute>} />
            <Route path="/app/produtos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/app/simular" element={<ProtectedRoute><Simulate /></ProtectedRoute>} />
            <Route path="/app/negocio" element={<ProtectedRoute><Business /></ProtectedRoute>} />
            <Route path="/app/ajustes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/app/conversas" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
            <Route path="/app/conversas/:id" element={<ProtectedRoute><ConversationDetail /></ProtectedRoute>} />
            
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
