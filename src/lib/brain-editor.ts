// brain-editor.ts - Funções do MODO EDITOR (PWA)
// Responsável por:
// - Gerar brain.js a partir dos dados do editor
// - Gerar products.js a partir dos dados do editor
// - Gerar dataset.js a partir dos dados do editor
// - Converter tipos corretamente
// - Importar arquivos exportados pelo próprio PWA

import { BrainConfig, Intencao, Product, DatasetItem } from './brain-runtime';

// Versão do formato de exportação (para compatibilidade futura)
export const EXPORT_VERSION = '1.0';

/**
 * Gera ID único garantido sem colisão
 * Usa timestamp + contador + random para evitar duplicatas
 */
let idCounter = 0;
export function generateUniqueId(prefix: string = 'id'): string {
  idCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${idCounter}_${random}`;
}

// ==================== TIPOS DO EDITOR ====================

export interface EditorTraining {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
}

export interface EditorProduct {
  id: string;
  // Identificação
  ativo: boolean;
  // Dados comerciais
  nome: string;
  preco: number;
  categoria: string;
  // Conteúdo estratégico para IA
  descricaoCurta: string;
  descricaoDetalhada: string;
  // Mídia
  imagemUrl: string;
  // Links (reservados para próximos passos)
  chatLink?: string;
  shortLink?: string;
  // Auditoria
  createdAt: string;
  updatedAt: string;
  // Legado (mantido para compatibilidade)
  palavrasChave: string[];
  descricao?: string; // deprecated: use descricaoCurta
}

export interface EditorDatasetItem {
  id: string;
  input: string;
  output: string;
}

export interface EditorBusiness {
  nome: string;
  categoria: string;
  descricao?: string;
  telefone?: string;
  endereco?: string;
}

export interface EditorAISettings {
  estilo: 'amigavel_profissional' | 'educada' | 'vendedora' | 'direta';
  isActive: boolean;
  permitirEmoji: boolean;
  insistenciaVenda: 'baixa' | 'moderada' | 'alta';
  chamarHumanoAutomatico: boolean;
}

/**
 * Normaliza texto para comparação (usado em gatilhos)
 * Remove acentos, converte para minúsculas, trim
 */
function normalizeForTrigger(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ==================== INTENÇÕES BASE ====================

export const baseIntencoes: Intencao[] = [
  {
    categoria: "Saudação",
    gatilhos: [
      "oi", "oii", "oiii", "olá", "ola", "e aí", "fala",
      "bom dia", "boa tarde", "boa noite", "opa"
    ],
    respostas: [
      "Oi! 😊 Seja muito bem-vindo(a)! Como posso te ajudar hoje?",
      "Olá! Que bom te ver por aqui! Em que posso ajudar?",
      "Opa! 😄 Me conta, o que você precisa?"
    ]
  },
  {
    categoria: "Educação",
    gatilhos: ["obrigado", "obrigada", "valeu", "agradeço"],
    respostas: [
      "Por nada! 😊 Estou aqui pra isso.",
      "Imagina! Qualquer coisa é só chamar.",
      "Disponha! Foi um prazer ajudar 😄"
    ]
  },
  {
    categoria: "Preços",
    gatilhos: [
      "preço", "valor", "quanto custa", "qual o valor",
      "isso custa quanto", "quanto é"
    ],
    respostas: [
      "Claro! 😊 Me diga qual produto ou serviço você quer saber o valor.",
      "Consigo te passar sim! Me fala exatamente o que você procura 💰"
    ]
  },
  {
    categoria: "Produtos",
    gatilhos: [
      "produtos", "o que vocês vendem", "catálogo",
      "tem isso", "trabalham com"
    ],
    respostas: [
      "Temos várias soluções disponíveis! 😄 Quer me dizer o que você está procurando?",
      "Posso te apresentar nossos produtos sim! Me conta sua necessidade."
    ]
  },
  {
    categoria: "Promoções",
    gatilhos: [
      "promoção", "desconto", "oferta", "mais barato",
      "tem desconto", "preço especial"
    ],
    respostas: [
      "Olha 👀 sempre rolam condições especiais! Me diz o que você quer que eu confiro.",
      "Posso verificar promoções sim 😉 Qual produto você tem em mente?"
    ]
  },
  {
    categoria: "Suporte",
    gatilhos: [
      "problema", "erro", "não funciona", "ajuda",
      "suporte", "dificuldade"
    ],
    respostas: [
      "Calma 😊 vamos resolver isso juntos. Me explica o que está acontecendo.",
      "Estou aqui pra te ajudar sim! Me conta o problema com mais detalhes."
    ]
  },
  {
    categoria: "Reclamações",
    gatilhos: [
      "reclamar", "insatisfeito", "péssimo", "ruim",
      "não gostei", "decepcionado"
    ],
    respostas: [
      "Poxa 😔 sinto muito por isso. Me conta o que aconteceu pra eu resolver.",
      "Entendo sua frustração. Vamos achar uma solução juntos, tá?"
    ]
  },
  {
    categoria: "Conflito",
    gatilhos: [
      "idiota", "burro", "merda", "porcaria",
      "lixo", "vai se foder", "ódio", "raiva"
    ],
    respostas: [
      "Entendo que você esteja irritado 😕 vamos conversar com calma pra resolver isso.",
      "Não quero te deixar mais chateado. Me explica o problema que eu ajudo."
    ]
  },
  {
    categoria: "Conversa",
    gatilhos: [
      "tudo bem", "como você está", "como vai",
      "beleza", "tranquilo"
    ],
    respostas: [
      "Tudo ótimo 😄 e com você?",
      "Tudo certo por aqui! Em que posso te ajudar hoje?"
    ]
  },
  {
    categoria: "Despedida",
    gatilhos: [
      "tchau", "até mais", "falou",
      "até logo", "encerrar"
    ],
    respostas: [
      "Até mais! 👋 Qualquer coisa é só chamar.",
      "Foi um prazer falar com você! 😊"
    ]
  }
];

export const baseFallback = {
  respostas: [
    "Hmm 🤔 acho que não entendi direito. Pode me explicar melhor?",
    "Me conta com outras palavras que eu te ajudo 😉",
    "Não consegui captar isso agora, mas estou aqui pra ajudar!"
  ]
};

export const baseHumano = {
  gatilhos: [
    "falar com humano",
    "atendente",
    "pessoa real",
    "quero alguém",
    "me chama alguém",
    "humano"
  ],
  resposta: "Sem problema 😊 Vou te encaminhar para um atendente humano agora mesmo. Só um instante!"
};

// ==================== GERAÇÃO DE BRAIN.JS ====================

/**
 * Gera o brain.js completo a partir dos dados do editor
 * 
 * Os treinamentos customizados são CONVERTIDOS em intenções
 * e MESCLADOS com as intenções base
 * 
 * IMPORTANTE: Gatilhos são NORMALIZADOS para lowercase e trim
 */
export function generateBrainConfig(
  business: EditorBusiness,
  settings: EditorAISettings,
  trainings: EditorTraining[]
): BrainConfig {
  // Converter treinamentos em intenções
  // NORMALIZA gatilhos para lowercase + trim
  const customIntencoes: Intencao[] = trainings.map(t => ({
    categoria: t.categoria || "Customizado",
    gatilhos: [normalizeForTrigger(t.pergunta)],
    respostas: [t.resposta]
  }));

  // Normaliza gatilhos das intenções base também
  const normalizedBaseIntencoes: Intencao[] = baseIntencoes.map(i => ({
    ...i,
    gatilhos: i.gatilhos.map(normalizeForTrigger)
  }));

  // Treinamentos customizados TÊM PRIORIDADE (vêm primeiro)
  const allIntencoes = [...customIntencoes, ...normalizedBaseIntencoes];

  // Normaliza gatilhos do humano
  const normalizedHumano = {
    ...baseHumano,
    gatilhos: baseHumano.gatilhos.map(normalizeForTrigger)
  };

  return {
    comercio: {
      nome: String(business.nome || '').trim(),
      categoria: String(business.categoria || '').trim()
    },
    configuracoes: {
      estilo: settings.estilo || 'amigavel_profissional',
      idioma: 'pt-BR',
      permitirEmoji: Boolean(settings.permitirEmoji ?? true),
      insistenciaVenda: settings.insistenciaVenda || 'moderada',
      chamarHumanoAutomatico: Boolean(settings.chamarHumanoAutomatico ?? true)
    },
    fallback: baseFallback,
    humano: normalizedHumano,
    intencoes: allIntencoes
  };
}

/**
 * Gera o conteúdo do arquivo brain.js para exportação
 * Formato compatível com Node.js (CommonJS)
 */
export function exportBrainJS(brain: BrainConfig): string {
  const exportDate = new Date().toISOString();
  
  // Garantir serialização limpa (remove undefined, functions, etc)
  const cleanBrain = JSON.parse(JSON.stringify(brain));
  
  return `// brain.js - MegaBrain v${EXPORT_VERSION}
// Exportado do Assistente Virtual Inteligente
// Gerado em: ${new Date().toLocaleString('pt-BR')}
// Desenvolvido para atendimento, vendas e conversas naturais
// 
// USO:
// const brain = require('./brain.js');
// const { BrainRuntime } = require('./brain-runtime');
// const runtime = new BrainRuntime(brain);
// const result = runtime.processMessage("Olá!");
//
// @format: PWA_EXPORT
// @version: ${EXPORT_VERSION}
// @date: ${exportDate}

module.exports = ${JSON.stringify(cleanBrain, null, 2)};`;
}

// ==================== GERAÇÃO DE PRODUCTS.JS ====================

/**
 * Valida e normaliza um produto para exportação
 * Formato compatível com Node.js (id, name, price, description, keywords)
 */
function normalizeProductForExport(p: EditorProduct): Product {
  // Garante que price é number válido
  let price = 0;
  if (typeof p.preco === 'number' && !isNaN(p.preco) && isFinite(p.preco)) {
    price = p.preco;
  } else if (typeof p.preco === 'string') {
    const parsed = parseFloat(String(p.preco).replace(',', '.'));
    price = isNaN(parsed) ? 0 : parsed;
  }
  
  // Garante que keywords é array de strings
  let keywords: string[] = [];
  if (Array.isArray(p.palavrasChave)) {
    keywords = p.palavrasChave
      .filter((k): k is string => typeof k === 'string')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);
  }
  
  // Usa descricaoCurta ou descricaoDetalhada ou descricao legada
  const description = String(p.descricaoCurta || p.descricaoDetalhada || p.descricao || '').trim();
  
  return {
    id: p.id,
    name: String(p.nome || '').trim(),
    price,
    description,
    keywords
  };
}

/**
 * Gera o conteúdo do arquivo products.js para exportação
 * Formato compatível com Node.js (CommonJS)
 */
export function exportProductsJS(products: EditorProduct[]): string {
  const productsForExport: Product[] = products
    .filter(p => p.nome && String(p.nome).trim() !== '')
    .map(normalizeProductForExport);

  const exportDate = new Date().toISOString();
  
  const cleanProducts = JSON.parse(JSON.stringify(productsForExport));
  
  return `// products.js - Catálogo de Produtos
// Exportado do Assistente Virtual Inteligente
// Gerado em: ${new Date().toLocaleString('pt-BR')}
// 
// USO:
// const products = require('./products.js');
// const { BrainRuntime } = require('./brain-runtime');
// const brain = require('./brain.js');
// const runtime = new BrainRuntime(brain, products);
//
// @format: PWA_EXPORT
// @version: ${EXPORT_VERSION}
// @date: ${exportDate}

module.exports = ${JSON.stringify(cleanProducts, null, 2)};`;
}

// ==================== GERAÇÃO DE DATASET.JS ====================

/**
 * Gera o conteúdo do arquivo dataset.js para exportação
 * Formato: [{ input: "pergunta", output: "resposta" }]
 */
export function exportDatasetJS(dataset: EditorDatasetItem[]): string {
  const datasetForExport: DatasetItem[] = dataset
    .filter(d => d.input && d.output)
    .map(d => ({
      input: String(d.input).trim(),
      output: String(d.output).trim()
    }));

  const exportDate = new Date().toISOString();
  
  const cleanDataset = JSON.parse(JSON.stringify(datasetForExport));
  
  return `// dataset.js - Base de Conhecimento
// Exportado do Assistente Virtual Inteligente
// Gerado em: ${new Date().toLocaleString('pt-BR')}
// 
// USO:
// const dataset = require('./dataset.js');
// const { BrainRuntime } = require('./brain-runtime');
// const brain = require('./brain.js');
// const products = require('./products.js');
// const runtime = new BrainRuntime(brain, products, dataset);
//
// @format: PWA_EXPORT
// @version: ${EXPORT_VERSION}
// @date: ${exportDate}

module.exports = ${JSON.stringify(cleanDataset, null, 2)};`;
}

/**
 * Faz download de um arquivo JavaScript
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== IMPORTAÇÃO ====================

export interface ImportBrainResult {
  success: boolean;
  error?: string;
  data?: {
    business: Partial<EditorBusiness>;
    aiSettings: Partial<EditorAISettings>;
    trainingData: EditorTraining[];
  };
}

export interface ImportProductsResult {
  success: boolean;
  error?: string;
  data?: EditorProduct[];
}

export interface ImportDatasetResult {
  success: boolean;
  error?: string;
  data?: EditorDatasetItem[];
}

/**
 * Verifica se o arquivo foi exportado pelo PWA
 */
function extractExportMetadata(content: string): { isPWAExport: boolean; version?: string; date?: string } {
  const formatMatch = content.match(/@format:\s*(PWA_EXPORT)/);
  const versionMatch = content.match(/@version:\s*([0-9.]+)/);
  const dateMatch = content.match(/@date:\s*([^\n\r]+)/);
  
  return {
    isPWAExport: !!formatMatch,
    version: versionMatch?.[1],
    date: dateMatch?.[1]?.trim()
  };
}

/**
 * Parse seguro do module.exports de um arquivo JS
 * NÃO executa código, apenas extrai o objeto/array
 */
function parseModuleExports(content: string): { data: unknown; metadata: { isPWAExport: boolean; version?: string } } {
  const metadata = extractExportMetadata(content);
  
  // Remove comentários de linha
  let cleaned = content.replace(/\/\/.*$/gm, '');
  
  // Remove comentários de bloco
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Encontra o module.exports
  const match = cleaned.match(/module\.exports\s*=\s*([\s\S]+);?\s*$/);
  
  if (!match) {
    throw new Error('Arquivo não contém module.exports válido');
  }
  
  let jsonStr = match[1].trim();
  
  // Remove ponto e vírgula final se houver
  if (jsonStr.endsWith(';')) {
    jsonStr = jsonStr.slice(0, -1);
  }
  
  // Valida que é JSON puro (não contém código JS perigoso)
  const dangerousPatterns = [
    /function\s*\(/,
    /=>/,
    /require\s*\(/,
    /import\s+/,
    /eval\s*\(/,
    /new\s+Function/,
    /\$\{/,
    /\.call\s*\(/,
    /\.apply\s*\(/,
    /\.bind\s*\(/,
    /process\./,
    /global\./,
    /__dirname/,
    /__filename/,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(jsonStr)) {
      throw new Error('Arquivo contém código JavaScript não permitido. Apenas dados JSON são aceitos.');
    }
  }
  
  // Parse como JSON
  try {
    return { data: JSON.parse(jsonStr), metadata };
  } catch {
    throw new Error('Formato inválido. O arquivo deve conter JSON válido exportado pelo PWA.');
  }
}

/**
 * Importa brain.js e converte para formato do editor
 */
export function importBrainJS(content: string): ImportBrainResult {
  try {
    const { data, metadata } = parseModuleExports(content);
    
    if (!metadata.isPWAExport) {
      console.warn('[brain-editor] Arquivo pode não ter sido exportado pelo PWA. Tentando importar mesmo assim.');
    }
    
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, error: 'Arquivo não contém um objeto válido' };
    }

    const brainData = data as Record<string, unknown>;

    if (!brainData.intencoes && !brainData.comercio && !brainData.configuracoes) {
      return { success: false, error: 'Arquivo não contém estrutura de brain.js válida' };
    }

    // Extrai dados do comércio
    const business: Partial<EditorBusiness> = {};
    if (brainData.comercio && typeof brainData.comercio === 'object') {
      const comercio = brainData.comercio as Record<string, unknown>;
      business.nome = String(comercio.nome || '').trim();
      business.categoria = String(comercio.categoria || '').trim();
    }

    // Extrai configurações
    const aiSettings: Partial<EditorAISettings> = {};
    if (brainData.configuracoes && typeof brainData.configuracoes === 'object') {
      const config = brainData.configuracoes as Record<string, unknown>;
      
      const validEstilos = ['amigavel_profissional', 'educada', 'vendedora', 'direta'] as const;
      const estilo = config.estilo;
      aiSettings.estilo = validEstilos.includes(estilo as typeof validEstilos[number]) 
        ? estilo as typeof validEstilos[number] 
        : 'amigavel_profissional';
      
      aiSettings.permitirEmoji = Boolean(config.permitirEmoji ?? true);
      
      const validInsistencias = ['baixa', 'moderada', 'alta'] as const;
      const insistencia = config.insistenciaVenda;
      aiSettings.insistenciaVenda = validInsistencias.includes(insistencia as typeof validInsistencias[number]) 
        ? insistencia as typeof validInsistencias[number] 
        : 'moderada';
      
      aiSettings.chamarHumanoAutomatico = Boolean(config.chamarHumanoAutomatico ?? true);
    }

    // Converte intenções customizadas em treinamentos
    const baseCategories = baseIntencoes.map(i => i.categoria.toLowerCase());
    const trainingData: EditorTraining[] = [];
    
    if (Array.isArray(brainData.intencoes)) {
      (brainData.intencoes as unknown[]).forEach((intencao: unknown) => {
        if (!intencao || typeof intencao !== 'object') return;
        
        const int = intencao as Record<string, unknown>;
        const categoria = String(int.categoria || 'Importado');
        
        // Pula intenções base
        if (baseCategories.includes(categoria.toLowerCase())) {
          return;
        }
        
        const gatilhos = int.gatilhos;
        const respostas = int.respostas;
        
        if (Array.isArray(gatilhos) && Array.isArray(respostas)) {
          gatilhos.forEach((gatilho: unknown, gIndex: number) => {
            const resposta = (respostas[gIndex] || respostas[0] || '') as string;
            trainingData.push({
              id: generateUniqueId('training'),
              pergunta: String(gatilho || '').trim(),
              resposta: String(resposta).trim(),
              categoria
            });
          });
        }
      });
    }

    return {
      success: true,
      data: {
        business,
        aiSettings,
        trainingData
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao importar brain.js'
    };
  }
}

/**
 * Importa products.js e converte para formato do editor
 * Suporta formato antigo (nome, preco, palavrasChave) e novo (name, price, keywords)
 */
export function importProductsJS(content: string): ImportProductsResult {
  try {
    const { data, metadata } = parseModuleExports(content);
    
    if (!metadata.isPWAExport) {
      console.warn('[brain-editor] Arquivo pode não ter sido exportado pelo PWA. Tentando importar mesmo assim.');
    }
    
    if (!Array.isArray(data)) {
      return { success: false, error: 'Arquivo deve conter um array de produtos' };
    }

    const products: EditorProduct[] = [];
    
    (data as unknown[]).forEach((item: unknown) => {
      if (!item || typeof item !== 'object') return;
      
      const prod = item as Record<string, unknown>;
      
      // Suporta ambos os formatos
      const nome = prod.nome || prod.name;
      if (!nome || String(nome).trim() === '') {
        console.warn('[brain-editor] Produto sem nome ignorado:', item);
        return;
      }
      
      // Parse seguro do preço (suporta preco e price)
      let preco = 0;
      const precoRaw = prod.preco ?? prod.price;
      if (typeof precoRaw === 'number' && !isNaN(precoRaw) && isFinite(precoRaw)) {
        preco = precoRaw;
      } else if (typeof precoRaw === 'string') {
        const parsed = parseFloat(precoRaw.replace(',', '.'));
        preco = isNaN(parsed) ? 0 : parsed;
      }
      
      // Parse seguro de palavrasChave (suporta palavrasChave e keywords)
      let palavrasChave: string[] = [];
      const kwRaw = prod.palavrasChave ?? prod.keywords;
      if (Array.isArray(kwRaw)) {
        palavrasChave = (kwRaw as unknown[])
          .filter((k): k is string => typeof k === 'string')
          .map(k => k.trim().toLowerCase())
          .filter(Boolean);
      }
      
      const now = new Date().toISOString();
      products.push({
        id: String(prod.id || generateUniqueId('product')),
        ativo: Boolean(prod.ativo ?? true),
        nome: String(nome).trim(),
        categoria: String(prod.categoria || prod.category || 'Geral').trim(),
        preco,
        descricaoCurta: String(prod.descricaoCurta || '').trim(),
        descricaoDetalhada: String(prod.descricaoDetalhada || '').trim(),
        imagemUrl: String(prod.imagemUrl || '').trim(),
        chatLink: String(prod.chatLink || '').trim(),
        shortLink: String(prod.shortLink || '').trim(),
        createdAt: String(prod.createdAt || now),
        updatedAt: String(prod.updatedAt || now),
        descricao: String(prod.descricao || prod.description || '').trim(),
        palavrasChave
      });
    });

    return { success: true, data: products };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao importar products.js'
    };
  }
}

/**
 * Importa dataset.js e converte para formato do editor
 */
export function importDatasetJS(content: string): ImportDatasetResult {
  try {
    const { data, metadata } = parseModuleExports(content);
    
    if (!metadata.isPWAExport) {
      console.warn('[brain-editor] Arquivo pode não ter sido exportado pelo PWA. Tentando importar mesmo assim.');
    }
    
    if (!Array.isArray(data)) {
      return { success: false, error: 'Arquivo deve conter um array de perguntas e respostas' };
    }

    const dataset: EditorDatasetItem[] = [];
    
    (data as unknown[]).forEach((item: unknown) => {
      if (!item || typeof item !== 'object') return;
      
      const d = item as Record<string, unknown>;
      
      const input = d.input;
      const output = d.output;
      
      if (!input || !output) {
        console.warn('[brain-editor] Item de dataset inválido ignorado:', item);
        return;
      }
      
      dataset.push({
        id: generateUniqueId('dataset'),
        input: String(input).trim(),
        output: String(output).trim()
      });
    });

    return { success: true, data: dataset };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao importar dataset.js'
    };
  }
}

// ==================== MERGE ====================

/**
 * Mescla produtos importados com existentes
 */
export function mergeProducts(
  existing: EditorProduct[],
  imported: EditorProduct[]
): { merged: EditorProduct[]; added: number; updated: number } {
  const result = [...existing];
  let added = 0;
  let updated = 0;
  
  imported.forEach(importedProduct => {
    const normalizedName = importedProduct.nome.toLowerCase().trim();
    const existingIndex = result.findIndex(
      p => p.nome.toLowerCase().trim() === normalizedName
    );
    
    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...importedProduct,
        id: result[existingIndex].id
      };
      updated++;
    } else {
      result.push(importedProduct);
      added++;
    }
  });
  
  return { merged: result, added, updated };
}

/**
 * Mescla treinamentos importados com existentes
 */
export function mergeTrainingData(
  existing: EditorTraining[],
  imported: EditorTraining[]
): { merged: EditorTraining[]; added: number; updated: number } {
  const result = [...existing];
  let added = 0;
  let updated = 0;
  
  imported.forEach(importedTraining => {
    const normalizedQuestion = importedTraining.pergunta.toLowerCase().trim();
    const existingIndex = result.findIndex(
      t => t.pergunta.toLowerCase().trim() === normalizedQuestion
    );
    
    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...importedTraining,
        id: result[existingIndex].id
      };
      updated++;
    } else {
      result.push(importedTraining);
      added++;
    }
  });
  
  return { merged: result, added, updated };
}

/**
 * Mescla dataset importado com existente
 */
export function mergeDataset(
  existing: EditorDatasetItem[],
  imported: EditorDatasetItem[]
): { merged: EditorDatasetItem[]; added: number; updated: number } {
  const result = [...existing];
  let added = 0;
  let updated = 0;
  
  imported.forEach(importedItem => {
    const normalizedInput = importedItem.input.toLowerCase().trim();
    const existingIndex = result.findIndex(
      d => d.input.toLowerCase().trim() === normalizedInput
    );
    
    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...importedItem,
        id: result[existingIndex].id
      };
      updated++;
    } else {
      result.push(importedItem);
      added++;
    }
  });
  
  return { merged: result, added, updated };
}
