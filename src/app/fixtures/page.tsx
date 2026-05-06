import Link from "next/link";
import { createFixture } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function FixturesPage() {
  const fixtures = await prisma.fixture.findMany({
    orderBy: { date: "asc" },
    include: { availability: true, selections: true },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="card space-y-5">
        <div>
          <p className="pill">Manual fixture setup</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Add the next Saturday</h1>
          <p className="mt-2 text-slate-600">Store the practical details you need for selection, messages, and match-day admin.</p>
        </div>
        <form action={createFixture} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="field">
              <label htmlFor="opposition">Opposition</label>
              <input className="input" id="opposition" name="opposition" required />
            </div>
            <div className="field">
              <label htmlFor="date">Date</label>
              <input className="input" id="date" name="date" required type="date" />
            </div>
            <div className="field">
              <label htmlFor="startTime">Start time</label>
              <input className="input" id="startTime" name="startTime" placeholder="13:00" />
            </div>
            <div className="field">
              <label htmlFor="homeAway">Home/Away</label>
              <select className="input" id="homeAway" name="homeAway">
                <option value="HOME">Home</option>
                <option value="AWAY">Away</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="division">Division</label>
              <input className="input" id="division" name="division" placeholder="Division 8A" />
            </div>
            <div className="field">
              <label htmlFor="tier">Tier</label>
              <input className="input" id="tier" name="tier" placeholder="Tier 8" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="matchType">Match type</label>
            <input className="input" id="matchType" name="matchType" placeholder="Cherwell 45 overs" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="field">
              <label htmlFor="groundName">Ground name</label>
              <input className="input" id="groundName" name="groundName" />
            </div>
            <div className="field">
              <label htmlFor="groundAddress">Ground address</label>
              <input className="input" id="groundAddress" name="groundAddress" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="homeInfo">Home ground information and restrictions</label>
            <textarea className="input min-h-24" id="homeInfo" name="homeInfo" placeholder="Parking, access, restricted areas, facilities, teas..." />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="field">
              <label htmlFor="scorerNotes">Scorer notes</label>
              <textarea className="input min-h-20" id="scorerNotes" name="scorerNotes" />
            </div>
            <div className="field">
              <label htmlFor="umpireNotes">Umpire notes</label>
              <textarea className="input min-h-20" id="umpireNotes" name="umpireNotes" />
            </div>
          </div>
          <button className="button button-primary" type="submit">
            Create fixture
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">Fixtures</h2>
        {fixtures.length === 0 ? (
          <div className="card text-slate-600">No fixtures yet.</div>
        ) : (
          fixtures.map((fixture) => (
            <article className="card space-y-4" key={fixture.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="pill">{fixture.homeAway === "HOME" ? "Home" : "Away"}</p>
                  <h3 className="mt-3 text-2xl font-bold">{fixture.opposition}</h3>
                  <p className="text-slate-600">
                    {formatDate(fixture.date)}
                    {fixture.startTime ? `, ${fixture.startTime}` : ""}
                    {fixture.groundName ? ` at ${fixture.groundName}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="button button-secondary" href={`/availability/${fixture.availabilityToken}`}>
                    Availability
                  </Link>
                  <Link className="button button-secondary" href={`/selection?fixtureId=${fixture.id}`}>
                    Select
                  </Link>
                  <Link className="button button-secondary" href={`/fees?fixtureId=${fixture.id}`}>
                    Fees
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="pill">{fixture.availability.length} responses</span>
                <span className="pill">{fixture.selections.length} selected</span>
                {fixture.division ? <span className="pill">{fixture.division}</span> : null}
                {fixture.tier ? <span className="pill">{fixture.tier}</span> : null}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
