import { supabase } from "@/lib/supabase";

type Gig = {
  id: string;
  title: string;
  description: string;
  category: string;
  trust_level: "low" | "medium" | "high";
  location_type: "online" | "in_person";
  location_area: string | null;
  pay_type: "hourly" | "fixed";
  hourly_rate: number | null;
  fixed_amount: number | null;
  currency: string;
  schedule_summary: string | null;
};

function formatPay(gig: Gig) {
  if (gig.pay_type === "hourly" && gig.hourly_rate) {
    return `£${gig.hourly_rate}/hr`;
  }

  if (gig.pay_type === "fixed" && gig.fixed_amount) {
    return `£${gig.fixed_amount} fixed`;
  }

  return "Pay TBC";
}

function formatLocationType(type: Gig["location_type"]) {
  return type === "in_person" ? "In-person" : "Online";
}

function formatTrustLevel(level: Gig["trust_level"]) {
  if (level === "high") return "Verification required before applying";
  if (level === "medium") return "Extra checks may be required";
  return "Open to apply";
}

export default async function GigsPage() {
  const { data: gigs, error } = await supabase
    .from("gigs")
    .select(
      "id,title,description,category,trust_level,location_type,location_area,pay_type,hourly_rate,fixed_amount,currency,schedule_summary"
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#f6f8f4] px-6 py-10 text-[#172014]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Could not load gigs</h1>
          <p className="mt-3 text-[#42513c]">{error.message}</p>
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
            <a href="/" className="hidden sm:inline hover:underline">
              Home
            </a>
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
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
            These gigs are now loading from your Supabase database.
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
          {(gigs ?? []).map((gig) => (
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
                      {formatLocationType(gig.location_type)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">{gig.title}</h2>
                  <p className="mt-2 text-[#42513c]">{gig.description}</p>

                  <div className="mt-4 grid gap-2 text-sm text-[#42513c] sm:grid-cols-3">
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Location:
                      </span>{" "}
                      {gig.location_area ?? "Remote UK"}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Pay:
                      </span>{" "}
                      {formatPay(gig)}
                    </p>
                    <p>
                      <span className="font-semibold text-[#172014]">
                        Timing:
                      </span>{" "}
                      {gig.schedule_summary ?? "Flexible"}
                    </p>
                  </div>

                  <p className="mt-4 text-sm font-medium text-[#2f6f3e]">
                    {formatTrustLevel(gig.trust_level)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-row gap-2 md:flex-col md:justify-center">
                  <button className="rounded-full border border-black/10 px-5 py-3 font-semibold">
                    Save
                  </button>
                  <a
                    href={`/gigs/${gig.id}`}
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                  >
                    View & apply
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
