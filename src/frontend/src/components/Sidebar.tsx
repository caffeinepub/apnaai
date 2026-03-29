import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  MessageSquare,
  Plus,
  Trash,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Conversation, Id } from "../backend";

function relativeTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

interface SidebarProps {
  conversations: Conversation[];
  selectedId: Id | null;
  onSelect: (id: Id) => void;
  onNew: () => void;
  onDelete: (id: Id) => void;
  onClearAll: () => void;
  isCreating: boolean;
  isDeleting: boolean;
  isLoggedIn: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function Sidebar({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onClearAll,
  isCreating,
  isDeleting,
  isLoggedIn,
  isInitializing,
  isLoggingIn,
  onLogin,
  onLogout,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<Id | null>(null);

  return (
    <aside
      className={`relative flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-[260px]"
      } flex-shrink-0`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-sidebar border border-white/10 flex items-center justify-center hover:bg-accent transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand */}
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-white/6 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground text-base tracking-tight">
              apna<span className="text-primary">AI</span>
            </span>
          )}
        </div>

        {/* New Chat button */}
        <div className={`px-3 py-3 ${collapsed ? "flex justify-center" : ""}`}>
          <Button
            data-ocid="chat.primary_button"
            onClick={onNew}
            disabled={isCreating || !isLoggedIn}
            title={
              !isLoggedIn ? "Sign in to create a conversation" : "New Chat"
            }
            className={`bg-primary hover:bg-primary/85 text-primary-foreground rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
              collapsed ? "w-10 h-10 p-0" : "w-full"
            }`}
          >
            <Plus className={`${collapsed ? "" : "mr-2"} w-4 h-4`} />
            {!collapsed && "New Chat"}
          </Button>
        </div>

        {/* Auth prompt when not logged in */}
        {!isLoggedIn && !collapsed && !isInitializing && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
              Sign in to start chatting and save your conversations.
            </p>
            <button
              type="button"
              data-ocid="auth.primary_button"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/85 transition-colors disabled:opacity-60"
            >
              <LogIn className="w-3.5 h-3.5" />
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </button>
          </div>
        )}

        {/* Conversation list */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-1">
            <AnimatePresence initial={false}>
              {conversations.map((conv, index) => {
                const isActive = selectedId === conv.id;
                return (
                  <motion.div
                    key={conv.id.toString()}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15, delay: index * 0.02 }}
                    data-ocid={`chat.item.${index + 1}`}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredId(conv.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => onSelect(conv.id)}
                      className={`group relative w-full flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-left ${
                        isActive
                          ? "bg-primary/15 border border-primary/30"
                          : "hover:bg-accent/60"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <MessageSquare
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm truncate ${
                                isActive
                                  ? "text-foreground font-medium"
                                  : "text-foreground/80"
                              }`}
                            >
                              {conv.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {relativeTime(conv.lastActivity)}
                            </p>
                          </div>
                          {hoveredId === conv.id && (
                            <button
                              type="button"
                              data-ocid={`chat.delete_button.${index + 1}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(conv.id);
                              }}
                              disabled={isDeleting}
                              className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {conversations.length === 0 && !collapsed && isLoggedIn && (
              <div className="text-center text-muted-foreground text-xs py-6 px-2">
                No conversations yet.
                <br />
                Start a new chat!
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Clear all */}
        {!collapsed && conversations.length > 0 && isLoggedIn && (
          <div className="px-3 py-3 border-t border-white/6">
            <button
              type="button"
              data-ocid="chat.delete_button"
              onClick={onClearAll}
              disabled={isDeleting}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors w-full px-2 py-2 rounded-lg hover:bg-destructive/10"
            >
              <Trash className="w-3.5 h-3.5" />
              Clear all conversations
            </button>
          </div>
        )}

        {/* Footer: user status + Made in India */}
        <div
          className={`px-3 pb-4 pt-2 border-t border-white/6 space-y-2 ${
            collapsed ? "flex flex-col items-center" : ""
          }`}
        >
          {/* Login / Logout button */}
          {isLoggedIn ? (
            <button
              type="button"
              data-ocid="auth.toggle"
              onClick={onLogout}
              className={`flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/60 ${
                collapsed ? "w-10 h-10 justify-center" : "w-full px-2 py-2"
              }`}
              title="Sign out"
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate flex-1 text-left">Sign out</span>
              )}
              {!collapsed && <LogOut className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ) : (
            !isInitializing &&
            collapsed && (
              <button
                type="button"
                data-ocid="auth.primary_button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="w-10 h-10 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 flex items-center justify-center text-primary transition-colors"
                title="Sign In"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )
          )}

          {/* Made in India */}
          {!collapsed && (
            <div className="flex justify-center">
              <span
                style={{ color: "#95A4BD", fontSize: "11px" }}
                className="select-none"
              >
                Made in India 🇮🇳
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
