const gigs = [
  {
    id: 1,
    title: "Event assistant needed",
    category: "Events",
    type: "In-person",
    location: "Manchester",
    pay: "£14/hr",
    schedule: "Saturday, flexible hours",
    trust: "Verification required before applying",
    description:
      "Help with guest check-in, setup, and general event support for a weekend community event.",
  },
  {
    id: 2,
    title: "Remote admin support",
    category: "Admin",
    type: "Online",
    location: "Remote UK",
    pay: "£90 fixed",
    schedule: "Complete within 3 days",
    trust: "Open to apply",
    description:
      "Support a small business with inbox sorting, spreadsheet cleanup, and basic document formatting.",
  },
  {
    id: 3,
    title: "Weekend stockroom help",
    category: "Retail",
    type: "In-person",
    location: "Birmingham",
    pay: "£12/hr",
    schedule: "Saturday and Sunday",
    trust: "Open to apply",
    description:
      "Assist with stockroom organisation, labelling, and moving light boxes for an independent retailer.",
  },
  {
    id: 4,
    title: "Design a simple flyer",
    category: "Creative",
    type: "Online",
    location: "Remote UK",
    pay: "£60 fixed",
    schedule: "Due this week",
    trust: "Open to apply",
    description:
      "Create a clean digital flyer for a local service business using supplied text and brand colours.",
  },
];

export default function GigsPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/" className="hidden sm:inline hover:underline">
              Home
            </a>
            <button className="rounded-full border border-[#172014]/20 px-4 py-2">
              Sign in
            </button>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Browse gigs</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Find local and online opportunities across the UK.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Browse early Gigtree opportunities. Apply with your profile, then
            Gigtree reviews applications and recommends the strongest matches.
          </p>
        </div>

        <div className="mb-8 grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-4">
          <input
            placeholder="Search gigs"
            className="rounded-2xl border border-black/10 px-4 py-3 outline-none"
          />
          <select className="rounded-2xl border border-black/10 px-4 py-3 outline-none">
            <option>All categories</option>
            <option>Events</option>
            <option>Admin</option>
            <option>Retail</option>
            <option>Creative</option>
          </select>
          <select className="rounded-2xl border border-black/10 px-4 py-3 outline-none">
            <option>Online or in-person</option>
            <option>Online</option>
            <option>In-person</option>
          </select>
          <button className="rounded-2xl bg-[#2f6f3e] px-4 py-3 font-semibold text-white">
            Search
          </button>
        </div>

        <div className="grid gap-5">
          {gigs.map((gig) => (
            <article
              key={gig.id}
              className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                      {gig.category}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                      {gig.type}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">{gig.title}</h2>
                  <p className="mt-2 text-[#42513c]">{gig.description}</p>

                  <div className="mt-4 grid gap-2 text-sm text-[#42513c] sm:grid-cols-3">
                    <p>
                      <span className="font-semibold text-[#172014]">Location:</span>{" "}
                      {gig.location}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">Pay:</span>{" "}
                      {gig.pay}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">Timing:</span>{" "}
                      {gig.schedule}
                    </p>
                  </div>

                  <p className="mt-4 text-sm font-medium text-[#2f6f3e]">
                    {gig.trust}
                  </p>
                </div>

                <div className="flex shrink-0 flex-row gap-2 md:flex-col md:justify-center">
                  <button className="rounded-full border border-black/10 px-5 py-3 font-semibold">
                    Save
                  </button>
                  <button className="rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white">
                    Apply
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
