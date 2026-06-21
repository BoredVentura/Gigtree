export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#b9f36b]/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#7ed957]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#ffe08a]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <nav className="flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f6f3e] text-xl text-white shadow-lg shadow-[#2f6f3e]/20">
                ✦
              </span>
              <span className="text-2xl font-black tracking-tight">Gigtree</span>
            </a>

            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
              <a href="/safety" className="rounded-full px-4 py-2 hover:bg-white">
                Safety
              </a>
              <a href="/terms" className="rounded-full px-4 py-2 hover:bg-white">
                Terms
              </a>
              <a href="/dashboard" className="rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]">
                Dashboard
              </a>
            </div>
          </nav>

          <div className="grid gap-8 py-16 lg:grid-cols-[1fr_380px]">
            <div>
              <p className="font-semibold text-[#2f6f3e]">Privacy</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Privacy matters in every gig flow.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#42513c]">
                Gigtree is designed so workers can apply without immediately
                exposing their full identity, contact details, CV, or verification
                documents to posters.
              </p>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
              <h2 className="text-2xl font-black">Plain-English summary</h2>
              <p className="mt-3 leading-7 text-[#42513c]">
                Admin review sits between workers and posters. Sensitive worker
                details should stay controlled until the right stage of the gig.
              </p>

              <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  CVs are for admin review first.
                </p>
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  Verification documents are not shown to posters.
                </p>
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  Contact details open only after selection and acceptance.
                </p>
              </div>
            </aside>
          </div>

          <div className="grid gap-8 pb-16">
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                <p className="font-semibold text-[#b9f36b]">Controlled visibility</p>
                <h2 className="mt-2 text-3xl font-black">Not everything is public</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Workers are not displayed as public profiles to posters by
                  default. Admin summaries protect the early matching stage.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Sensitive documents</p>
                <h2 className="mt-2 text-3xl font-black">CV and ID control</h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  CVs and verification documents should be used for review,
                  verification, and trust—not public browsing.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Temporary contact</p>
                <h2 className="mt-2 text-3xl font-black">Contact opens later</h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  Posters and workers should only receive contact details after
                  selection, worker acceptance, and the correct Gigtree step.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">Information Gigtree may collect</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Account details such as your name, email address, phone number,
                  age confirmation, and account settings.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Worker profile details such as skills, experience, location
                  area, availability, portfolio links, and CV file references.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Poster and gig details such as gig title, category, description,
                  location, timing, pay, and application/recommendation records.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Verification details such as legal name, date of birth, address,
                  document type, uploaded document reference, review notes, and
                  verification status.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Payment and completion records such as held payment status,
                  commission, payout amount, completion confirmations, and admin
                  release decisions.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Admin and audit records that help Gigtree track important
                  decisions and maintain accountability.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">How information is used</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  To help workers apply for gigs and help posters receive
                  suitable candidate recommendations.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  To let admins review applications, create anonymous summaries,
                  approve poster access, review completions, and manage payouts.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  To support trust and safety, including identity checks,
                  payment release controls, and temporary contact access.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  To keep basic legal, financial, operational, and audit records
                  where needed for the service.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">What posters see</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  At the recommendation stage, posters should see anonymous
                  candidate summaries such as Candidate A or Candidate B, written
                  or approved by admin.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Posters should not automatically see a worker’s full name,
                  personal contact details, CV, identity documents, or private
                  verification information.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
              <h2 className="text-3xl font-black">Important note</h2>
              <p className="mt-4 max-w-4xl leading-8 text-white/75">
                This is a practical MVP privacy summary, not final legal advice.
                Before launch, Gigtree should have a proper privacy policy,
                cookie policy if needed, data retention rules, deletion process,
                processor list, and UK GDPR review.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
