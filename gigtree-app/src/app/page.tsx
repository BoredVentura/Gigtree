const featuredGigs = [
  {
    title: "Event assistant needed",
    type: "In-person",
    location: "Manchester",
    pay: "£14/hr",
    trust: "Verification required",
  },
  {
    title: "Remote admin support",
    type: "Online",
    location: "Remote UK",
    pay: "£90 fixed",
    trust: "Open to apply",
  },
  {
    title: "Weekend stockroom help",
    type: "In-person",
    location: "Birmingham",
    pay: "£12/hr",
    trust: "Open to apply",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">Gigtree</div>
          <div className="flex items-center gap-3 text-sm">
            <a href="/gigs" className="hidden sm:inline hover:underline">Browse gigs</a>
            <a href="#how" className="hidden sm:inline hover:underline">How it works</a>
            <a href="/login" className="rounded-full border border-[#172014]/20 px-4 py-2">Sign in</a>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm">
              UK local and online gigs
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              Find flexible gigs. Grow with Gigtree.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#42513c]">
              Gigtree connects workers with local and online opportunities through a trusted, admin-reviewed process.
              Apply with your profile, get recommended for the right gigs, and get paid securely.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/gigs" className="rounded-full bg-[#2f6f3e] px-6 py-3 text-center font-semibold text-white shadow-sm">
                Browse gigs
              </a>
              <a href="#post" className="rounded-full bg-white px-6 py-3 text-center font-semibold shadow-sm">
                Post a gig
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-xl">
            <div className="rounded-[1.5rem] bg-[#e8f0e4] p-5">
              <p className="text-sm font-semibold text-[#2f6f3e]">Managed marketplace</p>
              <h2 className="mt-3 text-3xl font-bold">Safer matching for flexible work</h2>
              <p className="mt-4 text-[#42513c]">
                Admins review applicants, recommend anonymous candidates, and control verification before payouts are released.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-black/10 p-4">
                <p className="font-semibold">Verified payout flow</p>
                <p className="text-sm text-[#42513c]">Payment is held until completion is confirmed.</p>
              </div>
              <div className="rounded-2xl border border-black/10 p-4">
                <p className="font-semibold">Anonymous recommendations</p>
                <p className="text-sm text-[#42513c]">Posters see admin-written summaries before choosing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="gigs" className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-semibold text-[#2f6f3e]">Featured gigs</p>
              <h2 className="mt-2 text-3xl font-bold">Browse early opportunities</h2>
            </div>
            <button className="rounded-full border border-black/10 px-5 py-3 font-semibold">
              View all gigs
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredGigs.map((gig) => (
              <article key={gig.title} className="rounded-3xl border border-black/10 bg-[#f6f8f4] p-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="rounded-full bg-white px-3 py-1 font-medium">{gig.type}</span>
                  <span>{gig.pay}</span>
                </div>
                <h3 className="text-xl font-bold">{gig.title}</h3>
                <p className="mt-2 text-[#42513c]">{gig.location}</p>
                <p className="mt-4 text-sm font-medium text-[#2f6f3e]">{gig.trust}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-semibold text-[#2f6f3e]">How it works</p>
          <h2 className="mt-2 text-3xl font-bold">Simple, trusted, admin-managed</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#2f6f3e]">01</p>
              <h3 className="mt-3 text-xl font-bold">Workers apply</h3>
              <p className="mt-2 text-[#42513c]">Workers create profiles, upload CVs, and apply with structured details.</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#2f6f3e]">02</p>
              <h3 className="mt-3 text-xl font-bold">Admin recommends</h3>
              <p className="mt-2 text-[#42513c]">Gigtree reviews applicants and sends anonymous candidate summaries to posters.</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-[#2f6f3e]">03</p>
              <h3 className="mt-3 text-xl font-bold">Payment is released</h3>
              <p className="mt-2 text-[#42513c]">Funds are released after completion confirmation and required verification.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
