import { SignOutButton } from "@/components/sign-out-button";

const dashboardCards = [
  {
    title: "Worker profile",
    description: "Edit your skills, availability, experience, and CV details.",
    href: "/profile",
    action: "Edit profile",
  },
  {
    title: "Browse gigs",
    description: "Find local and online opportunities across the UK.",
    href: "/gigs",
    action: "Browse gigs",
  },
  {
    title: "My applications",
    description: "Track gigs you have applied for and see current statuses.",
    href: "/applications",
    action: "View applications",
  },
  {
    title: "Post a gig request",
    description: "Request approval to post gigs through Gigtree.",
    href: "#",
    action: "Request access",
  },
  {
    title: "Payments",
    description: "View held payments, pending verification, and payout status.",
    href: "#",
    action: "Coming soon",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/gigs" className="hidden sm:inline hover:underline">
              Browse gigs
            </a>
            <SignOutButton />
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Dashboard</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Manage your Gigtree account.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Manage your profile, applications, posting requests, and payments
            from one simple place.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {dashboardCards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-2xl font-bold">{card.title}</h2>
              <p className="mt-3 text-[#42513c]">{card.description}</p>
              <div className="mt-6 inline-flex rounded-full bg-[#2f6f3e] px-5 py-3 text-sm font-semibold text-white">
                {card.action}
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-[#e8f0e4] p-6">
          <p className="font-semibold text-[#2f6f3e]">MVP status</p>
          <h2 className="mt-2 text-2xl font-bold">
            Next: poster access requests and admin tools
          </h2>
          <p className="mt-3 text-[#42513c]">
            The worker side is now taking shape: accounts, profiles, CV upload,
            applications, and saved application history.
          </p>
        </div>
      </section>
    </main>
  );
}
