// AppContext.tsx - MODO EDITOR (PWA)
// Gerencia estado do editor visual
// NÃO executa lógica de IA diretamente
// Apenas armazena dados e gera arquivos para exportação

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrainRuntime, BrainConfig, Product, DatasetItem } from '@/lib/brain-runtime';
import { 
  EditorTraining, 
  EditorProduct, 
  EditorDatasetItem,
  EditorBusiness, 
  EditorAISettings,
  generateBrainConfig,
  exportBrainJS,
  exportProductsJS,
  exportDatasetJS,
  downloadFile,
  importBrainJS,
  importProductsJS,
  importDatasetJS,
  mergeProducts,
  mergeTrainingData,
  mergeDataset,
  generateUniqueId
} from '@/lib/brain-editor';

// Re-exportar tipos para uso externo
export type { 
  EditorTraining as TrainingData, 
  EditorProduct as Product, 
  EditorDatasetItem as DatasetItem,
  EditorBusiness as BusinessInfo, 
  EditorAISettings as AISettings 
};

interface AppState {
  isOnboarded: boolean;
  business: EditorBusiness;
  aiSettings: EditorAISettings;
  products: EditorProduct[];
  trainingData: EditorTraining[];
  dataset: EditorDatasetItem[];
}

interface AppContextType extends AppState {
  // Estado
  setOnboarded: (value: boolean) => void;
  
  // Negócio
  updateBusiness: (data: Partial<EditorBusiness>) => void;
  
  // Configurações da IA
  updateAISettings: (data: Partial<EditorAISettings>) => void;
  
  // Produtos (CRUD)
  addProduct: (product: Omit<EditorProduct, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<EditorProduct>) => void;
  deleteProduct: (id: string) => void;
  
  // Treinamentos (CRUD)
  addTraining: (training: Omit<EditorTraining, 'id'>) => void;
  updateTraining: (id: string, training: Partial<EditorTraining>) => void;
  deleteTraining: (id: string) => void;
  
  // Dataset (CRUD)
  addDatasetItem: (item: Omit<EditorDatasetItem, 'id'>) => void;
  updateDatasetItem: (id: string, item: Partial<EditorDatasetItem>) => void;
  deleteDatasetItem: (id: string) => void;
  
  // SIMULADOR - usa brain.js gerado
  simulateMessage: (message: string) => { response: string; categoria: string; redirectToHuman: boolean };
  
  // EXPORTAÇÃO
  exportBrain: () => void;
  exportProducts: () => void;
  exportDataset: () => void;
  exportAll: () => void;
  
  // IMPORTAÇÃO
  importBrain: (content: string) => Promise<{ success: boolean; error?: string; stats?: { trainings: number; updated: number } }>;
  importProducts: (content: string) => Promise<{ success: boolean; error?: string; stats?: { added: number; updated: number } }>;
  importDataset: (content: string) => Promise<{ success: boolean; error?: string; stats?: { added: number; updated: number } }>;
  
  // UTILIDADES
  getBrainConfig: () => BrainConfig;
  resetAllData: () => void;
}

