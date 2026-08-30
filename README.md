# ANIA-Assistente

Você é um arquiteto de produto sênior especializado em SaaS, PWA e aplicações mobile-first.

Crie DO ZERO uma aplicação chamada “Assistente Virtual Inteligente”, pensada para ser DISTRIBUÍDA A TERCEIROS (cada usuário representa um comércio diferente).

OBJETIVO PRINCIPAL:
Permitir que qualquer pessoa, mesmo sem conhecimento técnico, configure, treine e utilize uma IA de atendimento para WhatsApp, baseada em respostas humanas, produtos cadastrados e comportamento persuasivo.

REGRAS FUNDAMENTAIS:
1. A aplicação deve ser MOBILE-FIRST (formato de aplicativo).
2. Deve funcionar bem no celular, mas também se adaptar ao desktop.
3. NÃO pode parecer um painel de computador tradicional.
4. Deve parecer um APP PROFISSIONAL e GRANDE desde o primeiro acesso.
5. Linguagem 100% humana (nada técnico visível para o usuário).
6. Pensada para usuários leigos.
7. Cada usuário possui:
   - Seu próprio comércio
   - Sua própria IA
   - Seus próprios produtos
   - Seus próprios treinamentos

ESTRUTURA GERAL DO APP (PWA):

TELA 1 — ONBOARDING GUIADO
- Boas-vindas simples:
  “Vamos configurar seu atendimento inteligente em poucos minutos.”
- Coleta:
  - Nome do comércio
  - Categoria do comércio
- Seleção de estilo da IA:
  - Educada
  - Amigável
  - Vendedora
  - Direta
- Ao final, a IA JÁ DEVE FUNCIONAR com respostas padrão.

MENU PRINCIPAL (EM FORMATO DE CARDS, ÍCONES GRANDES):
Organizado como aplicativo de celular, NÃO como sidebar fixa.

Cards:
🤖 Minha IA
🧠 Treinar Atendimento
📦 Produtos
💬 Simular Conversa
📊 Meu Negócio
⚙️ Ajustes

Cada card abre uma TELA ÚNICA, organizada verticalmente.

TELA: “Minha IA”
- Status da IA (ativa / pausada)
- Descrição simples do que ela faz
- Botão “Testar resposta agora”
- Botão “Publicar atendimento”

TELA: “Treinar Atendimento”
- NÃO usar termos como “dataset” ou “intents”
- Interface guiada:
  Campo 1: “Quando o cliente perguntar…”
  Campo 2: “A IA deve responder assim…”
- Sugestões automáticas:
  - Atendimento inicial
  - Preço
  - Promoções
  - Suporte
  - Reclamações
  - Xingamentos e ofensas (a IA deve responder com educação)
- Botão claro: “Salvar resposta”
- Botão: “Atualizar IA”

TELA: “Produtos”
- Cadastro simples:
  - Nome do produto
  - Categoria (dropdown)
  - Preço (campo monetário, número, não string)
  - Palavras que o cliente pode usar para perguntar sobre o produto
- As palavras-chave DEVEM ser salvas corretamente em array.
- Interface amigável, com exemplos nos placeholders.
- Botão: “Salvar produto”
- Botão: “Exportar produtos”

TELA: “Simular Conversa”
- Campo de mensagem como WhatsApp
- IA responde em tempo real simulando atendimento humano

TELA: “Meu Negócio”
- Dados do comércio
- Categoria
- Informações gerais

TELA: “Ajustes”
- Tom da IA
- Idioma
- Backup
- Modo avançado (opcional)

EXPORTAÇÃO (IMPORTANTE):
- A exportação NÃO deve ficar na tela inicial.
- A exportação deve existir APENAS:
  - Na tela de Produtos
  - Na tela de Treinamento da IA
- Exportar automaticamente para arquivos:
  - brain.js
  - products.js
- Estrutura compatível com Node.js.
- Conversão automática de tipos:
  - Preço como number
  - Palavras-chave como array
- Usuário NÃO vê código, apenas clica em:
  “Publicar atendimento”

ARQUITETURA CONCEITUAL:
- A IA não começa vazia.
- Todo usuário recebe uma IA BASE pronta.
- O usuário apenas PERSONALIZA.
- O sistema deve parecer robusto, confiável e profissional.

DESIGN:
- Visual futurista, limpo, moderno.
- Ícones grandes.
- Tipografia clara.
- Nada poluído.
- Aparência de aplicativo nativo.

RESULTADO ESPERADO:
Uma aplicação PWA, mobile-first, intuitiva, pronta para ser usada por QUALQUER pessoa, permitindo criar, treinar e gerenciar uma IA de atendimento realista, humana e persuasiva.

Implemente essa aplicação respeitando todos os pontos acima. 
Utilize a imagem anexada como referência.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://assistente-virtual-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1500d32f-d3a9-47b0-9cca-2b7884fe4bea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
