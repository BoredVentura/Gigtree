export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f4] text-[#172014]">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Gigtree
          </a>
          <a href="/dashboard" className="text-sm hover:underline">
            Dashboard
          </a>
        </nav>

        <div className="py-12">
          <p className="font-semibold text-[#2f6f3e]">Terms</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Gigtree terms of use.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#42513c]">
            These placeholder terms explain the intended rules for the Gigtree
            MVP. They should be reviewed by a qualified UK legal professional
            before launch.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl bg-white p-6 leading-8 shadow-sm">
          <section>
            <h2 className="text-2xl font-bold">1. Eligibility</h2>
            <p className="mt-2 text-[#42513c]">
              Gigtree is intended for users aged 18 or over. By using the
              service, you confirm that you are at least 18 years old.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">2. Managed marketplace</h2>
            <p className="mt-2 text-[#42513c]">
              Gigtree helps posters and workers connect through a managed
              application, recommendation, confirmation, contact, and payment
              workflow. Admin review may be required before actions continue.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">3. Verification</h2>
            <p className="mt-2 text-[#42513c]">
              Workers may need to submit identity or eligibility information
              before applying to high-trust gigs or receiving payouts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">4. Payments</h2>
            <p className="mt-2 text-[#42513c]">
              Gigtree intends to hold gig payments before work begins and only
              release payouts after completion and verification checks. The
              current MVP payment flow is a placeholder until a payment provider
              is connected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">5. Safety and conduct</h2>
            <p className="mt-2 text-[#42513c]">
              Users must not post unlawful, unsafe, misleading, discriminatory,
              exploitative, or abusive gigs or applications. Gigtree may remove
              content or restrict accounts where needed.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
