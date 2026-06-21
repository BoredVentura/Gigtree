import { supabase } from "@/lib/supabase";

type Gig = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location_type: "remote" | "in_person" | "hybrid";
  location_area: string | null;
  pay_type: "hourly" | "fixed";
  hourly_rate: number | null;
  fixed_amount: number | null;
  schedule_summary: string | null;
  status: string;
  created_at: string;
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

function formatLocation(gig: Gig) {
  if (gig.location_type === "remote") return "Remote";
  if (gig.location_type === "hybrid") {
    return `Hybrid${gig.location_area ? ` · ${gig.location_area}` : ""}`;
  }
  return gig.location_area ?? "In person";
}

function trimDescription(description: string | null) {
  if (!description) return "No description provided yet.";

  if (description.length <= 170) return description;

  return `${description.slice(0, 170)}...`;
}

export default async function GigsPage() {
  const { data, error } = await supabase
    .from("gigs")
    .select(
      "id,title,description,category,location_type,location_area,pay_type,hourly_rate,fixed_amount,schedule_summary,status,created_at"
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const gigs = (data ?? []) as Gig[];

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/dashboard" className="hover:underline">
              Dashboard
            </a>
            <a href="/applications" className="hover:underline">
              My applications
            </a>
            <a href="/profile" className="hover:underline">
              Worker profile
            </a>
          </div>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Browse gigs</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Find local and remote gigs.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#42513c]">
            Apply privately. Gigtree reviews applications before posters see
            anonymous candidate summaries.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-3xl bg-white p-6 text-[#42513c] shadow-sm">
            {error.message}
          </div>
        )}

        {!error && gigs.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">No open gigs yet</h2>
            <p className="mt-3 text-[#42513c]">
              Open gigs will appear here once approved posters publish them.
            </p>
            <a
              href="/dashboard"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              Go to dashboard
            </a>
          </div>
        )}

        <div className="grid gap-5">
          {gigs.map((gig) => (
            <article
              key={gig.id}
              className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                      {gig.category}
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                      Apply privately
                    </span>
                    <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-semibold">
                      Posted {new Date(gig.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">{gig.title}</h2>

                  <p className="mt-3 max-w-3xl leading-7 text-[#42513c]">
                    {trimDescription(gig.description)}
                  </p>

                  <div className="mt-5 grid gap-3 text-sm text-[#42513c] sm:grid-cols-3">
                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      <span className="block font-semibold text-[#172014]">
                        Pay
                      </span>
                      {formatPay(gig)}
                    </p>

                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      <span className="block font-semibold text-[#172014]">
                        Location
                      </span>
                      {formatLocation(gig)}
                    </p>

                    <p className="rounded-2xl bg-[#f6f8f4] p-4">
                      <span className="block font-semibold text-[#172014]">
                        Timing
                      </span>
                      {gig.schedule_summary ?? "Flexible"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 md:justify-center">
                  <a
                    href={`/gigs/${gig.id}`}
                    className="rounded-full bg-[#2f6f3e] px-5 py-3 text-center font-semibold text-white"
                  >
                    View and apply
                  </a>
                  <a
                    href="/profile"
                    className="rounded-full border border-black/10 px-5 py-3 text-center font-semibold hover:bg-[#f6f8f4]"
                  >
                    Improve profile
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
