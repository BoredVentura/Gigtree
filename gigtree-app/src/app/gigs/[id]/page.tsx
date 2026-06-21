import { supabase } from "@/lib/supabase";
import { ApplyForm } from "@/components/apply-form";

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
  requirements: string[];
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

export default async function GigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: gig, error } = await supabase
    .from("gigs")
    .select(
      "id,title,description,category,trust_level,location_type,location_area,pay_type,hourly_rate,fixed_amount,currency,schedule_summary,requirements"
    )
    .eq("id", id)
    .eq("status", "open")
    .single();

  if (error || !gig) {
    return (
      <main className="min-h-screen bg-[#f6f8f4] px-6 py-10 text-[#172014]">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Gig not found</h1>
          <p className="mt-3 text-[#42513c]">
            This gig does not exist, is not open, or may have been removed.
          </p>
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
            <a href="/dashboard" className="hidden sm:inline hover:underline">
              Dashboard
            </a>
            <a
              href="/login"
              className="rounded-full border border-[#172014]/20 px-4 py-2"
            >
              Sign in
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-10 lg:grid-cols-[1fr_420px]">
          <article className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-medium text-[#2f6f3e]">
                {gig.category}
              </span>
              <span className="rounded-full bg-[#f6f8f4] px-3 py-1 font-medium">
                {formatLocationType(gig.location_type)}
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight">{gig.title}</h1>

            <p className="mt-5 text-lg leading-8 text-[#42513c]">
              {gig.description}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="text-sm font-semibold text-[#42513c]">Location</p>
                <p className="mt-1 font-bold">
                  {gig.location_area ?? "Remote UK"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="text-sm font-semibold text-[#42513c]">Pay</p>
                <p className="mt-1 font-bold">{formatPay(gig)}</p>
              </div>
              <div className="rounded-2xl bg-[#f6f8f4] p-4">
                <p className="text-sm font-semibold text-[#42513c]">Timing</p>
                <p className="mt-1 font-bold">
                  {gig.schedule_summary ?? "Flexible"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold">Requirements</h2>
              <ul className="mt-4 space-y-3">
                {(gig.requirements ?? []).map((requirement) => (
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
              <p className="mt-2 text-[#42513c]">
                {formatTrustLevel(gig.trust_level)}
              </p>
            </div>
          </article>

          <aside className="rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:self-start">
            <h2 className="text-2xl font-bold">Apply for this gig</h2>
            <p className="mt-2 text-sm leading-6 text-[#42513c]">
              Submit your availability and relevant experience. Gigtree will
              review applications before making recommendations.
            </p>

            <ApplyForm gigId={gig.id} />
          </aside>
        </div>
      </section>
    </main>
  );
}
