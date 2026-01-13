// brain-runtime.ts - Motor de IA PURO
// Este arquivo é 100% compatível com Node.js e WhatsApp
// Não depende de React, Context ou localStorage
// Apenas RECEBE brain.js, products.js e dataset.js já prontos e EXECUTA
//
// IMPORTANTE: Este mesmo código roda no PWA (simulador) e no Node.js (produção)
// Garantindo fidelidade total entre editor e WhatsApp
//
// ORDEM DE PROCESSAMENTO:
// 1️⃣ Dataset (match direto normalizado)
// 2️⃣ Humano
// 3️⃣ Intenções
// 4️⃣ Produtos
// 5️⃣ Fallback

export interface Intencao {
  categoria: string;
  gatilhos: string[];
  respostas: string[];
}

export interface BrainConfig {
  comercio: {
    nome: string;
    categoria: string;
  };
  configuracoes: {
    estilo: string;
    idioma: string;
    permitirEmoji: boolean;
    insistenciaVenda: "baixa" | "moderada" | "alta";
    chamarHumanoAutomatico: boolean;
  };
  fallback: {
    respostas: string[];
  };
  humano: {
    gatilhos: string[];
    resposta: string;
  };
  intencoes: Intencao[];
}

export interface Product {
  id?: string;
  name: string;
  price: number; // SEMPRE number, nunca string
  description?: string;
  keywords: string[]; // SEMPRE array, nunca string
}

export interface DatasetItem {
  input: string;
  output: string;
}

export interface ProcessResult {
  response: string;
  categoria: string;
  redirectToHuman: boolean;
}

/**
 * BrainRuntime - Motor de execução puro
 * 
 * MODO DE USO (Node.js / WhatsApp):
 * 
 * const brain = require('./brain.js');
 * const products = require('./products.js');
 * const dataset = require('./dataset.js');
 * const { BrainRuntime } = require('./brain-runtime');
 * const runtime = new BrainRuntime(brain, products, dataset);
 * const result = runtime.processMessage("Olá!");
 * console.log(result.response);
 * 
 * IMPORTANTE:
 * - brain.js, products.js e dataset.js devem ser exportados pelo PWA
 * - Apenas dados JSON são aceitos (nenhum código executável)
 */
export class BrainRuntime {
  private brain: BrainConfig;
  private products: Product[];
  private dataset: DatasetItem[];

