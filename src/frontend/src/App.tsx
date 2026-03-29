import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, Settings, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Id } from "./backend";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { ChatArea } from "./components/ChatArea";
import { Sidebar } from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useConversation,
  useConversations,
  useCreateConversation,
  useDeleteAllConversations,
  useDeleteConversation,
  useIsAdmin,
  useSendMessage,
} from "./hooks/useQueries";

export default function App() {
  const [selectedId, setSelectedId] = useState<Id | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const isLoggedIn = !!identity;

  const qc = useQueryClient();
  const { data: conversations = [], isLoading: convosLoading } =
    useConversations();
  const { data: currentConvo, isLoading: convoLoading } =
    useConversation(selectedId);
  const createConvo = useCreateConversation();
  const deleteConvo = useDeleteConversation();
  const deleteAll = useDeleteAllConversations();
  const sendMsg = useSendMessage();
  const { data: isAdmin } = useIsAdmin();

  const handleNewChat = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to create a conversation");
      return;
    }
    try {
      const convo = await createConvo.mutateAsync("New Conversation");
      setSelectedId(convo.id);
    } catch {
      toast.error("Failed to create conversation");
    }
  };

  const handleDelete = async (id: Id) => {
    try {
      await deleteConvo.mutateAsync(id);
      if (selectedId === id) setSelectedId(null);
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAll.mutateAsync();
      setSelectedId(null);
      toast.success("All conversations cleared");
    } catch {
      toast.error("Failed to clear conversations");
    }
  };

  const handleSend = async (text: string) => {
    if (!isLoggedIn) {
      toast.error("Please log in to start chatting");
      return;
    }

    let targetId = selectedId;

    if (targetId === null) {
      try {
        const newConvo = await createConvo.mutateAsync(
          text.length > 40 ? `${text.slice(0, 40)}...` : text,
        );
        targetId = newConvo.id;
        setSelectedId(newConvo.id);
      } catch {
        toast.error("Failed to create conversation");
        return;
      }
    }

    setIsSending(true);
    try {
      await sendMsg.mutateAsync({ conversationId: targetId, text });
      await qc.invalidateQueries({
        queryKey: ["conversation", targetId.toString()],
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send message";
      if (
        msg.toLowerCase().includes("api key") ||
        msg.toLowerCase().includes("openai")
      ) {
        toast.error("OpenAI API key not configured", {
          description: isAdmin
            ? "Click the settings icon to add your key."
            : "Please ask the admin to configure the API key.",
        });
      } else {
        toast.error(msg || "Failed to send message");
      }
    } finally {
      setIsSending(false);
    }
  };

  const title = currentConvo?.title ?? "New Chat";

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.135 0.028 245) 0%, oklch(0.12 0.03 248) 100%)",
      }}
    >
      <Toaster theme="dark" />

      <Sidebar
        conversations={conversations}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNew={handleNewChat}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
        isCreating={createConvo.isPending}
        isDeleting={deleteConvo.isPending || deleteAll.isPending}
        isLoggedIn={isLoggedIn}
        isInitializing={isInitializing}
        isLoggingIn={isLoggingIn}
        onLogin={login}
        onLogout={clear}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 bg-sidebar/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-foreground truncate max-w-xs"
            >
              {selectedId ? title : "apnaAI"}
            </motion.h1>
            {convosLoading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-white/15 text-muted-foreground text-xs gap-1 bg-white/4"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              GPT-4o
            </Badge>
            {!isLoggedIn && !isInitializing && (
              <button
                type="button"
                data-ocid="auth.primary_button"
                onClick={login}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-medium transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </button>
            )}
            {isAdmin && isLoggedIn && (
              <button
                type="button"
                data-ocid="settings.open_modal_button"
                onClick={() => setShowApiKey(true)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        <ChatArea
          conversation={currentConvo}
          isLoading={convoLoading && selectedId !== null}
          isSending={isSending}
          selectedId={selectedId}
          onSend={handleSend}
          isLoggedIn={isLoggedIn}
          isInitializing={isInitializing}
          onLogin={login}
        />
      </main>

      <ApiKeyModal open={showApiKey} onClose={() => setShowApiKey(false)} />
    </div>
  );
}
