"use client";

import { supabase } from "@/lib/supabase";

export function SignOutButton() {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full border border-[#172014]/20 px-4 py-2"
    >
      Sign out
    </button>
  );
}
