import ReactMarkdown from 'react-markdown';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

// Regex para detectar URLs soltas (não em markdown)
const urlRegex = /(https?:\/\/[^\s<>"\]]+)/g;

// Converte URLs soltas em links markdown
function preprocessContent(content: string): string {
  // Não processa se já está em formato markdown de link
  const lines = content.split('\n');
  return lines.map(line => {
    // Se a linha já tem um link markdown, não processa
    if (/\[.*?\]\(https?:\/\/.*?\)/.test(line)) {
      return line;
    }
    // Converte URLs soltas em links markdown
    return line.replace(urlRegex, (url) => `[${url}](${url})`);
  }).join('\n');
}

export function MarkdownMessage({ content, className = '' }: MarkdownMessageProps) {
  const processedContent = preprocessContent(content);
  
  return (
    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>
      <ReactMarkdown
        components={{
          // Links clicáveis
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:opacity-80 break-all"
            >
              {children}
            </a>
          ),
          // Parágrafos sem margin extra
          p: ({ children }) => <span className="block">{children}</span>,
          // Headers
          h1: ({ children }) => <span className="block text-lg font-bold mt-2 mb-1">{children}</span>,
          h2: ({ children }) => <span className="block text-base font-bold mt-2 mb-1">{children}</span>,
          h3: ({ children }) => <span className="block text-sm font-bold mt-1">{children}</span>,
          // Negrito e itálico
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          // Listas
          ul: ({ children }) => <ul className="list-disc list-inside my-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-1">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          // Código inline
          code: ({ children }) => (
            <code className="bg-muted/50 px-1 py-0.5 rounded text-xs">{children}</code>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
