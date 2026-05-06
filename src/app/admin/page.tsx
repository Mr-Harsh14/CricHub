import Link from "next/link";
import { toggleTask } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

type AdminPageProps = {
  searchParams: Promise<{ fixtureId?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { fixtureId } = await searchParams;
  const fixtures = await prisma.fixture.findMany({ orderBy: { date: "asc" } });
  const selectedFixtureId = fixtureId ?? fixtures[0]?.id;
  const fixture = selectedFixtureId
    ? await prisma.fixture.findUnique({
        where: { id: selectedFixtureId },
        include: { adminTasks: { orderBy: [{ stage: "asc" }, { createdAt: "asc" }] } },
      })
    : null;

  const preMatchTasks = fixture?.adminTasks.filter((task) => task.stage === "PRE_MATCH") ?? [];
  const postMatchTasks = fixture?.adminTasks.filter((task) => task.stage === "POST_MATCH") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="pill">Match admin</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Before and after checklist</h1>
          <p className="mt-2 text-slate-600">Track the jobs that usually get scattered across WhatsApp, scorebooks, and league sites.</p>
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
        <div className="card text-slate-600">Create a fixture before tracking admin.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="space-y-4">
            <TaskSection fixtureId={fixture.id} title="Before the Match" tasks={preMatchTasks} />
            <TaskSection fixtureId={fixture.id} title="After the Match" tasks={postMatchTasks} />
          </section>

          <aside className="space-y-4">
            <section className="card space-y-3">
              <h2 className="text-xl font-semibold text-slate-950">Result workflow</h2>
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">
                <p className="font-bold">If scored on Play-Cricket Scorer</p>
                <p className="mt-1">Confirm the scorecard has uploaded. Cherwell should receive the result through the scoring flow.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-bold">If scored in a scorebook</p>
                <p className="mt-1">Submit the Cherwell result on match day, then complete Play-Cricket manually by Monday.</p>
              </div>
            </section>

            <section className="card space-y-3">
              <h2 className="text-xl font-semibold text-slate-950">Quick links</h2>
              <Link className="button button-secondary w-full" href={`/messages?fixtureId=${fixture.id}`}>
                Generate post-match message
              </Link>
              <Link className="button button-secondary w-full" href={`/fees?fixtureId=${fixture.id}`}>
                Log match fees
              </Link>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function TaskSection({
  fixtureId,
  title,
  tasks,
}: {
  fixtureId: string;
  title: string;
  tasks: Array<{ id: string; label: string; details: string | null; isComplete: boolean }>;
}) {
  return (
    <section className="card space-y-4">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      {tasks.length === 0 ? <p className="text-slate-600">No tasks yet.</p> : null}
      {tasks.map((task) => (
        <form action={toggleTask} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4" key={task.id}>
          <input name="taskId" type="hidden" value={task.id} />
          <input name="fixtureId" type="hidden" value={fixtureId} />
          <div>
            <p className="font-semibold text-slate-950">{task.label}</p>
            {task.details ? <p className="text-sm text-slate-500">{task.details}</p> : null}
          </div>
          <button className={task.isComplete ? "button button-secondary" : "button button-primary"} type="submit">
            {task.isComplete ? "Done" : "Mark done"}
          </button>
        </form>
      ))}
    </section>
  );
}
