"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsSignedIn(Boolean(user));
    }

    loadUser();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfff6] text-[#142014]">
      <section className="relative">
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
              <a href="/gigs" className="rounded-full px-4 py-2 hover:bg-white">
                Browse gigs
              </a>
              <a href="#how-it-works" className="rounded-full px-4 py-2 hover:bg-white">
                How it works
              </a>
              <a
                href={isSignedIn ? "/dashboard" : "/login"}
                className="rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
              >
                {isSignedIn ? "Dashboard" : "Sign in"}
              </a>
            </div>
          </nav>

          <div className="grid items-center gap-12 py-20 lg:grid-cols-[1fr_460px] lg:py-28">
            <div>
              <div className="mb-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2f6f3e] shadow-sm ring-1 ring-black/10">
                UK local + online gigs, reviewed by humans
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
                Find good gigs.
                <span className="block text-[#2f6f3e]">Get picked with trust.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#465445]">
                Gigtree helps workers apply privately for flexible local and
                online work. Admins review applicants, recommend trusted
                candidates, and keep payments protected until the job is done.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/gigs"
                  className="rounded-full bg-[#2f6f3e] px-7 py-4 font-bold text-white shadow-xl shadow-[#2f6f3e]/20 hover:bg-[#255a33]"
                >
                  Browse gigs
                </a>
                <a
                  href="/post-request"
                  className="rounded-full bg-white px-7 py-4 font-bold shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
                >
                  Post a gig
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 text-sm font-semibold text-[#42513c]">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/10">
                  Home help
                </span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/10">
                  Events
                </span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/10">
                  Admin
                </span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/10">
                  Design
                </span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/10">
                  Remote work
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 -top-6 h-full w-full rounded-[2rem] bg-[#2f6f3e]/10" />
              <div className="relative rounded-[2rem] bg-white p-5 shadow-2xl shadow-black/10 ring-1 ring-black/10">
                <div className="rounded-[1.5rem] bg-[#142014] p-6 text-white">
                  <p className="text-sm font-bold text-[#b9f36b]">
                    Live marketplace flow
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    Safer matching, without the awkward cold start.
                  </h2>
                  <p className="mt-4 leading-7 text-white/75">
                    Workers apply once with a profile. Posters get anonymous
                    admin-written summaries before choosing.
                  </p>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-3xl border border-black/10 bg-[#fbfff6] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">Candidate A recommended</p>
                        <p className="mt-1 text-sm text-[#42513c]">
                          Local, available Sunday, strong experience.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#b9f36b]/40 px-3 py-1 text-xs font-black text-[#2f6f3e]">
                        Reviewed
                      </span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-black/10 bg-white p-5">
                    <p className="font-bold">Payment held safely</p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#e8f0e4]">
                      <div className="h-full w-3/4 rounded-full bg-[#2f6f3e]" />
                    </div>
                    <p className="mt-2 text-sm text-[#42513c]">
                      Released after completion + verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-3xl bg-[#fff7e8] p-5">
                      <p className="text-2xl font-black">18+</p>
                      <p className="mt-1 text-sm text-[#42513c]">
                        Adults only
                      </p>
                    </div>
                    <div className="rounded-3xl bg-[#e8f0e4] p-5">
                      <p className="text-2xl font-black">Masked</p>
                      <p className="mt-1 text-sm text-[#42513c]">
                        Contact controlled
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section
            id="how-it-works"
            className="grid gap-5 pb-16 md:grid-cols-3"
          >
            <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/10">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0e4] text-xl">
                1
              </div>
              <h3 className="text-2xl font-black">Build your profile</h3>
              <p className="mt-3 leading-7 text-[#42513c]">
                Add skills, availability, experience, and CV privately.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/10">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0e4] text-xl">
                2
              </div>
              <h3 className="text-2xl font-black">Apply privately</h3>
              <p className="mt-3 leading-7 text-[#42513c]">
                Admins review applications and recommend the best fits.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/10">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0e4] text-xl">
                3
              </div>
              <h3 className="text-2xl font-black">Work and get paid</h3>
              <p className="mt-3 leading-7 text-[#42513c]">
                Payment stays protected until completion and verification.
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="bg-[#142014] px-6 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-bold text-[#b9f36b]">For workers</p>
            <h2 className="mt-3 text-4xl font-black">
              Apply once. Be matched better.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Instead of sending your details everywhere, create a fuller
              profile and let Gigtree recommend you when you are a good fit.
            </p>
          </div>

          <div>
            <p className="font-bold text-[#b9f36b]">For posters</p>
            <h2 className="mt-3 text-4xl font-black">
              Get trusted candidates, not a messy inbox.
            </h2>
            <p className="mt-5 leading-8 text-white/70">
              Posters request access, post gigs after approval, and receive
              anonymous candidate summaries before choosing.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-[#fbfff6] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-[#42513c]">
          <p>© Gigtree</p>
          <div className="flex gap-4">
            <a href="/terms" className="hover:underline">
              Terms
            </a>
            <a href="/privacy" className="hover:underline">
              Privacy
            </a>
            <a href="/safety" className="hover:underline">
              Safety
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
