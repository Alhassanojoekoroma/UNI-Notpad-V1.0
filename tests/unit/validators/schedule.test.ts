import { describe, it, expect } from "vitest";
import { createScheduleSchema, updateScheduleSchema } from "@/lib/validators/schedule";

describe("createScheduleSchema", () => {
  const validData = {
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "10:30",
    subject: "Mathematics",
  };

  it("accepts valid schedule", () => {
    const result = createScheduleSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts optional location and type", () => {
    const result = createScheduleSchema.safeParse({
      ...validData,
      location: "Room 101",
      type: "lecture",
    });
    expect(result.success).toBe(true);
  });

  it("rejects dayOfWeek out of range", () => {
    const result = createScheduleSchema.safeParse({ ...validData, dayOfWeek: 7 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time format", () => {
    const result = createScheduleSchema.safeParse({ ...validData, startTime: "9:00" });
    expect(result.success).toBe(false);
  });

  it("rejects time with invalid hours", () => {
    const result = createScheduleSchema.safeParse({ ...validData, startTime: "25:00" });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = createScheduleSchema.safeParse({ ...validData, subject: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateScheduleSchema", () => {
  it("accepts partial update", () => {
    const result = updateScheduleSchema.safeParse({ subject: "Physics" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateScheduleSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts nullable location and type", () => {
    const result = updateScheduleSchema.safeParse({ location: null, type: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time format in update", () => {
    const result = updateScheduleSchema.safeParse({ startTime: "9am" });
    expect(result.success).toBe(false);
  });
});
