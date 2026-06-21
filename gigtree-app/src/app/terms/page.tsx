import { SiteHeader } from "@/components/site-header";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfff6] text-[#142014]">
      <section className="relative overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#b9f36b]/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#7ed957]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#ffe08a]/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <SiteHeader active="terms" />

          <div className="grid gap-8 py-16 lg:grid-cols-[1fr_380px]">
            <div>
              <p className="font-semibold text-[#2f6f3e]">Terms</p>
              <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Clear rules for a trusted gig flow.
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-8 text-[#42513c]">
                These draft MVP terms explain how Gigtree is intended to work:
                reviewed posters, private applications, admin recommendations,
                temporary contact, completion checks, verification, and controlled
                payout release.
              </p>
            </div>

            <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/10 ring-1 ring-black/10">
              <h2 className="text-2xl font-black">Plain-English summary</h2>
              <div className="mt-5 grid gap-3 text-sm text-[#42513c]">
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  Users must be 18 or over.
                </p>
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  Posters need approval before posting gigs.
                </p>
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  Workers apply through profiles and admin review.
                </p>
                <p className="rounded-2xl bg-[#f6f8f4] p-4">
                  Payouts require completion and verification checks.
                </p>
              </div>
            </aside>
          </div>

          <div className="grid gap-8 pb-16">
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
                <p className="font-semibold text-[#b9f36b]">18+ only</p>
                <h2 className="mt-2 text-3xl font-black">Adults only</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Gigtree is intended for users aged 18 or over. Users should not
                  create an account or apply/post if they are under 18.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Reviewed posting</p>
                <h2 className="mt-2 text-3xl font-black">Posters need approval</h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  A user can request poster access, but Gigtree may approve,
                  reject, pause, or remove posting access.
                </p>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
                <p className="font-semibold text-[#2f6f3e]">Controlled matching</p>
                <h2 className="mt-2 text-3xl font-black">Admin review matters</h2>
                <p className="mt-3 text-sm leading-6 text-[#42513c]">
                  Admin recommendations help posters choose, but they are not a
                  promise, warranty, background check, or guaranteed outcome.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">Using Gigtree</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Users should provide accurate account, profile, gig, payment,
                  and verification information. False, misleading, unsafe, or
                  abusive use may lead to removal from Gigtree.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Workers should only apply for gigs they can reasonably perform.
                  Posters should only post lawful, safe, fairly described gigs.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Gigtree may review, moderate, pause, hide, reject, or remove
                  accounts, profiles, gigs, applications, recommendations, or
                  contact access where needed for safety or trust.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Users should not use Gigtree for illegal work, unsafe requests,
                  harassment, discrimination, scams, off-platform payment
                  avoidance, or attempts to bypass the review process.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">Worker applications</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Workers apply using their Gigtree profile. A strong profile may
                  include skills, experience, location area, availability,
                  portfolio links, and CV information.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Applying does not guarantee recommendation, selection, contact,
                  payment, or future work. Admin review and poster choice are part
                  of the process.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Posters should first see anonymous candidate summaries rather
                  than a worker’s full identity, CV, private documents, or direct
                  contact details.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  If a worker is selected by a poster, the worker may still need
                  to accept before temporary contact details open.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">Payments and payouts</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Gigtree’s intended flow is that payment is taken upfront and
                  held while the gig progresses. The MVP may use placeholder
                  payment states until final payment integration is added.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Payout release should depend on poster completion confirmation,
                  admin completion review, and worker verification where required.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Gigtree may apply a commission or platform fee. Payment records
                  may show total amount, commission amount, and worker payout
                  amount.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Workers may need to complete identity or payout-readiness
                  verification before funds are released.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/10">
              <h2 className="text-3xl font-black">Contact and conduct</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Temporary contact details are intended for coordinating the
                  accepted gig only. Users should not misuse contact details,
                  spam, harass, or pressure others.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Users should not try to bypass Gigtree’s payment, verification,
                  recommendation, or completion process.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Posters should not ask workers for unnecessary sensitive
                  documents or private information outside the Gigtree process.
                </p>

                <p className="rounded-2xl bg-[#f6f8f4] p-4 leading-7 text-[#42513c]">
                  Workers should pause and ask for help if a gig changes, feels
                  unsafe, becomes unclear, or asks for unpaid extra work.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] bg-[#142014] p-6 text-white shadow-sm">
              <h2 className="text-3xl font-black">Important legal note</h2>
              <p className="mt-4 max-w-4xl leading-8 text-white/75">
                These are draft MVP terms for product testing and should not be
                treated as final legal terms. Before launch, Gigtree should get
                proper legal review for UK consumer law, employment status,
                marketplace liability, data protection, payments, safeguarding,
                insurance, tax, dispute handling, and platform terms.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
