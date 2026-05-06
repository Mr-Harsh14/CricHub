import { describe, expect, it } from "vitest";
import { buildAvailabilityMessage, buildTeamAnnouncement, renderTemplate } from "@/lib/messages";

const fixture = {
  id: "fixture-1",
  opposition: "Oxford CC 4",
  date: new Date("2026-05-09T12:00:00.000Z"),
  startTime: "13:00",
  homeAway: "HOME",
  groundName: "Main Ground",
  groundAddress: "1 Cricket Lane",
  division: "Division 8A",
  tier: "Tier 8",
  matchType: "Cherwell 45 overs",
  scorerNotes: "Please bring the tablet.",
  umpireNotes: "Panel umpire expected.",
  homeInfo: "Park by the pavilion.",
  status: "UPCOMING",
  availabilityToken: "abc123",
  createdAt: new Date("2026-05-01T12:00:00.000Z"),
  updatedAt: new Date("2026-05-01T12:00:00.000Z"),
};

describe("messages", () => {
  it("renders template placeholders", () => {
    expect(renderTemplate("Hello {{name}}, fixture is {{fixture}}.", { name: "Harsh", fixture: "Saturday" })).toBe(
      "Hello Harsh, fixture is Saturday.",
    );
  });

  it("builds availability messages with fixture links", () => {
    const message = buildAvailabilityMessage(fixture, "http://localhost:3000");

    expect(message).toContain("Availability needed for Oxford CC 4");
    expect(message).toContain("http://localhost:3000/availability/abc123");
  });

  it("builds ordered team announcements with role tags", () => {
    const message = buildTeamAnnouncement(fixture, [
      {
        id: "selection-2",
        fixtureId: "fixture-1",
        playerId: "player-2",
        selected: true,
        battingPosition: 2,
        isCaptain: false,
        isWicketkeeper: true,
        isScorer: false,
        isDriver: false,
        notes: null,
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        player: {
          id: "player-2",
          name: "Alex Keeper",
          phone: null,
          role: "Wicketkeeper",
          battingStyle: null,
          bowlingStyle: null,
          isWicketkeeper: true,
          dateOfBirth: null,
          guardianConsent: false,
          consentNotes: null,
          notes: null,
          active: true,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      },
      {
        id: "selection-1",
        fixtureId: "fixture-1",
        playerId: "player-1",
        selected: true,
        battingPosition: 1,
        isCaptain: true,
        isWicketkeeper: false,
        isScorer: false,
        isDriver: true,
        notes: null,
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
        updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        player: {
          id: "player-1",
          name: "Harsh Captain",
          phone: null,
          role: "All-rounder",
          battingStyle: null,
          bowlingStyle: null,
          isWicketkeeper: false,
          dateOfBirth: null,
          guardianConsent: false,
          consentNotes: null,
          notes: null,
          active: true,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-01T12:00:00.000Z"),
        },
      },
    ]);

    expect(message).toContain("1. Harsh Captain (c, driver)");
    expect(message).toContain("2. Alex Keeper (wk)");
  });
});
