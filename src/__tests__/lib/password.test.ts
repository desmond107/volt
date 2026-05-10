import { describe, it, expect } from "vitest";
import { validatePassword } from "@/lib/password";

describe("validatePassword", () => {
  it("returns error when password is too short", () => {
    expect(validatePassword("Ab1!")).toMatch(/8 characters/i);
  });

  it("returns error when no uppercase letter", () => {
    expect(validatePassword("abcdef1!")).toMatch(/uppercase/i);
  });

  it("returns error when no lowercase letter", () => {
    expect(validatePassword("ABCDEF1!")).toMatch(/lowercase/i);
  });

  it("returns error when no number", () => {
    expect(validatePassword("Abcdefg!")).toMatch(/number/i);
  });

  it("returns error when no special character", () => {
    expect(validatePassword("Abcdef12")).toMatch(/special/i);
  });

  it("returns null for a valid password", () => {
    expect(validatePassword("Secure1!")).toBeNull();
  });

  it("returns null for a longer valid password", () => {
    expect(validatePassword("MyP@ssword123")).toBeNull();
  });
});
