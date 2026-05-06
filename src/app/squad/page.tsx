import { createPlayer } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { calculateAgeOnDate, getFastBowlingLimit } from "@/lib/juniorRules";

export default async function SquadPage() {
  const players = await prisma.player.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  const today = new Date();

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="card space-y-5">
        <div>
          <p className="pill">Squad database</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Add player</h1>
          <p className="mt-2 text-slate-600">DOB and consent fields power junior warnings during selection.</p>
        </div>
        <form action={createPlayer} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="field">
              <label htmlFor="name">Name</label>
              <input className="input" id="name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input className="input" id="phone" name="phone" />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <select className="input" id="role" name="role">
                <option>All-rounder</option>
                <option>Opening batter</option>
                <option>Middle-order batter</option>
                <option>Bowler</option>
                <option>Wicketkeeper</option>
                <option>Junior</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input className="input" id="dateOfBirth" name="dateOfBirth" type="date" />
            </div>
            <div className="field">
              <label htmlFor="battingStyle">Batting style</label>
              <input className="input" id="battingStyle" name="battingStyle" placeholder="RHB, LHB..." />
            </div>
            <div className="field">
              <label htmlFor="bowlingStyle">Bowling style</label>
              <input className="input" id="bowlingStyle" name="bowlingStyle" placeholder="Right-arm medium, off spin..." />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 font-semibold">
            <input name="isWicketkeeper" type="checkbox" />
            Wicketkeeper option
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 font-semibold">
            <input name="guardianConsent" type="checkbox" />
            Guardian consent recorded
          </label>
          <div className="field">
            <label htmlFor="consentNotes">Consent / safeguarding notes</label>
            <textarea className="input min-h-20" id="consentNotes" name="consentNotes" />
          </div>
          <div className="field">
            <label htmlFor="notes">Captain notes</label>
            <textarea className="input min-h-20" id="notes" name="notes" />
          </div>
          <button className="button button-primary" type="submit">
            Add player
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950">Players</h2>
        {players.length === 0 ? (
          <div className="card text-slate-600">Add a few regulars before collecting availability.</div>
        ) : (
          <div className="grid gap-4">
            {players.map((player) => {
              const age = player.dateOfBirth ? calculateAgeOnDate(player.dateOfBirth, today) : null;
              const limit = age !== null ? getFastBowlingLimit(age) : null;

              return (
                <article className="card space-y-3" key={player.id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-950">{player.name}</h3>
                      <p className="text-slate-600">{player.role}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {player.isWicketkeeper ? <span className="pill">WK</span> : null}
                      {age !== null ? <span className="pill">Age {age}</span> : null}
                      {player.guardianConsent ? <span className="pill">Consent recorded</span> : null}
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <p>Batting: {player.battingStyle ?? "Not set"}</p>
                    <p>Bowling: {player.bowlingStyle ?? "Not set"}</p>
                    {limit ? (
                      <p>
                        Fast bowling: {limit.maxOversPerSpell}/spell, {limit.maxOversPerDay}/day
                      </p>
                    ) : null}
                    {player.phone ? <p>Phone: {player.phone}</p> : null}
                  </div>
                  {player.notes ? <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{player.notes}</p> : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
