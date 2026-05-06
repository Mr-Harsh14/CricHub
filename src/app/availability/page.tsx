import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AvailabilityPage() {
  const fixtures = await prisma.fixture.findMany({
    orderBy: { date: "asc" },
    include: { availability: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="pill">Availability links</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Collect responses</h1>
        <p className="mt-2 text-slate-600">Copy these fixture links into WhatsApp using the generated message text.</p>
      </div>

      <section className="grid gap-4">
        {fixtures.length === 0 ? (
          <div className="card text-slate-600">Create a fixture first.</div>
        ) : (
          fixtures.map((fixture) => {
            const available = fixture.availability.filter((response) => response.status === "AVAILABLE").length;
            const maybe = fixture.availability.filter((response) => response.status === "MAYBE").length;
            const unavailable = fixture.availability.filter((response) => response.status === "UNAVAILABLE").length;

            return (
              <article className="card space-y-4" key={fixture.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-950">{fixture.opposition}</h2>
                    <p className="text-slate-600">
                      {formatDate(fixture.date)}
                      {fixture.startTime ? `, ${fixture.startTime}` : ""}
                    </p>
                  </div>
                  <Link className="button button-primary" href={`/availability/${fixture.availabilityToken}`}>
                    Open form
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="pill">{available} available</span>
                  <span className="pill">{maybe} maybe</span>
                  <span className="pill">{unavailable} unavailable</span>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
