import { describe, expect, it } from "vitest";
import { calculateAgeOnDate, getFastBowlingLimit, getJuniorWarnings } from "@/lib/juniorRules";

describe("junior rules", () => {
  it("calculates age on the match date", () => {
    expect(calculateAgeOnDate(new Date("2010-05-07T12:00:00.000Z"), new Date("2026-05-06T12:00:00.000Z"))).toBe(15);
    expect(calculateAgeOnDate(new Date("2010-05-06T12:00:00.000Z"), new Date("2026-05-06T12:00:00.000Z"))).toBe(16);
  });

  it("returns ECB-style fast bowling limits by age band", () => {
    expect(getFastBowlingLimit(13)).toEqual({
      ageBand: "12-13",
      maxOversPerSpell: 5,
      maxOversPerDay: 10,
    });
    expect(getFastBowlingLimit(17)).toEqual({
      ageBand: "16-17",
      maxOversPerSpell: 6,
      maxOversPerDay: 15,
    });
    expect(getFastBowlingLimit(20)).toBeNull();
  });

  it("warns for underage and missing junior consent cases", () => {
    const underage = getJuniorWarnings({
      dateOfBirth: new Date("2015-06-01T12:00:00.000Z"),
      matchDate: new Date("2026-05-06T12:00:00.000Z"),
      guardianConsent: false,
      bowlingStyle: "Right-arm medium",
    });

    expect(underage.some((warning) => warning.level === "danger")).toBe(true);

    const missingConsent = getJuniorWarnings({
      dateOfBirth: new Date("2011-06-01T12:00:00.000Z"),
      matchDate: new Date("2026-05-06T12:00:00.000Z"),
      guardianConsent: false,
      bowlingStyle: "Off spin",
    });

    expect(missingConsent.some((warning) => warning.message.includes("guardian consent"))).toBe(true);
  });
});
