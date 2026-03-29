import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Conversation, Id } from "../backend";
import { Composer } from "./Composer";
import { MessageBubble, TypingIndicator } from "./MessageBubble";

interface ChatAreaProps {
  conversation: Conversation | null | undefined;
  isLoading: boolean;
  isSending: boolean;
  selectedId: Id | null;
  onSend: (text: string) => void;
  isLoggedIn: boolean;
  isInitializing: boolean;
  onLogin: () => void;
}

export function ChatArea({
  conversation,
  isLoading,
  isSending,
  selectedId,
  onSend,
  isLoggedIn,
  isInitializing,
  onLogin,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCount = conversation?.messages.length ?? 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount, isSending]);

  // Show login prompt when not authenticated
  if (!isLoggedIn && !isInitializing) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-6 p-8"
        data-ocid="auth.panel"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-5 max-w-md text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">A</span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to apnaAI
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in to start chatting, save your conversations, and get
              AI-powered answers.
            </p>
          </div>
          <button
            type="button"
            data-ocid="auth.primary_button"
            onClick={onLogin}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/85 transition-all shadow-bubble"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Continue
          </button>
          <p className="text-xs text-muted-foreground">
            Powered by Internet Identity — secure &amp; decentralized
          </p>
        </motion.div>
      </div>
    );
  }

  if (selectedId === null) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-6 p-8"
        data-ocid="chat.empty_state"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">A</span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              How can I help you today?
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Start a new conversation or select an existing one from the
              sidebar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 max-w-lg w-full">
            {[
              { title: "Explain a concept", sub: "Learn about any topic" },
              { title: "Write code", sub: "Get help with programming" },
              { title: "Analyze text", sub: "Summarize or review content" },
              { title: "Creative writing", sub: "Stories, poems, ideas" },
            ].map((item) => (
              <button
                type="button"
                key={item.title}
                onClick={() => onSend(item.title)}
                className="bg-card border border-white/8 hover:border-primary/40 rounded-xl p-4 text-left transition-all hover:bg-card/80 group"
              >
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.sub}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
        <Composer onSend={onSend} disabled={false} isLoading={isSending} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex-1 flex flex-col p-6 gap-4"
        data-ocid="chat.loading_state"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex gap-3 ${i % 2 === 0 ? "flex-row-reverse" : ""}`}
          >
            {i % 2 !== 0 && (
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 bg-white/5" />
            )}
            <Skeleton
              className={`h-16 rounded-2xl bg-white/5 ${
                i % 2 === 0 ? "w-64" : "w-80"
              }`}
            />
          </div>
        ))}
      </div>
    );
  }

  const messages = conversation?.messages ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && !isSending && (
            <div className="text-center text-muted-foreground text-sm mt-12">
              Send a message to start the conversation
            </div>
          )}
          {messages.map((msg, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: message index is stable
            <MessageBubble key={i} message={msg} index={i} />
          ))}
          <AnimatePresence>{isSending && <TypingIndicator />}</AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <Composer onSend={onSend} disabled={false} isLoading={isSending} />
    </div>
  );
}
