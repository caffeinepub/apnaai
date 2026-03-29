import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Id } from "../backend";
import { useActor } from "./useActor";

export function useConversations() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      if (!actor) return [];
      const convos = await actor.getAllConversations();
      return convos.sort((a, b) => Number(b.lastActivity - a.lastActivity));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useConversation(id: Id | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["conversation", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getConversation(id);
    },
    enabled: !!actor && !isFetching && id !== null,
    refetchInterval: false,
  });
}

export function useCreateConversation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error("No actor");
      return actor.createConversation(title);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useDeleteConversation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: Id) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteConversation(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useDeleteAllConversations() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.deleteAllConversations();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
    }: { conversationId: Id; text: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.sendMessage(conversationId, text);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["conversation", variables.conversationId.toString()],
      });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApiKey() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      return actor.setOpenAiApiKey(key);
    },
  });
}
