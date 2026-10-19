"use client";

import { useActionState } from "react";
import { signIn, signOut } from "@/app/staff-login/actions";

export function StaffLogin() {
  const [error, formAction, pending] = useActionState(signIn, null);

  return (
    <form
      action={(form) => {
        form.set("next", new URLSearchParams(window.location.search).get("next") ?? "");
        formAction(form);
      }}
      className="card space-y-4"
    >
      <label className="block space-y-1">
        <span className="label">Staff password</span>
        <input className="input" type="password" name="password" autoComplete="current-password" required autoFocus />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function StaffSignOut() {
  return (
    <form action={signOut}>
      <button className="btn-quiet text-sm">Sign out</button>
    </form>
  );
}
