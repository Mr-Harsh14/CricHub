import type { Player, Selection } from "@prisma/client";

export type SelectionIssue = {
  level: "info" | "warning" | "danger";
  message: string;
};

type SelectionWithPlayer = Selection & { player: Player };

export function getSelectionIssues(selections: SelectionWithPlayer[]): SelectionIssue[] {
  const issues: SelectionIssue[] = [];

  if (selections.length !== 11) {
    issues.push({
      level: selections.length < 11 ? "danger" : "warning",
      message: `Selected XI currently has ${selections.length} player${selections.length === 1 ? "" : "s"}.`,
    });
  }

  if (!selections.some((selection) => selection.isWicketkeeper || selection.player.isWicketkeeper)) {
    issues.push({
      level: "warning",
      message: "No wicketkeeper is marked in the XI.",
    });
  }

  if (!selections.some((selection) => selection.isCaptain)) {
    issues.push({
      level: "info",
      message: "No captain is marked for this fixture.",
    });
  }

  return issues;
}