  constructor(brain: BrainConfig, products: Product[] = [], dataset: DatasetItem[] = []) {
    // Validação básica do brain
    if (!brain || typeof brain !== 'object') {
      throw new Error('BrainConfig inválido');
    }
    if (!brain.intencoes || !Array.isArray(brain.intencoes)) {
      throw new Error('brain.intencoes deve ser um array');
    }
    if (!brain.fallback || !Array.isArray(brain.fallback.respostas)) {
      throw new Error('brain.fallback.respostas deve ser um array');
    }
    
    this.brain = brain;
    
    // Normaliza produtos garantindo tipos corretos
    this.products = (products || []).map(p => ({
      id: p.id || undefined,
      name: String(p.name || ''),
      description: String(p.description || ''),
      price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price)) || 0,
      keywords: Array.isArray(p.keywords) ? p.keywords.map(String) : []
    }));
    
    // Normaliza dataset
    this.dataset = (dataset || []).filter(d => d && typeof d === 'object');
  }

  /**
   * Normaliza texto para comparação
   * Remove acentos, converte para minúsculas, trim
   */
  private normalize(text: string): string {
    return String(text || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  /**
   * Remove emojis se configuração não permitir
   */
  private processEmojis(text: string): string {
    if (!this.brain.configuracoes.permitirEmoji) {
      return text
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return text;
  }

  /**
   * Seleciona resposta aleatória do array
   */
  private pickRandom(arr: string[]): string {
    if (!Array.isArray(arr) || arr.length === 0) {
      return 'Desculpe, não consegui processar sua mensagem.';
    }
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Busca produto por nome ou palavras-chave
   */
  private findProduct(normalizedMessage: string): Product | null {
    for (const product of this.products) {
      // Verifica nome do produto
      const normalizedName = this.normalize(product.name);
      if (normalizedName && normalizedMessage.includes(normalizedName)) {
        return product;
      }
      
      // Verifica palavras-chave
      for (const keyword of product.keywords) {
        const normalizedKeyword = this.normalize(keyword);
        if (normalizedKeyword && normalizedMessage.includes(normalizedKeyword)) {
          return product;
        }
      }
    }
    
    return null;
  }

  /**
   * Verifica se mensagem contém gatilho de preço
   */
  private isAskingPrice(normalizedMessage: string): boolean {
    const priceIntents = [
      "preco", "valor", "quanto custa", "qual o valor", 
      "quanto e", "custa quanto", "quanto ta", "quanto tá"
    ];
    return priceIntents.some(intent => normalizedMessage.includes(intent));
  }

  /**
   * Formata preço em Real brasileiro
   * Compatível com Node.js e browser
   */
  private formatPrice(price: number): string {
    const valor = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * FUNÇÃO PRINCIPAL - Processa mensagem e retorna resposta
   * 
   * Ordem de prioridade:
   * 1️⃣ Dataset (match direto normalizado)
   * 2️⃣ Gatilhos para atendimento humano
   * 3️⃣ Intenções do brain.js
   * 4️⃣ Busca de produtos específicos
   * 5️⃣ Fallback
   */
  processMessage(message: string): ProcessResult {
    const normalizedMessage = this.normalize(message);

    // 1️⃣ DATASET - Pergunta direta (match exato normalizado)
    for (const item of this.dataset) {
      if (this.normalize(item.input) === normalizedMessage) {
        return {
          response: this.processEmojis(item.output),
          categoria: "Dataset",
          redirectToHuman: false
        };
      }
    }

    // 2️⃣ HUMANO - Verifica gatilhos para atendimento humano
    if (this.brain.configuracoes.chamarHumanoAutomatico && this.brain.humano) {
      const gatilhos = this.brain.humano.gatilhos || [];
      for (const gatilho of gatilhos) {
        if (normalizedMessage.includes(this.normalize(gatilho))) {
          return {
            response: this.processEmojis(this.brain.humano.resposta || 'Vou te encaminhar para um atendente.'),
            categoria: "Humano",
            redirectToHuman: true
          };
        }
      }
    }

    // ==================== CATÁLOGO DINÂMICO ====================
    const catalogTriggers = [
      'catalogo',
      'produtos',
      'o que voces vendem',
      'o que vocês vendem',
      'me mostra os produtos',
      'me mostra o catalogo',
      'quais produtos',
      'tem produto',
      'mostre os produtos',
      'quero ver o catalogo',
      'quero conhecer os produtos',
      'informacoes sobre a assistente virtual',
      'assistente virtual',
      'lista de produtos',
      'ver produtos'
    ];

    if (catalogTriggers.some(t => normalizedMessage.includes(this.normalize(t)))) {
      if (this.products.length > 0) {
        const listaProdutos = this.products
          .slice(0, 10)
          .map(p => `• ${p.name} — ${this.formatPrice(p.price)}`)
          .join('\n');

        return {
          response: this.processEmojis(
            `Temos atualmente estas soluções disponíveis:\n\n${listaProdutos}\n\nQuer saber mais sobre algum deles? 😄`
          ),
          categoria: "Catálogo",
          redirectToHuman: false
        };
      }
    }

    // 3️⃣ INTENÇÕES - Verifica intenções do brain.js
    for (const intencao of this.brain.intencoes) {
      if (!intencao.gatilhos || !Array.isArray(intencao.gatilhos)) continue;
      
      for (const gatilho of intencao.gatilhos) {
        const normalizedGatilho = this.normalize(gatilho);
        if (normalizedGatilho && normalizedMessage.includes(normalizedGatilho)) {
          const response = this.pickRandom(intencao.respostas || []);
          return {
            response: this.processEmojis(response),
            categoria: intencao.categoria || 'Geral',
            redirectToHuman: false
          };
        }
      }
    }

    // 4️⃣ PRODUTOS - Verifica se perguntou sobre produto específico
    const product = this.findProduct(normalizedMessage);
    if (product) {
      const formattedPrice = this.formatPrice(product.price);
      
      if (this.isAskingPrice(normalizedMessage)) {
        const response = `O ${product.name} custa ${formattedPrice} 😊 Quer saber mais sobre ele?`;
        return {
          response: this.processEmojis(response),
          categoria: "Preços",
          redirectToHuman: false
        };
      } else {
        const desc = product.description ? ` ${product.description}` : '';
        const response = `O ${product.name} é uma ótima escolha!${desc} Custa ${formattedPrice}. 😄 Posso te ajudar com mais alguma coisa?`;
        return {
          response: this.processEmojis(response),
          categoria: "Produtos",
          redirectToHuman: false
        };
      }
    }

    // 5️⃣ FALLBACK - Nenhuma intenção encontrada
    return {
      response: this.processEmojis(this.pickRandom(this.brain.fallback.respostas)),
      categoria: "Fallback",
      redirectToHuman: false
    };
  }
}

// Exportação compatível com CommonJS (Node.js) e ES Modules (browser)
// Em Node.js: const { BrainRuntime } = require('./brain-runtime');
// No browser/PWA: import { BrainRuntime } from './brain-runtime';
