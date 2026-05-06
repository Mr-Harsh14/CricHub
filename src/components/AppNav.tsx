import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/squad", label: "Squad" },
  { href: "/availability", label: "Availability" },
  { href: "/selection", label: "Selection" },
  { href: "/messages", label: "Messages" },
  { href: "/admin", label: "Admin" },
  { href: "/fees", label: "Fees" },
];

export function AppNav() {
  return (
    <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-slate-950">
          CricHub
        </Link>
        <div className="flex flex-wrap gap-2">
          {links.map((link) => (
            <Link className="nav-link" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
