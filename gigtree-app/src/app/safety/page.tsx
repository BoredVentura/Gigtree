export default function SafetyPage() {
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
          <p className="font-semibold text-[#2f6f3e]">Safety</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Gigtree safety rules.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#42513c]">
            Gigtree is designed as a managed gig platform with admin review,
            identity checks, masked contact, and controlled payout release.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl bg-white p-6 leading-8 shadow-sm">
          <section>
            <h2 className="text-2xl font-bold">18+ only</h2>
            <p className="mt-2 text-[#42513c]">
              Users must be aged 18 or over to use Gigtree.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">No unsafe gigs</h2>
            <p className="mt-2 text-[#42513c]">
              Gigs must not involve unlawful work, unsafe conditions,
              harassment, discrimination, exploitation, or misleading payment
              terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Controlled contact</h2>
            <p className="mt-2 text-[#42513c]">
              Contact details are revealed only after poster selection and
              worker confirmation. Direct details should stay hidden until the
              platform allows contact.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Payout protection</h2>
            <p className="mt-2 text-[#42513c]">
              Payouts should only be released after completion confirmation and
              worker verification.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
