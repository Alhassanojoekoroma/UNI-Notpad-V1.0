import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME, ThemeColors } from "@/lib/theme.config";
import { z } from "zod";

/**
 * Schema for theme color updates
 */
const ThemeUpdateSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondary: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  accent: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  background: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  surface: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  text: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  border: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  success: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  warning: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  danger: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

/**
 * GET /api/admin/theme
 * Fetch current theme colors
 */
export async function GET() {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    // Get current theme from settings
    const settings = await prisma.adminSettings.findFirst();

    if (!settings || !settings.themeColors) {
      return Response.json({ theme: DEFAULT_THEME });
    }

    const theme = (settings.themeColors as unknown) as ThemeColors;
    return Response.json({ theme });
  } catch (error) {
    console.error("[GET /api/admin/theme]", error);
    return Response.json(
      { error: "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/theme
 * Update theme colors (admin only)
 */
export async function POST(request: Request) {
  try {
    const guard = await requireRole("ADMIN");
    if (!guard.ok) return guard.response;

    const body = await request.json();

    // Validate colors
    const validatedColors = ThemeUpdateSchema.parse(body);

    // Get or create admin settings
    let settings = await prisma.adminSettings.findFirst();
    const currentTheme = ((settings?.themeColors as unknown) as ThemeColors) || DEFAULT_THEME;

    const updatedTheme: ThemeColors = {
      ...currentTheme,
      ...validatedColors,
    };

    if (!settings) {
      settings = await prisma.adminSettings.create({
        data: {
          themeColors: updatedTheme,
        },
      });
    } else {
      settings = await prisma.adminSettings.update({
        where: { id: settings.id },
        data: {
          themeColors: updatedTheme,
        },
      });
    }

    const theme = (settings.themeColors as unknown) as ThemeColors;
    return Response.json({ theme, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid colors" },
        { status: 400 }
      );
    }

    console.error("[POST /api/admin/theme]", error);
    return Response.json(
      { error: "Failed to update theme" },
      { status: 500 }
    );
  }
}
