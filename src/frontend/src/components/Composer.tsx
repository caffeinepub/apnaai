import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ComposerProps {
  onSend: (text: string) => void;
  disabled: boolean;
  isLoading: boolean;
}

export function Composer({ onSend, disabled, isLoading }: ComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: resize textarea on text change
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || isLoading) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = text.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="relative flex items-end gap-2 bg-secondary border border-white/10 rounded-2xl px-4 py-3 focus-within:border-primary/50 transition-colors">
        <textarea
          ref={textareaRef}
          data-ocid="chat.textarea"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message apnaAI..."
          disabled={disabled}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground leading-relaxed min-h-[24px] max-h-[180px] disabled:opacity-50"
        />
        <button
          type="button"
          data-ocid="chat.submit_button"
          onClick={handleSend}
          disabled={!canSend}
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/80 shadow-bubble"
              : "bg-white/5 text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
