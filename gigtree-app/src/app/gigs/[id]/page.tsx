import { ApplyForm } from "@/components/apply-form";
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

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
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
      "id,title,description,category,location_type,location_area,pay_type,hourly_rate,fixed_amount,schedule_summary,status,created_at"
    )
    .eq("id", id)
    .single();

  if (error || !gig) {
    return (
      <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
        <section className="mx-auto max-w-4xl px-6 py-8">
          <nav className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold tracking-tight">
              Gigtree
            </a>
            <a href="/gigs" className="text-sm hover:underline">
              Browse gigs
            </a>
          </nav>

          <div className="mt-12 rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-black">Gig not found</h1>
            <p className="mt-3 text-[#42513c]">
              This gig may have been removed or is no longer available.
            </p>
            <a
              href="/gigs"
              className="mt-5 inline-block rounded-full bg-[#2f6f3e] px-5 py-3 font-semibold text-white"
            >
              Browse gigs
            </a>
          </div>
        </section>
      </main>
    );
  }

  const loadedGig = gig as Gig;

  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/gigs" className="hover:underline">
              Browse gigs
            </a>
            <a href="/applications" className="hover:underline">
              My applications
            </a>
            <a href="/dashboard" className="hover:underline">
              Dashboard
            </a>
          </div>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-[#e8f0e4] px-3 py-1 font-semibold text-[#2f6f3e]">
                {loadedGig.category}
              </span>
              <span className="rounded-full bg-white px-3 py-1 font-semibold">
                {formatStatus(loadedGig.status)}
              </span>
              <span className="rounded-full bg-white px-3 py-1 font-semibold">
                Posted {new Date(loadedGig.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
              {loadedGig.title}
            </h1>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#42513c]">Pay</p>
                <p className="mt-1 text-2xl font-black text-[#2f6f3e]">
                  {formatPay(loadedGig)}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#42513c]">
                  Location
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatLocation(loadedGig)}
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-[#42513c]">Timing</p>
                <p className="mt-1 text-xl font-bold">
                  {loadedGig.schedule_summary ?? "Flexible"}
                </p>
              </div>
            </div>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">About this gig</h2>
              <p className="mt-4 whitespace-pre-wrap leading-8 text-[#42513c]">
                {loadedGig.description ?? "No description provided yet."}
              </p>
            </section>

            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold">How Gigtree protects you</h2>
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">1. Apply privately</p>
                  <p className="mt-1 text-[#42513c]">
                    Your direct contact details are not shown to the poster when
                    you apply.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">2. Admin reviews applications</p>
                  <p className="mt-1 text-[#42513c]">
                    Gigtree admin reviews applicants and sends anonymous
                    candidate summaries to the poster.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">3. You confirm before contact</p>
                  <p className="mt-1 text-[#42513c]">
                    If the poster selects you, you still get to accept or
                    decline before contact details are revealed.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f6f8f4] p-4">
                  <p className="font-semibold">4. Payment and verification</p>
                  <p className="mt-1 text-[#42513c]">
                    Payouts are only released after completion and worker
                    verification checks.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Apply for this gig</h2>
            <p className="mt-3 text-[#42513c]">
              Tell Gigtree why you are suitable. Admin will review your
              application before the poster sees an anonymous summary.
            </p>

            <div className="my-5 rounded-2xl bg-[#e8f0e4] p-4 text-sm text-[#42513c]">
              You stay anonymous to the poster until selection and confirmation.
            </div>

            <ApplyForm gigId={loadedGig.id} />

            <div className="mt-5 border-t border-black/10 pt-5 text-sm text-[#42513c]">
              <p>
                Need to improve your profile first?{" "}
                <a href="/profile" className="font-semibold text-[#2f6f3e] underline">
                  Edit worker profile
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
