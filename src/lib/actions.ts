"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { parsePoundsToPence } from "@/lib/format";

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

function booleanValue(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function createPlayer(formData: FormData) {
  await prisma.player.create({
    data: {
      name: stringValue(formData, "name") ?? "Unnamed player",
      phone: stringValue(formData, "phone"),
      role: stringValue(formData, "role") ?? "All-rounder",
      battingStyle: stringValue(formData, "battingStyle"),
      bowlingStyle: stringValue(formData, "bowlingStyle"),
      isWicketkeeper: booleanValue(formData, "isWicketkeeper"),
      dateOfBirth: stringValue(formData, "dateOfBirth")
        ? new Date(`${stringValue(formData, "dateOfBirth")}T12:00:00.000Z`)
        : undefined,
      guardianConsent: booleanValue(formData, "guardianConsent"),
      consentNotes: stringValue(formData, "consentNotes"),
      notes: stringValue(formData, "notes"),
    },
  });

  revalidatePath("/squad");
}

export async function createFixture(formData: FormData) {
  const homeAway = stringValue(formData, "homeAway") ?? "HOME";
  const fixture = await prisma.fixture.create({
    data: {
      opposition: stringValue(formData, "opposition") ?? "Opposition",
      date: new Date(`${stringValue(formData, "date") ?? new Date().toISOString().slice(0, 10)}T12:00:00.000Z`),
      startTime: stringValue(formData, "startTime"),
      homeAway,
      groundName: stringValue(formData, "groundName"),
      groundAddress: stringValue(formData, "groundAddress"),
      division: stringValue(formData, "division"),
      tier: stringValue(formData, "tier"),
      matchType: stringValue(formData, "matchType"),
      scorerNotes: stringValue(formData, "scorerNotes"),
      umpireNotes: stringValue(formData, "umpireNotes"),
      homeInfo: stringValue(formData, "homeInfo"),
      adminTasks: {
        create: [
          { stage: "PRE_MATCH", label: "Send availability request" },
          { stage: "PRE_MATCH", label: "Pick and announce playing XI" },
          { stage: "PRE_MATCH", label: "Check junior restrictions and consent" },
          ...(homeAway === "HOME"
            ? [{ stage: "PRE_MATCH", label: "Message opposition captain with ground information" }]
            : []),
          { stage: "POST_MATCH", label: "Confirm Play-Cricket Scorer upload or submit manual Cherwell result" },
          { stage: "POST_MATCH", label: "Collect and log match fees" },
        ],
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/fixtures");
  redirect(`/selection?fixtureId=${fixture.id}`);
}

export async function submitAvailability(formData: FormData) {
  const token = stringValue(formData, "token");
  if (!token) {
    return;
  }

  const fixture = await prisma.fixture.findUnique({ where: { availabilityToken: token } });
  if (!fixture) {
    return;
  }

  const playerId = stringValue(formData, "playerId");
  const existingPlayer = playerId ? await prisma.player.findUnique({ where: { id: playerId } }) : null;
  const playerName = existingPlayer?.name ?? stringValue(formData, "playerName") ?? "Guest player";
  const status = stringValue(formData, "status") ?? "MAYBE";

  if (playerId) {
    await prisma.availabilityResponse.upsert({
      where: {
        fixtureId_playerId: {
          fixtureId: fixture.id,
          playerId,
        },
      },
      create: {
        fixtureId: fixture.id,
        playerId,
        playerName,
        status,
        notes: stringValue(formData, "notes"),
        transport: stringValue(formData, "transport"),
      },
      update: {
        playerName,
        status,
        notes: stringValue(formData, "notes"),
        transport: stringValue(formData, "transport"),
      },
    });
  } else {
    await prisma.availabilityResponse.create({
      data: {
        fixtureId: fixture.id,
        playerName,
        status,
        notes: stringValue(formData, "notes"),
        transport: stringValue(formData, "transport"),
      },
    });
  }

  revalidatePath(`/availability/${token}`);
}

export async function saveSelection(formData: FormData) {
  const fixtureId = stringValue(formData, "fixtureId");
  if (!fixtureId) {
    return;
  }

  const selectedIds = formData.getAll("selectedPlayerId").map(String);
  const captainId = stringValue(formData, "captainId");
  const keeperId = stringValue(formData, "keeperId");
  const scorerId = stringValue(formData, "scorerId");
  const driverIds = new Set(formData.getAll("driverId").map(String));

  await prisma.selection.deleteMany({ where: { fixtureId } });
  await prisma.selection.createMany({
    data: selectedIds.map((playerId, index) => ({
      fixtureId,
      playerId,
      battingPosition: index + 1,
      isCaptain: playerId === captainId,
      isWicketkeeper: playerId === keeperId,
      isScorer: playerId === scorerId,
      isDriver: driverIds.has(playerId),
      notes: stringValue(formData, `notes-${playerId}`),
    })),
  });

  revalidatePath("/selection");
  revalidatePath("/messages");
}

export async function toggleTask(formData: FormData) {
  const taskId = stringValue(formData, "taskId");
  const fixtureId = stringValue(formData, "fixtureId");
  if (!taskId) {
    return;
  }

  const task = await prisma.matchAdminTask.findUnique({ where: { id: taskId } });
  if (!task) {
    return;
  }

  await prisma.matchAdminTask.update({
    where: { id: taskId },
    data: { isComplete: !task.isComplete },
  });

  revalidatePath("/");
  if (fixtureId) {
    revalidatePath(`/fees?fixtureId=${fixtureId}`);
  }
}

export async function createFeesForSelection(formData: FormData) {
  const fixtureId = stringValue(formData, "fixtureId");
  const feeOwedPence = parsePoundsToPence(formData.get("feeOwed"));
  if (!fixtureId) {
    return;
  }

  const selections = await prisma.selection.findMany({
    where: { fixtureId, selected: true },
    include: { player: true },
  });

  for (const selection of selections) {
    const existing = await prisma.paymentEntry.findFirst({
      where: { fixtureId, playerId: selection.playerId, isExpense: false },
    });

    if (!existing) {
      await prisma.paymentEntry.create({
        data: {
          fixtureId,
          playerId: selection.playerId,
          playerName: selection.player.name,
          feeOwedPence,
          status: "UNPAID",
        },
      });
    }
  }

  revalidatePath("/fees");
}

export async function updatePayment(formData: FormData) {
  const paymentId = stringValue(formData, "paymentId");
  if (!paymentId) {
    return;
  }

  await prisma.paymentEntry.update({
    where: { id: paymentId },
    data: {
      amountPaidPence: parsePoundsToPence(formData.get("amountPaid")),
      status: stringValue(formData, "status") ?? "UNPAID",
      method: stringValue(formData, "method"),
      notes: stringValue(formData, "notes"),
    },
  });

  revalidatePath("/fees");
}

export async function createExpense(formData: FormData) {
  const fixtureId = stringValue(formData, "fixtureId");
  if (!fixtureId) {
    return;
  }

  await prisma.paymentEntry.create({
    data: {
      fixtureId,
      playerName: stringValue(formData, "label") ?? "Expense",
      feeOwedPence: 0,
      amountPaidPence: parsePoundsToPence(formData.get("amountPaid")),
      status: "PAID",
      method: stringValue(formData, "method"),
      isExpense: true,
      notes: stringValue(formData, "notes"),
    },
  });

  revalidatePath("/fees");
}
