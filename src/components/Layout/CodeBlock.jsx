import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function CodeBlock({ code, language = 'javascript' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="relative rounded-xl overflow-hidden text-sm group">
      <button
        onClick={copy}
        className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Copy code to clipboard"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: '0.75rem', fontSize: '0.8rem', lineHeight: '1.6' }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
