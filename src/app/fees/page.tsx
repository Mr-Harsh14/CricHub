import { createExpense, createFeesForSelection, updatePayment } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { formatCurrencyFromPence, formatDate } from "@/lib/format";

type FeesPageProps = {
  searchParams: Promise<{ fixtureId?: string }>;
};

export default async function FeesPage({ searchParams }: FeesPageProps) {
  const { fixtureId } = await searchParams;
  const fixtures = await prisma.fixture.findMany({ orderBy: { date: "asc" } });
  const selectedFixtureId = fixtureId ?? fixtures[0]?.id;
  const fixture = selectedFixtureId
    ? await prisma.fixture.findUnique({
        where: { id: selectedFixtureId },
        include: {
          payments: { orderBy: [{ isExpense: "asc" }, { playerName: "asc" }] },
          selections: { include: { player: true } },
          adminTasks: { where: { stage: "POST_MATCH" } },
        },
      })
    : null;

  const playerFees = fixture?.payments.filter((payment) => !payment.isExpense) ?? [];
  const expenses = fixture?.payments.filter((payment) => payment.isExpense) ?? [];
  const totalDue = playerFees.reduce((sum, payment) => sum + payment.feeOwedPence, 0);
  const totalPaid = playerFees.reduce((sum, payment) => sum + payment.amountPaidPence, 0);
  const totalExpenses = expenses.reduce((sum, payment) => sum + payment.amountPaidPence, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="pill">Post-match money</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Match fees and expenses</h1>
          <p className="mt-2 text-slate-600">Log who has paid, plus panel umpire or scorer expenses.</p>
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
        <div className="card text-slate-600">Create a fixture before logging fees.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card">
                <p className="text-sm font-semibold text-slate-500">Due</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrencyFromPence(totalDue)}</p>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-slate-500">Paid</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrencyFromPence(totalPaid)}</p>
              </div>
              <div className="card">
                <p className="text-sm font-semibold text-slate-500">Expenses</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrencyFromPence(totalExpenses)}</p>
              </div>
            </div>

            <section className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-950">Player fees</h2>
              {playerFees.length === 0 ? (
                <p className="text-slate-600">Generate fee rows from the selected XI.</p>
              ) : (
                <div className="grid gap-3">
                  {playerFees.map((payment) => (
                    <form action={updatePayment} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_0.7fr_0.7fr_0.8fr_auto]" key={payment.id}>
                      <input name="paymentId" type="hidden" value={payment.id} />
                      <div>
                        <p className="font-bold text-slate-950">{payment.playerName}</p>
                        <p className="text-sm text-slate-600">Owes {formatCurrencyFromPence(payment.feeOwedPence)}</p>
                      </div>
                      <input className="input" defaultValue={(payment.amountPaidPence / 100).toFixed(2)} name="amountPaid" placeholder="Paid" />
                      <select className="input" defaultValue={payment.status} name="status">
                        <option value="UNPAID">Unpaid</option>
                        <option value="PART_PAID">Part paid</option>
                        <option value="PAID">Paid</option>
                      </select>
                      <input className="input" defaultValue={payment.method ?? ""} name="method" placeholder="Bank/cash" />
                      <button className="button button-primary" type="submit">
                        Save
                      </button>
                      <input className="input md:col-span-5" defaultValue={payment.notes ?? ""} name="notes" placeholder="Reference or note" />
                    </form>
                  ))}
                </div>
              )}
            </section>

            <section className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-950">Expenses</h2>
              {expenses.length === 0 ? <p className="text-slate-600">No expenses logged yet.</p> : null}
              {expenses.map((expense) => (
                <div className="rounded-2xl bg-slate-50 p-4" key={expense.id}>
                  <p className="font-bold text-slate-950">{expense.playerName}</p>
                  <p className="text-slate-600">
                    {formatCurrencyFromPence(expense.amountPaidPence)}
                    {expense.method ? ` via ${expense.method}` : ""}
                  </p>
                  {expense.notes ? <p className="mt-2 text-sm text-slate-600">{expense.notes}</p> : null}
                </div>
              ))}
            </section>
          </section>

          <aside className="space-y-4">
            <section className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-950">Create fee rows</h2>
              <p className="text-sm text-slate-600">Uses the saved selected XI for this fixture.</p>
              <form action={createFeesForSelection} className="grid gap-3">
                <input name="fixtureId" type="hidden" value={fixture.id} />
                <div className="field">
                  <label htmlFor="feeOwed">Match fee per player</label>
                  <input className="input" defaultValue="10.00" id="feeOwed" name="feeOwed" />
                </div>
                <button className="button button-primary" type="submit">
                  Generate from XI
                </button>
              </form>
            </section>

            <section className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-950">Log expense</h2>
              <form action={createExpense} className="grid gap-3">
                <input name="fixtureId" type="hidden" value={fixture.id} />
                <div className="field">
                  <label htmlFor="label">Label</label>
                  <input className="input" id="label" name="label" placeholder="Panel umpire" />
                </div>
                <div className="field">
                  <label htmlFor="amountPaid">Amount paid</label>
                  <input className="input" id="amountPaid" name="amountPaid" placeholder="50.00" />
                </div>
                <div className="field">
                  <label htmlFor="method">Method</label>
                  <input className="input" id="method" name="method" placeholder="Cash" />
                </div>
                <div className="field">
                  <label htmlFor="notes">Notes</label>
                  <textarea className="input min-h-20" id="notes" name="notes" />
                </div>
                <button className="button button-primary" type="submit">
                  Add expense
                </button>
              </form>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
