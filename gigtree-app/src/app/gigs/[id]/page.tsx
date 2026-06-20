const gigs = [
  {
    id: "1",
    title: "Event assistant needed",
    category: "Events",
    type: "In-person",
    location: "Manchester",
    pay: "£14/hr",
    schedule: "Saturday, flexible hours",
    trust: "Verification required before applying",
    description:
      "Help with guest check-in, setup, and general event support for a weekend community event.",
    requirements: [
      "Confident speaking with guests",
      "Able to arrive on time",
      "Comfortable helping with setup and light tasks",
    ],
  },
  {
    id: "2",
    title: "Remote admin support",
    category: "Admin",
    type: "Online",
    location: "Remote UK",
    pay: "£90 fixed",
    schedule: "Complete within 3 days",
    trust: "Open to apply",
    description:
      "Support a small business with inbox sorting, spreadsheet cleanup, and basic document formatting.",
    requirements: [
      "Good written communication",
      "Comfortable with spreadsheets",
      "Able to complete work remotely",
    ],
  },
  {
    id: "3",
    title: "Weekend stockroom help",
    category: "Retail",
    type: "In-person",
    location: "Birmingham",
    pay: "£12/hr",
    schedule: "Saturday and Sunday",
    trust: "Open to apply",
    description:
      "Assist with stockroom organisation, labelling, and moving light boxes for an independent retailer.",
    requirements: [
      "Able to lift light boxes",
      "Reliable weekend availability",
      "Comfortable following instructions",
    ],
  },
  {
    id: "4",
    title: "Design a simple flyer",
    category: "Creative",
    type: "Online",
    location: "Remote UK",
    pay: "£60 fixed",
    schedule: "Due this week",
    trust: "Open to apply",
    description:
      "Create a clean digital flyer for a local service business using supplied text and brand colours.",
    requirements: [
      "Basic design experience",
      "Able to provide a digital file",
      "Can complete this week",
    ],
  },
];

export default async function GigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gig = gigs.find((item) => item.id === id);

  if (!gig) {
    return (
      <main className="min-h-screen bg-[#f6f8f4] px-6 py-10 text-[#172014]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Gig not found</h1>
          <p className="mt-3 text-[#42513c]">
            This gig does not exist or may have been removed.
          </p>
          <p className="mt-3 text-sm text-[#42513c]">Requested gig ID: {id}</p>
          <a
            href="/gigs"
            className="mt-6 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
          >
            Back to gigs
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex items-center gap-3 text-sm">
            <a href="/gigs" className="hover:underline">
              Browse gigs
            </a>
            <button className="rounded-full border border-[#172014]/20 px-4 py-2">
              Sign in
            </button>
          </div>
        </nav>

        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_420px]">
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                {gig.category}
              </span>
              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                {gig.type}
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight">{gig.title}</h1>

            <p className="mt-5 text-lg leading-8 text-[#42513c]">
              {gig.description}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="text-sm font-semibold text-[#42513c]">Location</p>
                <p className="mt-1 font-bold">{gig.location}</p>
              </div>
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="text-sm font-semibold text-[#42513c]">Pay</p>
                <p className="mt-1 font-bold">{gig.pay}</p>
              </div>
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="text-sm font-semibold text-[#42513c]">Timing</p>
                <p className="mt-1 font-bold">{gig.schedule}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold">Requirements</h2>
              <ul className="mt-4 space-y-3">
                {gig.requirements.map((requirement) => (
                  <li
                    key={requirement}
                    className="rounded-2xl border border-black/10 p-4 text-[#42513c]"
                  >
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-2xl bg-[#e8f0e4] p-5">
              <p className="font-semibold text-[#2f6f3e]">Trust status</p>
              <p className="mt-2 text-[#42513c]">{gig.trust}</p>
            </div>
          </article>

          <aside className="rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-2xl font-bold">Apply for this gig</h2>
            <p className="mt-2 text-sm leading-6 text-[#42513c]">
              This is the first version of the application form. Later, it will
              connect to user accounts, CV uploads, and admin review.
            </p>

            <form className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-semibold">Full name</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Email address</label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Availability</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="When are you available?"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Relevant experience
                </label>
                <textarea
                  className="mt-2 min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3 outline-none"
                  placeholder="Briefly describe relevant experience"
                />
              </div>

              <label className="flex gap-3 rounded-2xl bg-[#f6f8f4] p-4 text-sm text-[#42513c]">
                <input type="checkbox" className="mt-1" />
                <span>
                  I confirm I meet the requirements and understand that Gigtree
                  may review my application before recommending me.
                </span>
              </label>

              <button
                type="button"
                className="w-full rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
              >
                Submit application
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
