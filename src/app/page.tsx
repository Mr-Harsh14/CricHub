import Link from "next/link";
import { toggleTask } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function DashboardPage() {
  const [nextFixture, activePlayers, unpaidEntries] = await Promise.all([
    prisma.fixture.findFirst({
      where: { status: "UPCOMING" },
      orderBy: { date: "asc" },
      include: {
        availability: true,
        selections: true,
        adminTasks: { orderBy: [{ stage: "asc" }, { createdAt: "asc" }] },
      },
    }),
    prisma.player.count({ where: { active: true } }),
    prisma.paymentEntry.count({ where: { isExpense: false, status: { not: "PAID" } } }),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 p-8 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Captain command centre</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Run Saturday without chasing five different admin threads.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          Fixtures, availability, selection, junior checks, WhatsApp copy, result tasks, and fees in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="button button-primary" href="/fixtures">
            Add fixture
          </Link>
          <Link className="button border border-white/20 text-white hover:bg-white/10" href="/squad">
            Manage squad
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Active squad</p>
          <p className="mt-2 text-4xl font-bold text-slate-950">{activePlayers}</p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Open unpaid fees</p>
          <p className="mt-2 text-4xl font-bold text-slate-950">{unpaidEntries}</p>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-500">Next fixture</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{nextFixture?.opposition ?? "None yet"}</p>
        </div>
      </section>

      {nextFixture ? (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card space-y-5">
            <div>
              <p className="pill">{nextFixture.homeAway === "HOME" ? "Home" : "Away"}</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">{nextFixture.opposition}</h2>
              <p className="mt-2 text-slate-600">
                {formatDate(nextFixture.date)}
                {nextFixture.startTime ? ` at ${nextFixture.startTime}` : ""}
                {nextFixture.groundName ? `, ${nextFixture.groundName}` : ""}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link className="button button-secondary" href={`/availability/${nextFixture.availabilityToken}`}>
                Availability form
              </Link>
              <Link className="button button-secondary" href={`/selection?fixtureId=${nextFixture.id}`}>
                Pick XI
              </Link>
              <Link className="button button-secondary" href={`/messages?fixtureId=${nextFixture.id}`}>
                Messages
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Responses</p>
                <p className="text-3xl font-bold">{nextFixture.availability.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Selected</p>
                <p className="text-3xl font-bold">{nextFixture.selections.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Tasks done</p>
                <p className="text-3xl font-bold">
                  {nextFixture.adminTasks.filter((task) => task.isComplete).length}/{nextFixture.adminTasks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-xl font-semibold text-slate-950">Captain checklist</h2>
            {nextFixture.adminTasks.map((task) => (
              <form action={toggleTask} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3" key={task.id}>
                <input name="taskId" type="hidden" value={task.id} />
                <input name="fixtureId" type="hidden" value={nextFixture.id} />
                <div>
                  <p className="font-semibold text-slate-950">{task.label}</p>
                  <p className="text-sm text-slate-500">{task.stage === "PRE_MATCH" ? "Before match" : "After match"}</p>
                </div>
                <button className={task.isComplete ? "button button-secondary" : "button button-primary"} type="submit">
                  {task.isComplete ? "Done" : "Mark done"}
                </button>
              </form>
            ))}
          </div>
        </section>
      ) : (
        <section className="card text-center">
          <h2 className="text-2xl font-bold">Create your first fixture</h2>
          <p className="mt-2 text-slate-600">Once a fixture exists, CricHub can collect availability and generate match-week admin.</p>
          <Link className="button button-primary mt-5" href="/fixtures">
            Add fixture
          </Link>
        </section>
      )}
    </div>
  );
}
