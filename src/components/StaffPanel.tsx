"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { DAY_NAMES, describeSession } from "@/lib/schedule";
import type { Signup, SignupStatus } from "@/lib/types";
import { useBanks } from "./useBanks";

export function StaffPanel() {
  return (
    <div className="space-y-8">
      <Signups />
      <Banks />
    </div>
  );
}

function Signups() {
  const [signups, setSignups] = useState<Signup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    api<Signup[]>("/api/signups").then(setSignups, (e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function setStatus(id: number, status: SignupStatus) {
    try {
      await api(`/api/signups/${id}`, { method: "PATCH", json: { status } });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Businesses and volunteers</h2>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!signups ? (
        <p className="text-muted">Loading…</p>
      ) : signups.length === 0 ? (
        <p className="card text-muted">No sign-ups yet. Share the Help out page to get some.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {signups.map((s) => (
            <li key={s.id} className="card space-y-1 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">
                  {s.organisation ?? s.name}
                  <span className="block text-xs font-normal text-muted">
                    {s.kind === "business" ? `Business · contact ${s.name}` : "Volunteer"}
                    {s.canDeliver && " · can deliver"}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    s.status === "approved" ? "bg-accent-soft text-accent" : s.status === "declined" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p>
                <a className="underline" href={`mailto:${s.email}`}>
                  {s.email}
                </a>
                {s.phone && ` · ${s.phone}`}
                {s.postcode && ` · ${s.postcode}`}
              </p>
              {s.offer && <p>{s.offer}</p>}
              {s.availability && <p className="text-muted">When: {s.availability}</p>}
              <div className="flex gap-2 pt-1">
                {s.status !== "approved" && (
                  <button className="btn px-3 py-1 text-sm" onClick={() => setStatus(s.id, "approved")}>
                    Approve
                  </button>
                )}
                {s.status !== "declined" && (
                  <button className="btn-quiet px-3 py-1 text-sm" onClick={() => setStatus(s.id, "declined")}>
                    Decline
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Banks() {
  const { banks, error: loadError, reload } = useBanks();
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState({ lat: "", lng: "" });

  async function addBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const text = (k: string) => String(f.get(k) ?? "").trim() || null;
    setError(null);
    try {
      await api("/api/banks", {
        method: "POST",
        json: {
          name: text("name"),
          address: text("address"),
          lat: Number(coords.lat),
          lng: Number(coords.lng),
          phone: text("phone"),
          website: text("website"),
          notes: text("notes"),
        },
      });
      form.reset();
      setCoords({ lat: "", lng: "" });
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addSession(e: React.FormEvent<HTMLFormElement>, foodBankId: number) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const repeat = String(f.get("repeat"));
    setError(null);
    try {
      await api("/api/sessions", {
        method: "POST",
        json: {
          foodBankId,
          dayOfWeek: repeat === "once" ? null : Number(repeat),
          date: repeat === "once" ? String(f.get("date")) : null,
          opens: String(f.get("opens")),
          closes: String(f.get("closes")),
          note: String(f.get("note") ?? "").trim() || null,
        },
      });
      form.reset();
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeSession(id: number) {
    setError(null);
    try {
      await api(`/api/sessions/${id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Food banks and opening times</h2>
      {(error ?? loadError) && <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{error ?? loadError}</p>}
      {banks?.map((bank) => (
        <div key={bank.id} className="card space-y-2">
          <h3 className="font-semibold">
            {bank.name} {bank.isDemo && <span className="text-xs font-normal text-warn">(example)</span>}
          </h3>
          <p className="text-sm text-muted">{bank.address}</p>
          <ul className="text-sm">
            {bank.sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-0.5">
                {describeSession(s)}
                <button className="text-xs text-danger underline" onClick={() => removeSession(s.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => addSession(e, bank.id)} className="flex flex-wrap items-end gap-2 text-sm">
            <label>
              <span className="label">Repeats</span>
              <select name="repeat" className="input" defaultValue="6">
                {DAY_NAMES.map((d, i) => (
                  <option key={d} value={i}>
                    Every {d}
                  </option>
                ))}
                <option value="once">One date only</option>
              </select>
            </label>
            <label>
              <span className="label">Date (one-off)</span>
              <input name="date" type="date" className="input" />
            </label>
            <label>
              <span className="label">Opens</span>
              <input name="opens" type="time" className="input" required defaultValue="10:00" />
            </label>
            <label>
              <span className="label">Closes</span>
              <input name="closes" type="time" className="input" required defaultValue="12:00" />
            </label>
            <label className="min-w-40 flex-1">
              <span className="label">Note</span>
              <input name="note" className="input" placeholder="e.g. Weekend food bank" maxLength={200} />
            </label>
            <button className="btn-quiet">Add time</button>
          </form>
        </div>
      ))}

      <form onSubmit={addBank} className="card space-y-3">
        <h3 className="font-semibold">Add a food bank</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="label">Name</span>
            <input name="name" className="input" required maxLength={200} />
          </label>
          <label>
            <span className="label">Address</span>
            <input name="address" className="input" required maxLength={300} />
          </label>
          <label>
            <span className="label">Latitude</span>
            <input className="input" required inputMode="decimal" value={coords.lat} onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))} />
          </label>
          <label>
            <span className="label">Longitude</span>
            <input className="input" required inputMode="decimal" value={coords.lng} onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))} />
          </label>
          <label>
            <span className="label">Phone</span>
            <input name="phone" className="input" maxLength={50} />
          </label>
          <label>
            <span className="label">Website</span>
            <input name="website" type="url" className="input" placeholder="https://" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Notes for visitors</span>
            <input name="notes" className="input" maxLength={500} placeholder="e.g. Referral needed, step-free access" />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-quiet text-sm"
            onClick={() =>
              navigator.geolocation?.getCurrentPosition((p) =>
                setCoords({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) }),
              )
            }
          >
            Use where I am now
          </button>
          <button className="btn">Add food bank</button>
        </div>
        <p className="text-xs text-muted">Tip: on openstreetmap.org, right-click the building and choose &ldquo;Show address&rdquo; to copy its coordinates.</p>
      </form>
    </section>
  );
}
