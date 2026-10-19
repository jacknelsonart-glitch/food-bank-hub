"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import type { SignupKind } from "@/lib/types";

export function JoinForm() {
  const [kind, setKind] = useState<SignupKind>("volunteer");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim() || null;
    setState("sending");
    setError(null);
    try {
      await api("/api/signups", {
        method: "POST",
        json: {
          kind,
          name: text("name"),
          email: text("email"),
          phone: text("phone"),
          organisation: kind === "business" ? text("organisation") : null,
          postcode: text("postcode"),
          offer: text("offer"),
          availability: text("availability"),
          canDeliver: f.get("canDeliver") === "on",
        },
      });
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card space-y-2">
        <h2 className="text-lg font-semibold">Thank you!</h2>
        <p>Food bank staff will review your details and get in touch by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="label">I am…</legend>
        <button type="button" className="chip" aria-pressed={kind === "volunteer"} onClick={() => setKind("volunteer")}>
          A volunteer
        </button>
        <button type="button" className="chip" aria-pressed={kind === "business"} onClick={() => setKind("business")}>
          A local business (provider)
        </button>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Your name</span>
          <input className="input" name="name" required maxLength={200} autoComplete="name" />
        </label>
        <label>
          <span className="label">Email</span>
          <input className="input" name="email" type="email" required autoComplete="email" />
        </label>
        {kind === "business" && (
          <label>
            <span className="label">Business name</span>
            <input className="input" name="organisation" required maxLength={200} autoComplete="organization" />
          </label>
        )}
        <label>
          <span className="label">Phone (optional)</span>
          <input className="input" name="phone" type="tel" maxLength={50} autoComplete="tel" />
        </label>
        <label>
          <span className="label">Postcode or ZIP (optional)</span>
          <input className="input" name="postcode" maxLength={20} autoComplete="postal-code" />
        </label>
      </div>

      <label className="block">
        <span className="label">{kind === "business" ? "What can you donate?" : "How would you like to help?"}</span>
        <textarea
          className="input"
          name="offer"
          rows={3}
          maxLength={1000}
          placeholder={kind === "business" ? "e.g. day-old bread every Friday, surplus fruit and veg" : "e.g. sorting donations, driving, packing parcels"}
        />
      </label>
      <label className="block">
        <span className="label">{kind === "business" ? "When could it be collected?" : "When are you available?"}</span>
        <input className="input" name="availability" maxLength={500} placeholder="e.g. Saturday mornings" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="canDeliver" className="size-4" />
        <span>{kind === "business" ? "We can deliver to the food bank ourselves" : "I can drive and help deliver supplies"}</span>
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Sign up"}
      </button>
      <p className="text-xs text-muted">Your details are only shared with food bank staff.</p>
    </form>
  );
}
