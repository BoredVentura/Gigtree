export default function PrivacyPage() {
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
          <p className="font-semibold text-[#2f6f3e]">Privacy</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Gigtree privacy notice.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#42513c]">
            This placeholder privacy notice explains the intended MVP data use.
            It should be reviewed for UK GDPR compliance before launch.
          </p>
        </div>

        <div className="grid gap-6 rounded-3xl bg-white p-6 leading-8 shadow-sm">
          <section>
            <h2 className="text-2xl font-bold">Information we collect</h2>
            <p className="mt-2 text-[#42513c]">
              Gigtree may collect account details, worker profile information,
              gig posts, applications, verification details, uploaded documents,
              payment statuses, contact records, and audit logs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">How information is used</h2>
            <p className="mt-2 text-[#42513c]">
              Information is used to operate the marketplace, review applicants,
              manage poster access, support verification, hold and release
              payments, prevent abuse, and keep records of important actions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Document uploads</h2>
            <p className="mt-2 text-[#42513c]">
              Verification documents are stored privately and should only be
              accessible to the worker and authorised Gigtree admins.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold">Retention</h2>
            <p className="mt-2 text-[#42513c]">
              Gigtree intends to minimise stored data and keep necessary
              financial, legal, safety, and audit records for appropriate
              retention periods.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
