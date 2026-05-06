import Link from "next/link";
import { saveSelection } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getJuniorWarnings } from "@/lib/juniorRules";
import { getSelectionIssues } from "@/lib/selectionRules";

type SelectionPageProps = {
  searchParams: Promise<{ fixtureId?: string }>;
};

export default async function SelectionPage({ searchParams }: SelectionPageProps) {
  const { fixtureId } = await searchParams;
  const fixtures = await prisma.fixture.findMany({ orderBy: { date: "asc" } });
  const selectedFixtureId = fixtureId ?? fixtures[0]?.id;

  const [fixture, players] = await Promise.all([
    selectedFixtureId
      ? prisma.fixture.findUnique({
          where: { id: selectedFixtureId },
          include: {
            availability: true,
            selections: { include: { player: true }, orderBy: { battingPosition: "asc" } },
          },
        })
      : null,
    prisma.player.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const selectedIds = new Set(fixture?.selections.map((selection) => selection.playerId) ?? []);
  const issues = fixture ? getSelectionIssues(fixture.selections) : [];
  const responseByPlayer = new Map(fixture?.availability.map((response) => [response.playerId, response]) ?? []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="pill">Selection board</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Pick the XI</h1>
          <p className="mt-2 text-slate-600">Availability, role balance, and junior restrictions side by side.</p>
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
        <div className="card text-slate-600">Create a fixture before selecting a team.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="card space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">{fixture.opposition}</h2>
              <p className="text-slate-600">
                {formatDate(fixture.date)}
                {fixture.startTime ? `, ${fixture.startTime}` : ""}
              </p>
            </div>
            <form action={saveSelection} className="space-y-5">
              <input name="fixtureId" type="hidden" value={fixture.id} />
              <div className="grid gap-3">
                {players.map((player) => {
                  const response = responseByPlayer.get(player.id);
                  const warnings = getJuniorWarnings({
                    dateOfBirth: player.dateOfBirth,
                    matchDate: fixture.date,
                    guardianConsent: player.guardianConsent,
                    bowlingStyle: player.bowlingStyle,
                  });

                  return (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4" key={player.id}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <label className="flex items-start gap-3">
                          <input defaultChecked={selectedIds.has(player.id)} name="selectedPlayerId" type="checkbox" value={player.id} />
                          <span>
                            <span className="block font-bold text-slate-950">{player.name}</span>
                            <span className="text-sm text-slate-600">
                              {player.role}
                              {player.bowlingStyle ? `, ${player.bowlingStyle}` : ""}
                            </span>
                          </span>
                        </label>
                        <span className="pill">{response?.status.toLowerCase() ?? "no response"}</span>
                      </div>
                      {response?.notes || response?.transport ? (
                        <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                          {[response.transport, response.notes].filter(Boolean).join(" | ")}
                        </p>
                      ) : null}
                      {warnings.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          {warnings.map((warning) => (
                            <p className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900" key={warning.message}>
                              {warning.message}
                            </p>
                          ))}
                        </div>
                      ) : null}
                      <input
                        className="input mt-3"
                        defaultValue={fixture.selections.find((selection) => selection.playerId === player.id)?.notes ?? ""}
                        name={`notes-${player.id}`}
                        placeholder="Batting, bowling, fielding, or selection notes"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <RoleSelect label="Captain" name="captainId" players={players} selectedValue={fixture.selections.find((selection) => selection.isCaptain)?.playerId} />
                <RoleSelect label="Wicketkeeper" name="keeperId" players={players} selectedValue={fixture.selections.find((selection) => selection.isWicketkeeper)?.playerId} />
                <RoleSelect label="Scorer" name="scorerId" players={players} selectedValue={fixture.selections.find((selection) => selection.isScorer)?.playerId} />
              </div>

              <div className="field">
                <span className="label">Drivers</span>
                <div className="grid gap-2 md:grid-cols-2">
                  {players.map((player) => (
                    <label className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-semibold" key={player.id}>
                      <input defaultChecked={fixture.selections.some((selection) => selection.playerId === player.id && selection.isDriver)} name="driverId" type="checkbox" value={player.id} />
                      {player.name}
                    </label>
                  ))}
                </div>
              </div>

              <button className="button button-primary" type="submit">
                Save selection
              </button>
            </form>
          </section>

          <aside className="space-y-4">
            <section className="card space-y-3">
              <h2 className="text-xl font-semibold text-slate-950">Current XI</h2>
              {fixture.selections.length === 0 ? (
                <p className="text-slate-600">No players selected yet.</p>
              ) : (
                <ol className="space-y-2">
                  {fixture.selections.map((selection, index) => (
                    <li className="rounded-2xl bg-slate-50 p-3" key={selection.id}>
                      <span className="font-bold">{index + 1}. {selection.player.name}</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selection.isCaptain ? <span className="pill">c</span> : null}
                        {selection.isWicketkeeper ? <span className="pill">wk</span> : null}
                        {selection.isScorer ? <span className="pill">scorer</span> : null}
                        {selection.isDriver ? <span className="pill">driver</span> : null}
                      </div>
                      {selection.notes ? <p className="mt-2 text-sm text-slate-600">{selection.notes}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="card space-y-3">
              <h2 className="text-xl font-semibold text-slate-950">Checks</h2>
              {issues.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 p-3 font-semibold text-emerald-800">Selection checks look good.</p>
              ) : (
                issues.map((issue) => (
                  <p className="rounded-2xl bg-amber-50 p-3 font-semibold text-amber-900" key={issue.message}>
                    {issue.message}
                  </p>
                ))
              )}
              <Link className="button button-secondary w-full" href={`/messages?fixtureId=${fixture.id}`}>
                Generate messages
              </Link>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function RoleSelect({
  label,
  name,
  players,
  selectedValue,
}: {
  label: string;
  name: string;
  players: Array<{ id: string; name: string }>;
  selectedValue?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select className="input" defaultValue={selectedValue ?? ""} id={name} name={name}>
        <option value="">Not set</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </div>
  );
}
