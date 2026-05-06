import { describe, expect, it } from "vitest";
import { getSelectionIssues } from "@/lib/selectionRules";

function player(id: number, isWicketkeeper = false) {
  return {
    id: `player-${id}`,
    name: `Player ${id}`,
    phone: null,
    role: "All-rounder",
    battingStyle: null,
    bowlingStyle: null,
    isWicketkeeper,
    dateOfBirth: null,
    guardianConsent: false,
    consentNotes: null,
    notes: null,
    active: true,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    updatedAt: new Date("2026-05-01T12:00:00.000Z"),
  };
}

function selection(id: number, overrides: { isCaptain?: boolean; isWicketkeeper?: boolean } = {}) {
  return {
    id: `selection-${id}`,
    fixtureId: "fixture-1",
    playerId: `player-${id}`,
    selected: true,
    battingPosition: id,
    isCaptain: overrides.isCaptain ?? false,
    isWicketkeeper: overrides.isWicketkeeper ?? false,
    isScorer: false,
    isDriver: false,
    notes: null,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    updatedAt: new Date("2026-05-01T12:00:00.000Z"),
    player: player(id, overrides.isWicketkeeper),
  };
}

describe("selection rules", () => {
  it("warns when selected players are not exactly eleven", () => {
    expect(getSelectionIssues([selection(1)]).some((issue) => issue.message.includes("1 player"))).toBe(true);
  });

  it("passes when eleven players include captain and keeper", () => {
    const selections = Array.from({ length: 11 }, (_, index) =>
      selection(index + 1, { isCaptain: index === 0, isWicketkeeper: index === 1 }),
    );

    expect(getSelectionIssues(selections)).toEqual([]);
  });
});
