// Sistema de temas automáticos por nicho de negócio

export type ThemeId = 
  | 'default'
  | 'restaurant'
  | 'fashion'
  | 'beauty'
  | 'education'
  | 'pet'
  | 'fitness'
  | 'health'
  | 'tech';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  categories: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    muted: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    googleImport?: string;
  };
  gradients: {
    primary: string;
    card: string;
    accent: string;
  };
  style: 'modern' | 'classic' | 'playful' | 'elegant' | 'bold';
}

export const themes: Record<ThemeId, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Padrão',
    description: 'Tema moderno e versátil',
    categories: ['Outro', 'Serviços Gerais'],
    colors: {
      primary: '190 100% 50%',
      secondary: '270 70% 60%',
      accent: '270 70% 60%',
      background: '230 35% 7%',
      card: '230 40% 12%',
      muted: '230 30% 20%',
      border: '230 40% 25%',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(230 40% 10%) 0%, hsl(270 50% 15%) 100%)',
      card: 'linear-gradient(145deg, hsl(230 40% 15% / 0.8) 0%, hsl(270 40% 12% / 0.6) 100%)',
      accent: 'linear-gradient(135deg, hsl(190 100% 50%) 0%, hsl(270 70% 60%) 100%)',
    },
    style: 'modern',
  },
  
  restaurant: {
    id: 'restaurant',
    name: 'Gastronomia',
    description: 'Tema quente e apetitoso',
    categories: ['Restaurante', 'Lanchonete', 'Pizzaria', 'Café', 'Bar', 'Food', 'Comida'],
    colors: {
      primary: '25 95% 55%',      // Laranja quente
      secondary: '45 90% 50%',    // Amarelo dourado
      accent: '0 75% 55%',        // Vermelho tomate
      background: '20 25% 8%',    // Marrom escuro
      card: '20 30% 14%',
      muted: '20 20% 20%',
      border: '20 25% 25%',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(20 25% 10%) 0%, hsl(25 40% 15%) 100%)',
      card: 'linear-gradient(145deg, hsl(20 30% 16% / 0.9) 0%, hsl(25 25% 12% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(25 95% 55%) 0%, hsl(45 90% 50%) 100%)',
    },
    style: 'elegant',
  },
  
  fashion: {
    id: 'fashion',
    name: 'Moda',
    description: 'Tema elegante e sofisticado',
    categories: ['Loja de Roupas', 'Moda', 'Acessórios', 'Calçados', 'Loja Virtual', 'E-commerce'],
    colors: {
      primary: '330 70% 60%',     // Rosa fashion
      secondary: '280 50% 50%',   // Roxo
      accent: '45 100% 50%',      // Dourado
      background: '0 0% 5%',      // Preto
      card: '0 0% 10%',
      muted: '0 0% 18%',
      border: '0 0% 22%',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(0 0% 5%) 0%, hsl(280 20% 10%) 100%)',
      card: 'linear-gradient(145deg, hsl(0 0% 12% / 0.9) 0%, hsl(280 15% 8% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(330 70% 60%) 0%, hsl(280 50% 50%) 100%)',
    },
    style: 'elegant',
  },
  
  beauty: {
    id: 'beauty',
    name: 'Beleza',
    description: 'Tema suave e feminino',
    categories: ['Salão de Beleza', 'Estética', 'Spa', 'Barbearia', 'Manicure', 'Cabelo'],
    colors: {
      primary: '340 80% 65%',     // Rosa suave
      secondary: '320 60% 55%',   // Magenta
      accent: '45 80% 70%',       // Champagne
      background: '340 20% 6%',   // Rosê escuro
      card: '340 25% 12%',
      muted: '340 15% 20%',
      border: '340 20% 25%',
    },
    fonts: {
      heading: 'Cormorant Garamond',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(340 20% 8%) 0%, hsl(320 30% 12%) 100%)',
      card: 'linear-gradient(145deg, hsl(340 25% 14% / 0.9) 0%, hsl(320 20% 10% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(340 80% 65%) 0%, hsl(320 60% 55%) 100%)',
    },
    style: 'elegant',
  },
  
  education: {
    id: 'education',
    name: 'Educação',
    description: 'Tema profissional e confiável',
    categories: ['Cursos', 'Escola', 'Faculdade', 'Treinamento', 'Consultório', 'Coaching'],
    colors: {
      primary: '210 90% 55%',     // Azul conhecimento
      secondary: '180 60% 45%',   // Teal
      accent: '45 100% 55%',      // Amarelo destaque
      background: '210 30% 8%',   // Azul escuro
      card: '210 35% 14%',
      muted: '210 25% 22%',
      border: '210 30% 28%',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(210 30% 10%) 0%, hsl(200 40% 15%) 100%)',
      card: 'linear-gradient(145deg, hsl(210 35% 16% / 0.9) 0%, hsl(200 30% 12% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(210 90% 55%) 0%, hsl(180 60% 45%) 100%)',
    },
    style: 'modern',
  },
  
  pet: {
    id: 'pet',
    name: 'Pet Shop',
    description: 'Tema divertido e acolhedor',
    categories: ['Pet Shop', 'Veterinário', 'Animais', 'Pet', 'Clínica Veterinária'],
    colors: {
      primary: '35 90% 55%',      // Laranja amigável
      secondary: '150 50% 45%',   // Verde natureza
      accent: '200 70% 55%',      // Azul céu
      background: '35 20% 7%',    // Marrom terra
      card: '35 25% 13%',
      muted: '35 15% 20%',
      border: '35 20% 25%',
    },
    fonts: {
      heading: 'Nunito',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(35 20% 9%) 0%, hsl(150 25% 12%) 100%)',
      card: 'linear-gradient(145deg, hsl(35 25% 15% / 0.9) 0%, hsl(150 20% 10% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(35 90% 55%) 0%, hsl(150 50% 45%) 100%)',
    },
    style: 'playful',
  },
  
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    description: 'Tema energético e motivador',
    categories: ['Academia', 'Crossfit', 'Personal', 'Esporte', 'Gym', 'Fitness'],
    colors: {
      primary: '145 70% 50%',     // Verde energia
      secondary: '200 80% 50%',   // Azul força
      accent: '45 100% 55%',      // Amarelo power
      background: '160 25% 6%',   // Verde escuro
      card: '160 30% 11%',
      muted: '160 20% 18%',
      border: '160 25% 24%',
    },
    fonts: {
      heading: 'Oswald',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(160 25% 8%) 0%, hsl(200 30% 10%) 100%)',
      card: 'linear-gradient(145deg, hsl(160 30% 13% / 0.9) 0%, hsl(200 25% 10% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(145 70% 50%) 0%, hsl(200 80% 50%) 100%)',
    },
    style: 'bold',
  },
  
  health: {
    id: 'health',
    name: 'Saúde',
    description: 'Tema limpo e confiável',
    categories: ['Consultório', 'Clínica', 'Médico', 'Dentista', 'Farmácia', 'Saúde'],
    colors: {
      primary: '180 60% 45%',     // Teal médico
      secondary: '200 50% 50%',   // Azul saúde
      accent: '150 60% 50%',      // Verde bem-estar
      background: '180 20% 6%',   // Cinza azulado
      card: '180 25% 12%',
      muted: '180 15% 20%',
      border: '180 20% 26%',
    },
    fonts: {
      heading: 'Lato',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(180 20% 8%) 0%, hsl(200 25% 10%) 100%)',
      card: 'linear-gradient(145deg, hsl(180 25% 14% / 0.9) 0%, hsl(200 20% 10% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(180 60% 45%) 0%, hsl(150 60% 50%) 100%)',
    },
    style: 'classic',
  },
  
  tech: {
    id: 'tech',
    name: 'Tecnologia',
    description: 'Tema futurista e inovador',
    categories: ['Tecnologia', 'Software', 'Informática', 'TI', 'Digital', 'App'],
    colors: {
      primary: '260 80% 60%',     // Roxo tech
      secondary: '190 100% 50%',  // Ciano neon
      accent: '320 80% 55%',      // Magenta
      background: '250 30% 6%',   // Roxo escuro
      card: '250 35% 12%',
      muted: '250 25% 20%',
      border: '250 30% 26%',
    },
    fonts: {
      heading: 'Space Grotesk',
      body: 'Inter',
      googleImport: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(250 30% 8%) 0%, hsl(280 35% 10%) 100%)',
      card: 'linear-gradient(145deg, hsl(250 35% 14% / 0.9) 0%, hsl(280 30% 10% / 0.7) 100%)',
      accent: 'linear-gradient(135deg, hsl(260 80% 60%) 0%, hsl(190 100% 50%) 100%)',
    },
    style: 'modern',
  },
};

// Mapeia categoria de negócio para tema
export function getThemeForCategory(category: string): ThemeId {
  const normalizedCategory = category.toLowerCase();
  
  for (const [themeId, theme] of Object.entries(themes)) {
    const matches = theme.categories.some(cat => 
      normalizedCategory.includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(normalizedCategory)
    );
    if (matches) {
      return themeId as ThemeId;
    }
  }
  
  return 'default';
}

// Gera CSS variables para um tema
export function generateThemeCSS(theme: ThemeConfig): string {
  return `
    --primary: ${theme.colors.primary};
    --secondary: ${theme.colors.secondary};
    --accent: ${theme.colors.accent};
    --background: ${theme.colors.background};
    --card: ${theme.colors.card};
    --muted: ${theme.colors.muted};
    --border: ${theme.colors.border};
    --gradient-primary: ${theme.gradients.primary};
    --gradient-card: ${theme.gradients.card};
    --gradient-accent: ${theme.gradients.accent};
    --font-heading: '${theme.fonts.heading}', sans-serif;
    --font-body: '${theme.fonts.body}', sans-serif;
  `.trim();
}
