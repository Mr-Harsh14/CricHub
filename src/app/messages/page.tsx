import { headers } from "next/headers";
import { MessageCard } from "@/components/MessageCard";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  buildAvailabilityMessage,
  buildAvailabilityReminder,
  buildOppositionHomeMessage,
  buildPaymentMessage,
  buildPostMatchAdminMessage,
  buildTeamAnnouncement,
  getMissingAvailabilityPlayers,
} from "@/lib/messages";

type MessagesPageProps = {
  searchParams: Promise<{ fixtureId?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const { fixtureId } = await searchParams;
  const fixtures = await prisma.fixture.findMany({ orderBy: { date: "asc" } });
  const selectedFixtureId = fixtureId ?? fixtures[0]?.id;
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const origin = host ? `${protocol}://${host}` : undefined;

  const [fixture, players] = await Promise.all([
    selectedFixtureId
      ? prisma.fixture.findUnique({
          where: { id: selectedFixtureId },
          include: {
            availability: true,
            selections: { include: { player: true }, orderBy: { battingPosition: "asc" } },
            payments: true,
          },
        })
      : null,
    prisma.player.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="pill">Copy/paste comms</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">WhatsApp message generator</h1>
          <p className="mt-2 text-slate-600">Phase 1 avoids WhatsApp API complexity and gives you ready-to-send text.</p>
        </div>
        <form>
          <select className="input" defaultValue={selectedFixtureId} name="fixtureId">
            {fixtures.map((item) => (
              <option key={item.id} value={item.id}>
                {item.opposition} - {formatDate(item.date)}
              </option>
            ))}
          </select>
          <button className="button button-secondary mt-2 w-full" type="submit">
            Switch fixture
          </button>
        </form>
      </div>

      {!fixture ? (
        <div className="card text-slate-600">Create a fixture before generating messages.</div>
      ) : (
        <div className="grid gap-5">
          <MessageCard title="Availability request" body={buildAvailabilityMessage(fixture, origin)} />
          <MessageCard
            title="Availability reminder"
            body={buildAvailabilityReminder(fixture, getMissingAvailabilityPlayers(players, fixture.availability), origin)}
          />
          <MessageCard title="Team announcement" body={buildTeamAnnouncement(fixture, fixture.selections)} />
          {fixture.homeAway === "HOME" ? (
            <MessageCard title="Opposition captain home info" body={buildOppositionHomeMessage(fixture)} />
          ) : null}
          <MessageCard title="Payment request" body={buildPaymentMessage(fixture, fixture.payments)} />
          <MessageCard title="Post-match admin" body={buildPostMatchAdminMessage(fixture)} />
        </div>
      )}
    </div>
  );
}
