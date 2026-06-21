import { SiteHeader } from "@/components/site-header";

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#b9f36b]/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#7ed957]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#ffe08a]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="safety" />

          <div className="grid gap-8 py-16 lg:grid-cols-[1fr_380px]">
            <div>
              <p className="font-semibold text-[#2f6f3e]">Safety</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Gigtree is built around safer gig matching.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#42513c]">
                Gigtree uses admin review, controlled contact, completion checks,
                and worker verification to reduce risk for both posters and
                workers.
              </p>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
              <h2 className="text-2xl font-black">Core safety promise</h2>
              <p className="mt-3 leading-7 text-[#42513c]">
                Contact details should only open after a poster selects a worker
                and the worker accepts. Payments should only be released after
                completion and verification checks.
              </p>

              <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
                <a href="/profile" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                  Worker profile →
                </a>
                <a href="/verification" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                  Worker verification →
                </a>
                <a href="/contacts" className="rounded-2xl bg-[#f6f8f4] p-4 font-semibold hover:bg-[#e8f0e4]">
                  Temporary contacts →
                </a>
              </div>
            </aside>
          </div>

          <div className="grid gap-8 pb-16">
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                <p className="font-semibold text-[#b9f36b]">Private first</p>
                <h2 className="mt-2 text-3xl font-black">Anonymous recommendations</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Posters first see admin-written candidate summaries, not a
                  worker’s full identity, CV, or contact details.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Controlled contact</p>
                <h2 className="mt-2 text-3xl font-black">Contact opens later</h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  Temporary contact details are only intended to open once a
                  poster selects a candidate and the worker confirms.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Payment checks</p>
                <h2 className="mt-2 text-3xl font-black">Release is reviewed</h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  Payouts should depend on poster completion confirmation, admin
                  review, and worker verification.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">For workers</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Do not share your CV, ID documents, home address, banking
                  details, or private contact details directly with posters
                  unless Gigtree has clearly opened the correct step.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  For in-person gigs, agree the location and timing clearly.
                  Avoid unsafe locations, unclear requests, or anything that
                  feels outside the agreed gig.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Keep your profile accurate. Skills, availability, location,
                  experience, and verification help Gigtree recommend you fairly.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  If a poster asks you to move away from the agreed process,
                  requests extra unpaid work, or makes you uncomfortable, pause
                  and ask Gigtree for help.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">For posters</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Describe the gig honestly, including the work, pay, location,
                  timing, expectations, and any important safety details.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Do not ask workers for unnecessary sensitive information.
                  Gigtree keeps worker documents and CVs controlled through the
                  review process.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Use the recommended candidate summaries to choose a suitable
                  worker, then wait for worker acceptance before contacting them.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Confirm completion only when the agreed work has been
                  completed. Admin review may still be required before payout
                  release.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
              <h2 className="text-3xl font-black">Important note</h2>
              <p className="mt-4 max-w-4xl leading-8 text-white/75">
                This page is practical safety guidance for the Gigtree MVP. It is
                not legal advice and does not replace final legal terms, insurance,
                safeguarding checks, employment classification review, or local
                regulatory requirements.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
