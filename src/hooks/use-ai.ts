"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AIConversation,
  AIChatMessage,
  AIQueryStatus,
  AIStreamEvent,
  LearningToolResult,
  AudioOverviewResult,
} from "@/lib/types";

// Fetch helper
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data;
}

// AI query status (free queries remaining, token balance)
export function useAIStatus() {
  return useQuery<AIQueryStatus>({
    queryKey: ["ai-status"],
    queryFn: () => fetchJSON("/api/ai/status"),
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}

// Conversation list
export function useAIHistory(page = 1) {
  return useQuery<AIConversation[]>({
    queryKey: ["ai-history", page],
    queryFn: () => fetchJSON(`/api/ai/history?page=${page}`),
  });
}

// Messages for a specific conversation
export function useAIConversation(conversationId: string | null) {
  return useQuery<AIChatMessage[]>({
    queryKey: ["ai-conversation", conversationId],
    queryFn: () => fetchJSON(`/api/ai/history/${conversationId}`),
    enabled: !!conversationId,
  });
}

// Streaming chat hook
export function useSendAIQuery() {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const send = useCallback(
    async (params: {
      query: string;
      conversationId?: string;
      sourceContentIds?: string[];
      learningLevel?: string;
      chatStyle?: string;
      responseLength?: string;
      customInstructions?: string;
    }): Promise<{ id: string; conversationId: string; response: string } | null> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStreamingText("");
      setIsStreaming(true);

      try {
        const res = await fetch("/api/ai/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || "Request failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";
        let result: { id: string; conversationId: string } | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const event: AIStreamEvent = JSON.parse(data);

              if (event.type === "delta") {
                accumulated += event.text;
                setStreamingText(accumulated);
              } else if (event.type === "done") {
                result = {
                  id: event.id,
                  conversationId: event.conversationId,
                };
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["ai-status"] });
        queryClient.invalidateQueries({ queryKey: ["ai-history"] });
        if (result) {
          queryClient.invalidateQueries({
            queryKey: ["ai-conversation", result.conversationId],
          });
          return { ...result, response: accumulated };
        }
        return null;
      } catch (error) {
        if ((error as Error).name === "AbortError") return null;
        throw error;
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [queryClient]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, stop, streamingText, isStreaming };
}

// Rate a response
export function useRateResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      interactionId,
      rating,
    }: {
      interactionId: string;
      rating: number;
    }) => {
      await fetchJSON(`/api/ai/history/${interactionId}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversation"] });
    },
  });
}

// Delete a conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await fetchJSON(`/api/ai/history/${conversationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-history"] });
    },
  });
}

// Clear all history
export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetchJSON("/api/ai/history", { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-history"] });
      queryClient.invalidateQueries({ queryKey: ["ai-conversation"] });
    },
  });
}

// Generate learning tool content
export function useGenerateLearningTool() {
  const queryClient = useQueryClient();
  return useMutation<
    LearningToolResult,
    Error,
    {
      toolType: string;
      sourceContentIds: string[];
      topic?: string;
      learningLevel?: string;
    }
  >({
    mutationFn: async (params) => {
      return fetchJSON("/api/ai/learning-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-status"] });
    },
  });
}

// Generate audio overview
export function useGenerateAudio() {
  const queryClient = useQueryClient();
  return useMutation<
    AudioOverviewResult,
    Error,
    {
      sourceContentIds: string[];
      narrationStyle: "single" | "conversation";
      voiceId?: string;
    }
  >({
    mutationFn: async (params) => {
      return fetchJSON("/api/ai/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-status"] });
    },
  });
}

// Save quiz score
export function useSaveQuizScore() {
  return useMutation({
    mutationFn: async (params: {
      module: string;
      quizType: string;
      score: number;
      totalQuestions: number;
    }) => {
      return fetchJSON("/api/ai/quiz-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
    },
  });
}