const defaultState: AppState = {
  isOnboarded: false,
  business: {
    nome: '',
    categoria: '',
  },
  aiSettings: {
    estilo: 'amigavel_profissional',
    isActive: true,
    permitirEmoji: true,
    insistenciaVenda: 'moderada',
    chamarHumanoAutomatico: true,
  },
  products: [],
  trainingData: [],
  dataset: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('assistente-virtual-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrar dados antigos se necessário
        if (parsed.products) {
          parsed.products = parsed.products.map((p: any) => ({
            id: p.id,
            ativo: p.ativo ?? true,
            nome: p.nome || p.name || '',
            categoria: p.categoria || p.category || '',
            preco: typeof p.preco === 'number' ? p.preco : (typeof p.price === 'number' ? p.price : 0),
            descricaoCurta: p.descricaoCurta || '',
            descricaoDetalhada: p.descricaoDetalhada || '',
            imagemUrl: p.imagemUrl || '',
            chatLink: p.chatLink || '',
            shortLink: p.shortLink || '',
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString(),
            // Legado
            descricao: p.descricao || p.description || '',
            palavrasChave: Array.isArray(p.palavrasChave) ? p.palavrasChave : (Array.isArray(p.keywords) ? p.keywords : []),
          }));
        }
        if (parsed.trainingData) {
          parsed.trainingData = parsed.trainingData.map((t: any) => ({
            id: t.id,
            pergunta: t.pergunta || t.question || '',
            resposta: t.resposta || t.answer || '',
            categoria: t.categoria || t.category || 'Geral',
          }));
        }
        if (parsed.business) {
          parsed.business = {
            nome: parsed.business.nome || parsed.business.name || '',
            categoria: parsed.business.categoria || parsed.business.category || '',
            descricao: parsed.business.descricao || parsed.business.description || '',
            telefone: parsed.business.telefone || parsed.business.phone || '',
            endereco: parsed.business.endereco || parsed.business.address || '',
          };
        }
        // Inicializa dataset se não existir
        if (!parsed.dataset) {
          parsed.dataset = [];
        }
        return { ...defaultState, ...parsed };
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  // Persistir estado no localStorage
  useEffect(() => {
    localStorage.setItem('assistente-virtual-state', JSON.stringify(state));
  }, [state]);

  // ==================== ESTADO ====================
  
  const setOnboarded = (value: boolean) => {
    setState(prev => ({ ...prev, isOnboarded: value }));
  };

  // ==================== NEGÓCIO ====================
  
  const updateBusiness = (data: Partial<EditorBusiness>) => {
    setState(prev => ({ ...prev, business: { ...prev.business, ...data } }));
  };

  // ==================== CONFIGURAÇÕES DA IA ====================
  
  const updateAISettings = (data: Partial<EditorAISettings>) => {
    setState(prev => ({ ...prev, aiSettings: { ...prev.aiSettings, ...data } }));
  };

  // ==================== PRODUTOS (CRUD) ====================
  
  const addProduct = (product: Omit<EditorProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProduct: EditorProduct = { 
      ...product, 
      id: generateUniqueId('product'),
      ativo: product.ativo ?? true,
      preco: Number(product.preco),
      palavrasChave: Array.isArray(product.palavrasChave) ? product.palavrasChave : [],
      createdAt: now,
      updatedAt: now
    };
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const updateProduct = (id: string, product: Partial<EditorProduct>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { 
        ...p, 
        ...product, 
        updatedAt: new Date().toISOString() 
      } : p),
    }));
  };

  const deleteProduct = (id: string) => {
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id),
    }));
  };

  // ==================== TREINAMENTOS (CRUD) ====================
  
  const addTraining = (training: Omit<EditorTraining, 'id'>) => {
    const newTraining: EditorTraining = { ...training, id: generateUniqueId('training') };
    setState(prev => ({ ...prev, trainingData: [...prev.trainingData, newTraining] }));
  };

  const updateTraining = (id: string, training: Partial<EditorTraining>) => {
    setState(prev => ({
      ...prev,
      trainingData: prev.trainingData.map(t => t.id === id ? { ...t, ...training } : t),
    }));
  };

  const deleteTraining = (id: string) => {
    setState(prev => ({
      ...prev,
      trainingData: prev.trainingData.filter(t => t.id !== id),
    }));
  };

  // ==================== DATASET (CRUD) ====================
  
  const addDatasetItem = (item: Omit<EditorDatasetItem, 'id'>) => {
    const newItem: EditorDatasetItem = { ...item, id: generateUniqueId('dataset') };
    setState(prev => ({ ...prev, dataset: [...prev.dataset, newItem] }));
  };

  const updateDatasetItem = (id: string, item: Partial<EditorDatasetItem>) => {
    setState(prev => ({
      ...prev,
      dataset: prev.dataset.map(d => d.id === id ? { ...d, ...item } : d),
    }));
  };

  const deleteDatasetItem = (id: string) => {
    setState(prev => ({
      ...prev,
      dataset: prev.dataset.filter(d => d.id !== id),
    }));
  };

  // ==================== SIMULADOR ====================
  
  const getBrainConfig = (): BrainConfig => {
    return generateBrainConfig(state.business, state.aiSettings, state.trainingData);
  };

  /**
   * SIMULADOR - Usa o BrainRuntime para simular como a IA responderia
   * 
   * IMPORTANTE: Isso simula exatamente como seria em produção!
   * O BrainRuntime recebe brain.js, products.js e dataset.js e executa.
   * 
   * ORDEM: Dataset → Humano → Intenções → Produtos → Fallback
   */
  const simulateMessage = (message: string) => {
    // 1. Gera o brain.js a partir do editor
    const brainConfig = getBrainConfig();
    
    // 2. Prepara produtos (formato Node.js)
    const productsForRuntime: Product[] = state.products
      .filter(p => p.ativo !== false) // Apenas produtos ativos
      .map(p => ({
        id: p.id,
        name: p.nome,
        price: Number(p.preco),
        description: p.descricao || p.descricaoCurta || p.descricaoDetalhada || '',
        keywords: Array.isArray(p.palavrasChave) ? p.palavrasChave : []
      }));
    
    // 3. Prepara dataset
    const datasetForRuntime: DatasetItem[] = state.dataset.map(d => ({
      input: d.input,
      output: d.output
    }));
    
    // DEBUG: Log para verificar dados sendo passados
    console.log('[simulateMessage] Dados para BrainRuntime:', {
      message,
      productsCount: productsForRuntime.length,
      products: productsForRuntime.map(p => ({ name: p.name, price: p.price })),
      datasetCount: datasetForRuntime.length
    });
    
    // 4. Cria instância do runtime e processa
    const runtime = new BrainRuntime(brainConfig, productsForRuntime, datasetForRuntime);
    const result = runtime.processMessage(message);
    
    console.log('[simulateMessage] Resultado:', result);
    return result;
  };

  // ==================== EXPORTAÇÃO ====================
  
  const exportBrain = () => {
    const brainConfig = getBrainConfig();
    const content = exportBrainJS(brainConfig);
    downloadFile(content, 'brain.js');
  };

  const exportProducts = () => {
    const content = exportProductsJS(state.products);
    downloadFile(content, 'products.js');
  };

  const exportDataset = () => {
    const content = exportDatasetJS(state.dataset);
    downloadFile(content, 'dataset.js');
  };

  const exportAll = () => {
    exportBrain();
    exportProducts();
    exportDataset();
  };

  // ==================== IMPORTAÇÃO ====================

  const importBrain = async (content: string): Promise<{ success: boolean; error?: string; stats?: { trainings: number; updated: number } }> => {
    const result = importBrainJS(content);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const { business: importedBusiness, aiSettings: importedSettings, trainingData: importedTrainings } = result.data;
    
    const { merged: mergedTrainings, added, updated } = mergeTrainingData(state.trainingData, importedTrainings);
    
    setState(prev => ({
      ...prev,
      business: { ...prev.business, ...importedBusiness },
      aiSettings: { ...prev.aiSettings, ...importedSettings },
      trainingData: mergedTrainings
    }));

    return {
      success: true,
      stats: {
        trainings: added,
        updated
      }
    };
  };

  const importProducts = async (content: string): Promise<{ success: boolean; error?: string; stats?: { added: number; updated: number } }> => {
    const result = importProductsJS(content);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const { merged: mergedProducts, added, updated } = mergeProducts(state.products, result.data);
    
    setState(prev => ({
      ...prev,
      products: mergedProducts
    }));

    return {
      success: true,
      stats: { added, updated }
    };
  };

  const importDataset = async (content: string): Promise<{ success: boolean; error?: string; stats?: { added: number; updated: number } }> => {
    const result = importDatasetJS(content);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const { merged: mergedDataset, added, updated } = mergeDataset(state.dataset, result.data);
    
    setState(prev => ({
      ...prev,
      dataset: mergedDataset
    }));

    return {
      success: true,
      stats: { added, updated }
    };
  };

  // ==================== UTILIDADES ====================
  
  const resetAllData = () => {
    localStorage.removeItem('assistente-virtual-state');
    setState(defaultState);
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setOnboarded,
      updateBusiness,
      updateAISettings,
      addProduct,
      updateProduct,
      deleteProduct,
      addTraining,
      updateTraining,
      deleteTraining,
      addDatasetItem,
      updateDatasetItem,
      deleteDatasetItem,
      simulateMessage,
      exportBrain,
      exportProducts,
      exportDataset,
      exportAll,
      importBrain,
      importProducts,
      importDataset,
      getBrainConfig,
      resetAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
