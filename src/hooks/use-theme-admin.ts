import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemeColors, DEFAULT_THEME, applyThemeToDOM } from "@/lib/theme.config";

/**
 * Hook for admin theme management
 * Fetches current theme and provides mutation for updates
 */
export function useThemeAdmin() {
  const queryClient = useQueryClient();

  // Fetch current theme
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "theme"],
    queryFn: async () => {
      const response = await fetch("/api/admin/theme");
      if (!response.ok) throw new Error("Failed to fetch theme");
      const { theme } = await response.json();
      return theme as ThemeColors;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: DEFAULT_THEME,
  });

  // Mutation for updating theme
  const updateMutation = useMutation({
    mutationFn: async (colors: Partial<ThemeColors>) => {
      const response = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to update theme");
      }

      const { theme } = await response.json();
      return theme as ThemeColors;
    },
    onSuccess: (theme) => {
      // Apply theme to DOM immediately
      applyThemeToDOM(theme);

      // Update cache
      queryClient.setQueryData(["admin", "theme"], theme);
    },
  });

  const updateTheme = (colors: Partial<ThemeColors>) => {
    updateMutation.mutate(colors);
  };

  return {
    theme: data || DEFAULT_THEME,
    isPending: isPending || updateMutation.isPending,
    error: error || updateMutation.error,
    updateTheme,
  };
}
