export type BowlingLimit = {
  ageBand: string;
  maxOversPerSpell: number;
  maxOversPerDay: number;
};

export type JuniorWarning = {
  level: "info" | "warning" | "danger";
  message: string;
};

const FAST_BOWLING_LIMITS: Array<{
  minAge: number;
  maxAge: number;
  limit: BowlingLimit;
}> = [
  { minAge: 0, maxAge: 11, limit: { ageBand: "11 and below", maxOversPerSpell: 4, maxOversPerDay: 8 } },
  { minAge: 12, maxAge: 13, limit: { ageBand: "12-13", maxOversPerSpell: 5, maxOversPerDay: 10 } },
  { minAge: 14, maxAge: 15, limit: { ageBand: "14-15", maxOversPerSpell: 5, maxOversPerDay: 12 } },
  { minAge: 16, maxAge: 17, limit: { ageBand: "16-17", maxOversPerSpell: 6, maxOversPerDay: 15 } },
  { minAge: 18, maxAge: 19, limit: { ageBand: "18-19", maxOversPerSpell: 7, maxOversPerDay: 18 } },
];

export function calculateAgeOnDate(dateOfBirth: Date, matchDate: Date): number {
  let age = matchDate.getFullYear() - dateOfBirth.getFullYear();
  const birthdayThisYear = new Date(
    matchDate.getFullYear(),
    dateOfBirth.getMonth(),
    dateOfBirth.getDate(),
  );

  if (matchDate < birthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function getFastBowlingLimit(age: number): BowlingLimit | null {
  return FAST_BOWLING_LIMITS.find((band) => age >= band.minAge && age <= band.maxAge)?.limit ?? null;
}

export function getJuniorWarnings(params: {
  dateOfBirth: Date | null;
  matchDate: Date;
  guardianConsent: boolean;
  bowlingStyle?: string | null;
}): JuniorWarning[] {
  if (!params.dateOfBirth) {
    return [];
  }

  const age = calculateAgeOnDate(params.dateOfBirth, params.matchDate);
  const warnings: JuniorWarning[] = [];

  if (age < 12) {
    warnings.push({
      level: "danger",
      message:
        "Player is under 12 on match day. Open-age cricket normally requires age 12+, with only narrow exceptional approvals.",
    });
  } else if (age < 18 && !params.guardianConsent) {
    warnings.push({
      level: "warning",
      message: "Junior player is under 18 and has no guardian consent recorded.",
    });
  }

  if (age < 20) {
    const limit = getFastBowlingLimit(age);
    if (limit) {
      const style = params.bowlingStyle?.toLowerCase() ?? "";
      const likelyFastBowler =
        style.includes("pace") ||
        style.includes("seam") ||
        style.includes("swing") ||
        style.includes("medium") ||
        style.includes("fast");

      warnings.push({
        level: likelyFastBowler ? "warning" : "info",
        message: `Age ${age}: fast bowling limit is ${limit.maxOversPerSpell} overs per spell and ${limit.maxOversPerDay} overs per day.`,
      });
    }
  }

  return warnings;
}
