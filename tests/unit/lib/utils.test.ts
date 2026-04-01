import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  generateReferralCode,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("deduplicates Tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2025-01-15T12:00:00Z"));
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  it("formats an ISO string", () => {
    const result = formatDate("2025-06-01T00:00:00Z");
    expect(result).toContain("Jun");
    expect(result).toContain("2025");
  });
});

describe("formatRelativeTime", () => {
  it('returns "just now" for very recent dates', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
  });
});

describe("formatFileSize", () => {
  it("formats 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1.0 GB");
  });

  it("formats fractional sizes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });
});

describe("generateReferralCode", () => {
  it("generates an 8-character code", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
  });

  it("only uses allowed characters (no I, O, 0, 1)", () => {
    const allowed = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode();
      for (const char of code) {
        expect(allowed).toContain(char);
      }
    }
  });

  it("generates different codes across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()));
    // With 8 chars from 31-char alphabet, collision is astronomically unlikely
    expect(codes.size).toBeGreaterThan(15);
  });
});
