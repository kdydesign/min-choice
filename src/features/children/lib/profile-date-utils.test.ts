import { describe, expect, it } from "vitest";
import {
  deriveAgeMonthsFromBirthDate,
  deriveBirthDateFromAgeMonths,
  getDefaultBirthDate,
  isFutureBirthDate,
  isValidAgeMonthsInput,
  isValidChildName
} from "./profile-date-utils";

const REFERENCE_DATE = new Date(2026, 3, 3);

describe("profile-date-utils", () => {
  it("derives birth date from age months using calendar month subtraction", () => {
    expect(deriveBirthDateFromAgeMonths(12, REFERENCE_DATE)).toBe("2025-04-03");
    expect(deriveBirthDateFromAgeMonths(0, REFERENCE_DATE)).toBe("2026-04-03");
  });

  it("derives age months from birth date using calendar month difference", () => {
    expect(deriveAgeMonthsFromBirthDate("2025-04-04", REFERENCE_DATE)).toBe(12);
    expect(deriveAgeMonthsFromBirthDate("2026-04-03", REFERENCE_DATE)).toBe(0);
  });

  it("accepts trimmed names with numbers and special characters", () => {
    expect(isValidChildName(" 하민-1! ")).toBe(true);
    expect(isValidChildName("   ")).toBe(false);
  });

  it("validates age month inputs as non-negative integers only", () => {
    expect(isValidAgeMonthsInput("0")).toBe(true);
    expect(isValidAgeMonthsInput("12")).toBe(true);
    expect(isValidAgeMonthsInput("")).toBe(false);
    expect(isValidAgeMonthsInput("-1")).toBe(false);
    expect(isValidAgeMonthsInput("1.5")).toBe(false);
  });

  it("detects future birth dates", () => {
    expect(isFutureBirthDate("2026-04-04", REFERENCE_DATE)).toBe(true);
    expect(isFutureBirthDate("2026-04-03", REFERENCE_DATE)).toBe(false);
    expect(getDefaultBirthDate(REFERENCE_DATE)).toBe("2026-04-03");
  });
});
