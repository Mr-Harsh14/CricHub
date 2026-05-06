import { notFound } from "next/navigation";
import { submitAvailability } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

type AvailabilityFormPageProps = {
  params: Promise<{ token: string }>;
};

export default async function AvailabilityFormPage({ params }: AvailabilityFormPageProps) {
  const { token } = await params;
  const [fixture, players] = await Promise.all([
    prisma.fixture.findUnique({
      where: { availabilityToken: token },
      include: { availability: { orderBy: { submittedAt: "desc" } } },
    }),
    prisma.player.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!fixture) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl bg-slate-950 p-8 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Availability</p>
        <h1 className="mt-4 text-4xl font-bold">{fixture.opposition}</h1>
        <p className="mt-3 text-slate-300">
          {formatDate(fixture.date)}
          {fixture.startTime ? `, ${fixture.startTime}` : ""}
          {fixture.groundName ? ` at ${fixture.groundName}` : ""}
        </p>
      </section>

      <section className="card space-y-5">
        <h2 className="text-2xl font-bold text-slate-950">Submit your response</h2>
        <form action={submitAvailability} className="grid gap-4">
          <input name="token" type="hidden" value={fixture.availabilityToken} />
          <div className="field">
            <label htmlFor="playerId">Player</label>
            <select className="input" id="playerId" name="playerId">
              <option value="">Guest / not listed</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="playerName">Name if not listed</label>
            <input className="input" id="playerName" name="playerName" />
          </div>
          <div className="field">
            <label htmlFor="status">Availability</label>
            <select className="input" id="status" name="status">
              <option value="AVAILABLE">Available</option>
              <option value="MAYBE">Maybe</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="transport">Transport</label>
            <input className="input" id="transport" name="transport" placeholder="Can drive, need lift, late arrival..." />
          </div>
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea className="input min-h-24" id="notes" name="notes" placeholder="Injury, bowling limit, availability window..." />
          </div>
          <button className="button button-primary" type="submit">
            Submit availability
          </button>
        </form>
      </section>

      <section className="card space-y-4">
        <h2 className="text-xl font-semibold text-slate-950">Responses so far</h2>
        {fixture.availability.length === 0 ? (
          <p className="text-slate-600">No responses yet.</p>
        ) : (
          <div className="grid gap-3">
            {fixture.availability.map((response) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={response.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-950">{response.playerName}</p>
                  <span className="pill">{response.status.toLowerCase()}</span>
                </div>
                {response.transport ? <p className="mt-2 text-sm text-slate-600">Transport: {response.transport}</p> : null}
                {response.notes ? <p className="mt-1 text-sm text-slate-600">Notes: {response.notes}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
