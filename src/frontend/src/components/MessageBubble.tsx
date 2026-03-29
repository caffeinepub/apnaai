import { Check, Copy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Message } from "../backend";
import { Role } from "../backend";

interface MessageBubbleProps {
  message: Message;
  index: number;
}

function renderPart(part: string, i: number): React.ReactNode {
  if (part.startsWith("```")) {
    const lines = part.split("\n");
    const lang = lines[0].replace("```", "").trim();
    const code = lines.slice(1, -1).join("\n");
    // biome-ignore lint/suspicious/noArrayIndexKey: split parts have no stable id
    return <CodeBlock key={`cb-${i}`} code={code} lang={lang} />;
  }
  // biome-ignore lint/suspicious/noArrayIndexKey: split parts have no stable id
  return <TextContent key={`tc-${i}`} text={part} />;
}

function formatContent(content: string): React.ReactNode[] {
  return content.split(/(```[\s\S]*?```)/g).map(renderPart);
}

function renderLine(line: string, i: number, total: number): React.ReactNode {
  return (
    // biome-ignore lint/suspicious/noArrayIndexKey: line position is stable
    <span key={`line-${i}`}>
      {line.split(/(\*\*.*?\*\*)/g).map((seg, j) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          // biome-ignore lint/suspicious/noArrayIndexKey: segment order stable
          return <strong key={`b-${j}`}>{seg.slice(2, -2)}</strong>;
        }
        // biome-ignore lint/suspicious/noArrayIndexKey: segment order stable
        return <span key={`s-${j}`}>{seg}</span>;
      })}
      {i < total - 1 && <br />}
    </span>
  );
}

function TextContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <span>{lines.map((line, i) => renderLine(line, i, lines.length))}</span>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5">
        <span className="text-xs text-muted-foreground font-mono">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 bg-black/30 overflow-x-auto">
        <code className="font-mono text-sm text-foreground/90">{code}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === Role.user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
      className={`flex gap-3 mb-5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-bubble">
          A
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-bubble ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card text-foreground border border-white/8 rounded-tl-sm"
        }`}
      >
        {formatContent(message.content)}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3 mb-5"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
        A
      </div>
      <div className="bg-card border border-white/8 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
        <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground" />
      </div>
    </motion.div>
  );
}
