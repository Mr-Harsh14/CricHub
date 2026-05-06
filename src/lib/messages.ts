import type { AvailabilityResponse, Fixture, PaymentEntry, Player, Selection } from "@prisma/client";
import { formatCurrencyFromPence, formatDate } from "@/lib/format";

type SelectionWithPlayer = Selection & { player: Player };

export function renderTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (body, [key, value]) => body.replaceAll(`{{${key}}}`, value),
    template,
  );
}

export function buildAvailabilityMessage(fixture: Fixture, origin?: string): string {
  const availabilityUrl = origin ? `${origin}/availability/${fixture.availabilityToken}` : `/availability/${fixture.availabilityToken}`;

  return [
    `Availability needed for ${fixture.opposition}`,
    "",
    `${formatDate(fixture.date)}${fixture.startTime ? `, ${fixture.startTime}` : ""}`,
    `${fixture.homeAway === "HOME" ? "Home" : "Away"}${fixture.groundName ? ` at ${fixture.groundName}` : ""}`,
    "",
    "Please reply using CricHub:",
    availabilityUrl,
    "",
    "Options: Available, Maybe, Unavailable. Add notes for arrival time, injury, transport, or bowling limits.",
  ].join("\n");
}

export function buildAvailabilityReminder(fixture: Fixture, missingPlayers: Player[], origin?: string): string {
  const names = missingPlayers.length > 0 ? missingPlayers.map((player) => player.name).join(", ") : "anyone who has not replied";

  return [
    `Reminder: ${fixture.opposition} availability`,
    "",
    `Still waiting on ${names}.`,
    `Please submit here: ${origin ? `${origin}/availability/${fixture.availabilityToken}` : `/availability/${fixture.availabilityToken}`}`,
  ].join("\n");
}

export function buildTeamAnnouncement(fixture: Fixture, selections: SelectionWithPlayer[]): string {
  const ordered = [...selections].sort((a, b) => (a.battingPosition ?? 99) - (b.battingPosition ?? 99));
  const players = ordered.map((selection, index) => {
    const tags = [
      selection.isCaptain ? "c" : "",
      selection.isWicketkeeper ? "wk" : "",
      selection.isScorer ? "scorer" : "",
      selection.isDriver ? "driver" : "",
    ].filter(Boolean);

    return `${index + 1}. ${selection.player.name}${tags.length ? ` (${tags.join(", ")})` : ""}`;
  });

  return [
    `Team for ${fixture.opposition}`,
    "",
    `${formatDate(fixture.date)}${fixture.startTime ? `, ${fixture.startTime}` : ""}`,
    `${fixture.homeAway === "HOME" ? "Home" : "Away"}${fixture.groundName ? ` at ${fixture.groundName}` : ""}`,
    "",
    ...players,
    "",
    fixture.scorerNotes ? `Scorer: ${fixture.scorerNotes}` : undefined,
    fixture.umpireNotes ? `Umpires: ${fixture.umpireNotes}` : undefined,
    "Please confirm if anything changes.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildOppositionHomeMessage(fixture: Fixture): string {
  return [
    `Hi, looking forward to hosting ${fixture.opposition} on ${formatDate(fixture.date)}.`,
    "",
    fixture.startTime ? `Start time: ${fixture.startTime}` : undefined,
    fixture.groundName ? `Ground: ${fixture.groundName}` : undefined,
    fixture.groundAddress ? `Address: ${fixture.groundAddress}` : undefined,
    fixture.homeInfo ? `Ground notes: ${fixture.homeInfo}` : undefined,
    fixture.scorerNotes ? `Scoring: ${fixture.scorerNotes}` : undefined,
    fixture.umpireNotes ? `Umpires: ${fixture.umpireNotes}` : undefined,
    "",
    "Please let me know if you need anything else before Saturday.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildPaymentMessage(fixture: Fixture, payments: PaymentEntry[]): string {
  const unpaid = payments.filter((payment) => !payment.isExpense && payment.status !== "PAID");
  const fee = payments.find((payment) => !payment.isExpense)?.feeOwedPence ?? 0;

  return [
    `Match fees for ${fixture.opposition}`,
    "",
    fee > 0 ? `Fee: ${formatCurrencyFromPence(fee)}` : "Please send match fees when you can.",
    unpaid.length > 0 ? `Still due: ${unpaid.map((payment) => payment.playerName).join(", ")}` : "Everyone is marked paid. Thank you.",
    "",
    "Please use your name as the reference and message me once paid.",
  ].join("\n");
}

export function buildPostMatchAdminMessage(fixture: Fixture): string {
  return [
    `Post-match admin for ${fixture.opposition}`,
    "",
    "Checklist:",
    "- If scored on Play-Cricket Scorer: confirm the match has uploaded.",
    "- If scored in the book: submit the Cherwell result today and complete Play-Cricket manually by Monday.",
    "- Log match fees and any umpire/scorer expenses in CricHub.",
  ].join("\n");
}

export function getMissingAvailabilityPlayers(players: Player[], responses: AvailabilityResponse[]): Player[] {
  const respondedPlayerIds = new Set(responses.map((response) => response.playerId).filter(Boolean));
  return players.filter((player) => player.active && !respondedPlayerIds.has(player.id));
}
