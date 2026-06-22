"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SiteHeaderProps = {
  active?: string;
};

const userLinks = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard" },
  { label: "Gigs", href: "/gigs", key: "gigs" },
  { label: "Applications", href: "/applications", key: "applications" },
  { label: "Post", href: "/post-gig", key: "post" },
  { label: "Status", href: "/status", key: "status" },
];

export function SiteHeader({ active }: SiteHeaderProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsSignedIn(Boolean(user));

    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    setIsAdmin(Boolean(data?.is_admin));
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setIsAdmin(false);
    window.location.href = "/";
  }

  const links = isAdmin
    ? [...userLinks, { label: "Admin", href: "/admin", key: "admin" }]
    : userLinks;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f6f3e] text-xl text-white shadow-lg shadow-[#2f6f3e]/20">
          ✦
        </span>
        <span className="text-2xl font-black tracking-tight">Gigtree</span>
      </Link>

      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {isSignedIn &&
          links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`rounded-full px-4 py-2 ${
                active === link.key
                  ? "bg-white shadow-sm ring-1 ring-black/10"
                  : "hover:bg-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

        {!isSignedIn && (
          <Link
            href="/login"
            className="rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
          >
            Sign in
          </Link>
        )}

        {isSignedIn && (
          <button
            type="button"
            onClick={signOut}
            className="rounded-full bg-white px-5 py-2.5 shadow-sm ring-1 ring-black/10 hover:bg-[#f6f8f4]"
          >
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
