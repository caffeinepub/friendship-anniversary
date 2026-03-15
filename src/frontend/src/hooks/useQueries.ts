import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AppSettings, Memories } from "../backend.d";
import { useActor } from "./useActor";

export function useAppSettings() {
  const { actor, isFetching } = useActor();
  return useQuery<AppSettings>({
    queryKey: ["appSettings"],
    queryFn: async () => {
      if (!actor)
        return {
          friendName: "My Best Friend",
          anniversaryDate: new Date().toISOString().split("T")[0],
          personalLetter: "",
        };
      return actor.getAppSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetAppSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: AppSettings) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setAppSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appSettings"] });
      toast.success("Settings saved!");
    },
    onError: () => toast.error("Failed to save settings"),
  });
}

export function useListMemories() {
  const { actor, isFetching } = useActor();
  return useQuery<Memories[]>({
    queryKey: ["memories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMemories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMemory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      date,
      description,
    }: { title: string; date: string; description: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addMemory(title, date, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      toast.success("Memory added! 🌸");
    },
    onError: () => toast.error("Failed to add memory"),
  });
}

export function useUpdateMemory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      date,
      description,
    }: { id: bigint; title: string; date: string; description: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateMemory(id, title, date, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      toast.success("Memory updated!");
    },
    onError: () => toast.error("Failed to update memory"),
  });
}

export function useDeleteMemory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteMemory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      toast.success("Memory removed");
    },
    onError: () => toast.error("Failed to delete memory"),
  });
}
